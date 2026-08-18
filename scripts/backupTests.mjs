// Importing a backup must never destroy what is already on the device.
//
// This is the most dangerous operation in the app: it runs against a user's
// entire travel history, and a mistake here is unrecoverable. The rule is
// merge-only — an id that already exists is skipped and local data wins.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/backup.js', import.meta.url), 'utf8');

// Take only the exported pure merge. The rest of the module reaches for the
// file system, the document picker and AsyncStorage.
const start = src.indexOf('export function mergeBackup');
const { mergeBackup } = await import(
  'data:text/javascript;base64,' + Buffer.from(src.slice(start)).toString('base64')
);

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) { failed++; console.error(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`); }
};

const local = [{ id: 1, city: 'Kyoto', days: ['local'] }];
const localMemos = [{ id: 'm1', title: 'packing' }];

// The rule: a colliding id leaves the device's own copy untouched.
const collision = mergeBackup({
  currentTrips: local,
  currentMemos: localMemos,
  incomingTrips: [{ id: 1, city: 'Kyoto', days: ['FROM BACKUP'] }],
  incomingMemos: [{ id: 'm1', title: 'FROM BACKUP' }],
});
check('a colliding trip is not replaced', collision.trips[0].days, ['local']);
check('a colliding memo is not replaced', collision.memos[0].title, 'packing');
check('nothing is added on a full collision', collision.addedTrips, 0);
check('and the skip is reported', collision.skippedTrips, 1);
check('memo skip is reported too', collision.skippedMemos, 1);
check('no trip is ever lost', collision.trips.length, 1);

// Ids may differ in type between a backup and the device.
const numericVsString = mergeBackup({
  currentTrips: [{ id: 7 }],
  currentMemos: [],
  incomingTrips: [{ id: '7' }],
  incomingMemos: [],
});
check('7 and "7" are the same trip', numericVsString.trips.length, 1);
check('and it counts as skipped', numericVsString.skippedTrips, 1);

// New material is added, in order, after what is already there.
const additive = mergeBackup({
  currentTrips: local,
  currentMemos: localMemos,
  incomingTrips: [{ id: 2, city: 'Osaka' }, { id: 1, city: 'dupe' }],
  incomingMemos: [{ id: 'm2', title: 'new' }],
});
check('new trips are appended', additive.trips.map(t => t.id), [1, 2]);
check('added count', additive.addedTrips, 1);
check('skipped count', additive.skippedTrips, 1);
check('new memos are appended', additive.memos.map(m => m.id), ['m1', 'm2']);

// Restoring into an empty app is the documented way to get everything back.
const intoEmpty = mergeBackup({
  currentTrips: [],
  currentMemos: [],
  incomingTrips: [{ id: 1 }, { id: 2 }, { id: 3 }],
  incomingMemos: [{ id: 'm1' }],
});
check('an empty device takes the whole backup', intoEmpty.trips.length, 3);
check('nothing skipped', intoEmpty.skippedTrips, 0);
check('memos restored', intoEmpty.memos.length, 1);

// A malformed or absent section must not throw, and must not wipe anything.
for (const [name, incoming] of [
  ['null', null],
  ['undefined', undefined],
  ['an object', {}],
  ['a string', 'nope'],
]) {
  const result = mergeBackup({
    currentTrips: local,
    currentMemos: localMemos,
    incomingTrips: incoming,
    incomingMemos: incoming,
  });
  check(`${name} incoming leaves local trips intact`, result.trips, local);
  check(`${name} incoming leaves local memos intact`, result.memos, localMemos);
}

// Missing local data must not throw either.
const noLocal = mergeBackup({
  currentTrips: null,
  currentMemos: undefined,
  incomingTrips: [{ id: 1 }],
  incomingMemos: [{ id: 'm1' }],
});
check('absent local trips are treated as empty', noLocal.trips.length, 1);
check('absent local memos are treated as empty', noLocal.memos.length, 1);

if (failed) { console.error(`\n${failed} backup test(s) failed`); process.exit(1); }
console.log('backup tests passed');
