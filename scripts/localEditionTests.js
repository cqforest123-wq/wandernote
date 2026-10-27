const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { parse } = require('@babel/parser');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));

async function loadModule(file, mocks = {}) {
  const context = vm.createContext({});
  const modules = new Map();
  async function getModule(name) {
    if (modules.has(name)) return modules.get(name);
    let module;
    if (Object.hasOwn(mocks, name)) {
      const exports = mocks[name];
      module = new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      }, { context });
    } else {
      module = new vm.SourceTextModule(read(name), { context });
    }
    modules.set(name, module);
    await module.link(specifier => getModule(specifier.startsWith('.')
      ? `${path.posix.join(path.posix.dirname(name), specifier)}.js`
      : specifier));
    return module;
  }
  const module = await getModule(file);
  await module.evaluate();
  return module.namespace;
}

async function localStore(initial = {}, options = {}) {
  const disk = new Map(Object.entries(initial));
  const writes = [];
  const storage = {
    async getItem(key) { return disk.get(key) ?? null; },
    async setItem(key, value) {
      if (options.beforeWrite) await options.beforeWrite(key, value);
      writes.push([key, value]);
      disk.set(key, value);
    },
  };
  const data = await loadModule('lib/localData.js', {
    '@react-native-async-storage/async-storage': { default: storage },
  });
  return { data, disk, writes };
}

test('existing local trips and memos keep their original storage keys and data', async () => {
  const trips = [{ id: 7, city: 'Kyoto', days: [], customLegacyField: 'keep' }];
  const memos = [{ id: 3, tripId: 7, category: 'packing', items: [] }];
  const store = await localStore({
    '@wandernote_trips': JSON.stringify(trips), '@wandernote_memos': JSON.stringify(memos),
  });
  assert.deepEqual(plain(await store.data.loadLocalTrips()), trips);
  assert.deepEqual(plain(await store.data.loadLocalMemos()), memos);
  assert.equal(store.writes.length, 0);
});

test('empty install works offline without account or session', async () => {
  const { data } = await localStore();
  assert.deepEqual(plain(await data.loadLocalTrips()), []);
  assert.deepEqual(plain(await data.loadLocalMemos()), []);
});

test('100 trips and packing lists save and reload without a plan-based limit', async () => {
  const { data, disk } = await localStore();
  const records = Array.from({ length: 100 }, (_, id) => ({ id, days: [], category: 'packing' }));
  await data.saveLocalTrips(records);
  await data.saveLocalMemos(records);
  const restarted = await localStore(Object.fromEntries(disk));
  assert.equal((await restarted.data.loadLocalTrips()).length, 100);
  assert.equal((await restarted.data.loadLocalMemos()).length, 100);
});

test('writes are serialized and loads wait for the newest completed write', async () => {
  let finish;
  const gate = new Promise(resolve => { finish = resolve; });
  let calls = 0;
  const { data } = await localStore({}, { beforeWrite: async () => { if (++calls === 1) await gate; } });
  const first = data.saveLocalTrips([{ id: 1 }]);
  const second = data.saveLocalTrips([{ id: 2 }]);
  const loaded = data.loadLocalTrips();
  await Promise.resolve();
  assert.equal(calls, 1);
  finish();
  await Promise.all([first, second]);
  assert.deepEqual(plain(await loaded), [{ id: 2 }]);
});

test('failed saves reject, preserve disk contents and allow retry', async () => {
  let fail = true;
  const { data, disk } = await localStore({ '@wandernote_trips': '[{"id":1}]' }, {
    beforeWrite: () => { if (fail) throw new Error('Disk full'); },
  });
  await assert.rejects(data.saveLocalTrips([{ id: 2 }]), /Disk full/);
  assert.equal(disk.get('@wandernote_trips'), '[{"id":1}]');
  fail = false;
  await data.saveLocalTrips([{ id: 2 }]);
  assert.deepEqual(plain(await data.loadLocalTrips()), [{ id: 2 }]);
});

test('malformed saved data is not silently reset or overwritten', async () => {
  for (const raw of ['{broken', '{}', 'null']) {
    const { data, disk, writes } = await localStore({ '@wandernote_trips': raw, '@wandernote_memos': raw });
    await assert.rejects(data.loadLocalTrips());
    await assert.rejects(data.loadLocalMemos());
    await assert.rejects(data.removeLocalPackingListsForTrip(1));
    assert.equal(disk.get('@wandernote_trips'), raw);
    assert.equal(disk.get('@wandernote_memos'), raw);
    assert.equal(writes.length, 0);
  }
});

test('trip deletion removes only its linked packing lists, not other notes', async () => {
  const memos = [
    { id: 1, category: 'packing', tripId: 7 }, { id: 2, category: 'packing', tripId: '7' },
    { id: 3, category: 'note', tripId: 7 }, { id: 4, category: 'packing', tripId: 8 },
    { id: 5, category: 'packing', tripId: null },
  ];
  const { data } = await localStore({ '@wandernote_memos': JSON.stringify(memos) });
  await data.removeLocalPackingListsForTrip(7);
  assert.deepEqual(plain(await data.loadLocalMemos()).map(m => m.id), [3, 4, 5]);
  await assert.rejects(data.removeLocalPackingListsForTrip(null), /Missing trip/);
});

async function mediaStore(files = [], failCopy = false) {
  const existing = new Set(files);
  const copies = [];
  const api = {
    documentDirectory: 'file:///new/Documents/', cacheDirectory: 'file:///new/Library/Caches/',
    async makeDirectoryAsync() {},
    async getInfoAsync(uri) { return { exists: existing.has(uri) }; },
    async copyAsync(copy) {
      if (failCopy) throw new Error('Disk full');
      assert.ok(existing.has(copy.from), 'copy source exists');
      copies.push(copy);
      existing.add(copy.to);
    },
    async deleteAsync(uri) { existing.delete(uri); },
  };
  const data = await loadModule('lib/localMedia.js', { 'expo-file-system/legacy': api });
  return { data, existing, copies };
}

test('new media is copied out of cache into documents with unique filenames', async () => {
  const source = 'file:///new/Library/Caches/photo.jpg';
  const { data, copies } = await mediaStore([source]);
  const first = await data.storeLocalMedia(source);
  const second = await data.storeLocalMedia(source);
  assert.match(first, /^file:\/\/\/new\/Documents\/wandernote-media\/.+\.jpg$/);
  assert.notEqual(first, second);
  assert.equal(await data.storeLocalMedia(first), first);
  assert.equal(copies.length, 2);
  await assert.rejects(data.storeLocalMedia('https://example.com/photo.jpg'), /local media/);
});

test('media errors do not create a saved record pointing to a failed copy', async () => {
  const source = 'file:///new/Library/Caches/photo.jpg';
  const { data } = await mediaStore([source], true);
  await assert.rejects(data.storeLocalMedia(source), /Disk full/);
  assert.equal(await data.preserveExistingMedia(source), source);
});

test('old cache photos are preserved; missing and remote media references are retained', async () => {
  const source = 'file:///new/Library/Caches/photo.jpg';
  const { data } = await mediaStore([source, 'file:///new/Documents/wandernote-media/avatar.jpg']);
  assert.equal(await data.preserveExistingMedia('file:///old/Documents/wandernote-media/avatar.jpg'),
    'file:///new/Documents/wandernote-media/avatar.jpg');
  const trips = [{ id: 1, days: [{ photos: [
    { id: 1, uri: 'file:///old/Library/Caches/photo.jpg' },
    { id: 2, uri: 'file:///missing.jpg' }, { id: 3, uri: 'https://example.com/old.jpg' },
  ] }] }];
  const saved = await data.preserveTripMedia(trips);
  assert.match(saved[0].days[0].photos[0].uri, /Documents\/wandernote-media\//);
  assert.equal(saved[0].days[0].photos[1].uri, 'file:///missing.jpg');
  assert.equal(saved[0].days[0].photos[2].uri, 'https://example.com/old.jpg');
  assert.equal(trips[0].days[0].photos[0].uri, 'file:///old/Library/Caches/photo.jpg');
  assert.equal(await data.preserveTripMedia(saved), saved);
});

test('all local draft modes, including empty trips, produce usable offline text', async () => {
  const drafts = await loadModule('lib/travelStoryFallback.js');
  const trip = { city: 'Kyoto', days: [{ date: '2026-10-14', memos: [{ text: 'A quiet garden' }], photos: [{}] }] };
  for (const mode of ['diary', 'social', 'summary']) {
    assert.ok(drafts.buildLocalTravelStory({ mode }).length > 50);
    const text = drafts.buildLocalTravelStory({ mode, trip });
    assert.match(text, /Kyoto/);
    assert.match(text, /A quiet garden/);
  }
  assert.match(drafts.buildLocalItinerary({ destination: 'Kyoto', days: '3' }), /Day 3/);
  assert.ok(drafts.buildLocalItinerary().length > 50);
  assert.equal(Object.keys(drafts.buildLocalPackingGroups('Kyoto', '3').groups).length, 6);
});

test('AI trip picker keeps the translation function unshadowed in trip rows', () => {
  const ast = parse(read('screens/AIScreen.js'), { sourceType: 'module', plugins: ['jsx'] });
  let tripPicker;
  visit(ast, node => {
    if (node.type === 'CallExpression'
      && node.callee.type === 'MemberExpression'
      && node.callee.object.name === 'trips'
      && node.callee.property.name === 'map') {
      tripPicker = node;
    }
  });
  assert.ok(tripPicker, 'trips.map should render the available trip rows');
  assert.notEqual(tripPicker.arguments[0].params[0].name, 't', 'trip row must not shadow useTranslation().t');
  assert.match(read('screens/AIScreen.js'), /trip\.days\.length\}\s*\{t\('unit_days'/);
});

test('local search finds trips and dated journal notes without a backend', async () => {
  const { searchLocalTravelData } = await loadModule('lib/localSearch.js');
  const trips = [
    { id: 1, city: 'Kyoto', country: 'Japan', date: '2026.04', days: [
      { date: '2026.04.10', memos: [{ id: 2, text: 'Quiet walk through the bamboo grove', tag: '景色' }] },
    ] },
    { id: 3, city: 'Taipei', country: 'Taiwan', days: [] },
  ];
  const noteResults = searchLocalTravelData(trips, 'BAMBOO');
  assert.deepEqual(plain(noteResults.trips.map(trip => trip.id)), [1]);
  assert.equal(noteResults.notes[0].day.date, '2026.04.10');
  assert.equal(noteResults.notes[0].memo.id, 2);
  assert.deepEqual(plain(searchLocalTravelData(trips, 'japan').trips.map(trip => trip.id)), [1]);
  assert.deepEqual(plain(searchLocalTravelData(trips, '2026.04.10').trips.map(trip => trip.id)), [1]);
  assert.deepEqual(plain(searchLocalTravelData(trips, '').trips.map(trip => trip.id)), [1, 3]);
});

test('day memo filters include all tags and normalize legacy Chinese tags', async () => {
  const { filterDayMemos, sortDayMemos } = await loadModule('lib/dayMemoFilters.js');
  const memos = [
    { id: 1, text: 'noodles', tag: 'food' },
    { id: 2, text: 'old record', tag: '美食' },
    { id: 3, text: 'mountain', tag: 'scenery' },
    { id: 4, text: 'untagged legacy' },
  ];
  assert.deepEqual(plain(filterDayMemos(memos, 'food').map(memo => memo.id)), [1, 2]);
  assert.deepEqual(plain(filterDayMemos(memos, 'feeling').map(memo => memo.id)), [4]);
  assert.deepEqual(plain(filterDayMemos(memos, 'all').map(memo => memo.id)), [1, 2, 3, 4]);
  const favorites = [{ id: 5, isFavorite: true }, { id: 6, isFavorite: false }];
  assert.deepEqual(plain(filterDayMemos(favorites, 'favorites').map(memo => memo.id)), [5]);
  assert.deepEqual(plain(sortDayMemos([{ id: 1, time: '08:15' }, { id: 2, time: '19:40' }]).map(memo => memo.id)), [2, 1]);
  assert.deepEqual(plain(sortDayMemos([{ id: 1, time: '08:15' }, { id: 2, time: '19:40' }], 'oldest').map(memo => memo.id)), [1, 2]);
});

test('trip journal search and content filters combine and keep requested date order', async () => {
  const { filterTripDays } = await loadModule('lib/tripTimeline.js');
  const days = [
    { date: '2026.05.03', memos: [{ text: 'Museum visit' }], photos: [] },
    { date: '2026.05.01', memos: [], photos: [{ uri: 'local' }] },
    { date: '2026.05.02', memos: [{ text: 'Museum cafe' }], photos: [{ uri: 'local' }] },
  ];
  assert.deepEqual(plain(filterTripDays(days, { query: 'MUSEUM', content: 'notes', order: 'oldest' }).map(day => day.date)), ['2026.05.02', '2026.05.03']);
  assert.deepEqual(plain(filterTripDays(days, { content: 'photos', order: 'newest' }).map(day => day.date)), ['2026.05.02', '2026.05.01']);
  assert.deepEqual(days.map(day => day.date), ['2026.05.03', '2026.05.01', '2026.05.02']);
});

test('year report summary counts destinations and shares totals without exposing media paths', async () => {
  const { summarizeYearTrips, buildYearReportShareText } = await loadModule('lib/yearReportSummary.js');
  const stats = summarizeYearTrips([
    { country: 'Japan', days: [{ memos: [{ text: 'Noodles' }], photos: [{ uri: 'file:///private/photo.jpg' }] }] },
    { country: 'Japan', days: [{ memos: [], photos: [] }] },
    { country: 'Taiwan', days: [{ memos: [{ text: 'Night market' }], photos: [] }] },
  ]);
  assert.deepEqual(plain(stats), {
    tripCount: 3, dayCount: 3, memoCount: 2, photoCount: 1,
    countries: [['Japan', 2], ['Taiwan', 1]],
  });
  const message = buildYearReportShareText('2026', stats, {
    title: year => `${year} Travel Report`,
    tripCount: count => `Trips: ${count}`,
    countryCount: count => `Destinations: ${count}`,
    dayCount: count => `Days: ${count}`,
    memoCount: count => `Notes: ${count}`,
    photoCount: count => `Photos: ${count}`,
    countriesHeading: 'Visited destinations', source: 'WanderNote',
  });
  assert.match(message, /Japan: 2/);
  assert.match(message, /Taiwan: 1/);
  assert.doesNotMatch(message, /file:|private\/photo/);
});

test('day share summary contains localized notes and counts but never local media paths', async () => {
  const { buildDayShareText } = await loadModule('lib/dayShareText.js');
  const message = buildDayShareText({
    trip: { emoji: '🌸', city: 'Kyoto', country: 'Japan' },
    day: {
      date: '2026.04.10',
      memos: [
        { id: 1, text: 'Tried a small noodle shop', tag: '美食' },
        { id: 2, text: 'Walked under cherry blossoms', tag: 'scenery' },
      ],
      photos: [{ uri: 'file:///private/app/path/photo.jpg' }],
    },
    dayNumber: 2,
    labels: {
      dayHeading: (number, date) => `Day ${number} · ${date}`,
      photoCount: count => `${count} photos`,
      source: 'Shared from WanderNote',
      note: 'Note',
      tags: { food: 'Food', scenery: 'Scenery' },
    },
  });
  assert.match(message, /Kyoto Japan/);
  assert.match(message, /Day 2 · 2026\.04\.10/);
  assert.match(message, /Food: Tried a small noodle shop/);
  assert.match(message, /Scenery: Walked under cherry blossoms/);
  assert.match(message, /1 photos/);
  assert.doesNotMatch(message, /file:|private\/app\/path/);
});

test('day navigation sorts dates and returns adjacent records without mutating input', async () => {
  const { getDayNavigation } = await loadModule('lib/dayNavigation.js');
  const days = [{ date: '2026.04.12' }, { date: '2026.04.10' }, { date: '2026.04.11' }];
  const middle = getDayNavigation(days, '2026.04.11');
  assert.equal(middle.index, 1);
  assert.equal(middle.total, 3);
  assert.equal(middle.previous.date, '2026.04.10');
  assert.equal(middle.next.date, '2026.04.12');
  assert.equal(getDayNavigation(days, '2026.04.10').previous, null);
  assert.equal(getDayNavigation(days, '2026.04.12').next, null);
  assert.deepEqual(days.map(day => day.date), ['2026.04.12', '2026.04.10', '2026.04.11']);
});

test('trip share includes every day and note in date order without leaking local media paths', async () => {
  const { buildTripShareText } = await loadModule('lib/tripShareText.js');
  const message = buildTripShareText({
    trip: {
      emoji: '🌸', city: 'Kyoto', country: 'Japan', date: '2026.04.10',
      days: [
        { date: '2026.04.11', memos: [{ text: 'Temple at dusk', tag: 'scenery' }], photos: [] },
        { date: '2026.04.10', memos: [{ text: 'Noodle shop', tag: '美食' }], photos: [{ uri: 'file:///private/photo.jpg' }] },
      ],
    },
    labels: {
      tripDate: date => `Trip date: ${date}`,
      dayHeading: (number, date) => `Day ${number} · ${date}`,
      photoCount: count => `${count} photos`,
      source: 'From WanderNote', note: 'Note', tags: { food: 'Food', scenery: 'Scenery' },
    },
  });
  assert.ok(message.indexOf('Day 1 · 2026.04.10') < message.indexOf('Day 2 · 2026.04.11'));
  assert.match(message, /Food: Noodle shop/);
  assert.match(message, /Scenery: Temple at dusk/);
  assert.match(message, /1 photos/);
  assert.doesNotMatch(message, /file:|private\/photo/);
});

function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => visit(child, callback));
    else if (value && typeof value === 'object') visit(value, callback);
  }
}

function appGraph() {
  const visited = new Set();
  const translations = new Set();
  function walk(file) {
    if (visited.has(file)) return;
    visited.add(file);
    assert.doesNotMatch(file, /(?:AuthScreen|PaywallScreen|supabase|claude|sync\.js|accountDeletion|purchases)/);
    const ast = parse(read(file), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
    visit(ast, node => {
      if (node.type === 'CallExpression' && node.callee.name === 't' && node.arguments[0]?.type === 'StringLiteral') {
        translations.add(node.arguments[0].value);
      }
      let specifier;
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type)) specifier = node.source?.value;
      if (node.type === 'CallExpression' && node.callee.name === 'require') {
        assert.equal(node.arguments[0]?.type, 'StringLiteral', 'no hidden dynamic require');
        specifier = node.arguments[0].value;
      }
      if (!specifier) return;
      assert.doesNotMatch(specifier, /supabase|purchases|revenuecat|claude|admob|google-mobile-ads/i);
      if (!specifier.startsWith('.')) return;
      const base = path.posix.join(path.posix.dirname(file), specifier);
      const resolved = [base, `${base}.js`, `${base}.ts`, `${base}/index.js`]
        .find(candidate => fs.existsSync(path.join(root, candidate)) && fs.statSync(path.join(root, candidate)).isFile());
      assert.ok(resolved, `resolve ${file}: ${specifier}`);
      if (/\.[jt]sx?$/.test(resolved)) walk(resolved);
    });
  }
  walk('App.js');
  return { visited, translations };
}

test('runtime graph cannot reach login, backend, online AI, purchases or ad SDKs', () => {
  const { visited, translations } = appGraph();
  assert.ok(visited.has('lib/localData.js'));
  for (const key of translations) assert.doesNotMatch(key, /^paywall_|profile_(?:pro|upgrade)|alert_pro_limit|memo_free_packing_limit/);
  for (const file of ['App.js', 'screens/HomeScreen.js', 'screens/MemoScreen.js', 'screens/ProfileScreen.js']) {
    assert.doesNotMatch(read(file), /FREE_TRIP_LIMIT|FREE_PACKING_LIMIT|isPro|freeTripLimit/);
  }
});

test('every locale has unique keys, local notices, and no online-AI promises in visible drafts', () => {
  const { translations } = appGraph();
  for (const locale of ['en', 'zh', 'ja', 'ko', 'fr', 'es', 'th']) {
    const ast = parse(read(`i18n/${locale}.js`), { sourceType: 'module' });
    const properties = ast.program.body.find(n => n.type === 'ExportDefaultDeclaration').declaration.properties;
    const dictionary = new Map();
    for (const p of properties) {
      const key = p.key.name || p.key.value;
      assert.ok(!dictionary.has(key), `${locale}: duplicate ${key}`);
      dictionary.set(key, p.value.value);
    }
    for (const key of ['local_storage_title', 'local_storage_notice', 'local_save_failed_desc', 'local_load_failed', 'local_media_failed']) {
      assert.ok(dictionary.get(key)?.length > 0, `${locale}: ${key}`);
    }
    for (const key of translations) {
      if (/^ai_|^memo_ai_|^onboarding_[34]_/.test(key)) {
        assert.doesNotMatch(dictionary.get(key) || '', /\bAI\b|人工智能|人工智慧|인공지능|ปัญญาประดิษฐ์/i, `${locale}: ${key}`);
      }
    }
  }
});
