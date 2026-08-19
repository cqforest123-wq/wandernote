import assert from 'node:assert/strict';
import { parseQuery, searchAll } from '../lib/search.js';

const TRIPS = [
  {
    id: 1,
    city: '京都',
    country: '日本',
    plannedDate: '2026.03.15',
    days: [
      {
        date: '2026.03.15',
        memos: [
          { id: 11, text: '嵐山的竹林比想象中安静', tag: 'scenery' },
          { id: 12, text: 'ramen at Ichiran', tag: 'food' },
        ],
        expenses: [
          { id: 21, amount: 1500, currency: 'JPY', category: 'food', note: '一兰拉面' },
        ],
      },
    ],
  },
  {
    id: 2,
    city: 'Paris',
    country: 'France',
    days: [{ date: '2026.05.01', memos: [{ id: 31, text: 'Louvre queue was long' }] }],
  },
];

const MEMOS = [
  { id: 100, title: '行李清单', tripId: 1, items: [{ text: '转换插头' }, { text: '雨伞' }] },
  { id: 101, title: 'Packing', tripId: null, items: ['passport', 'charger'] },
];

function run(query) {
  return searchAll({ trips: TRIPS, memos: MEMOS, query });
}

function testEmptyQueryReturnsNothing() {
  assert.deepEqual(run(''), [], 'blank query must not dump the whole database');
  assert.deepEqual(run('   '), [], 'whitespace only');
  assert.deepEqual(parseQuery('  a   b '), ['a', 'b']);
}

function testFindsAcrossRecordTypes() {
  assert.equal(run('京都').filter(r => r.type === 'trip').length, 1);
  assert.equal(run('竹林')[0].type, 'memo');
  assert.equal(run('一兰')[0].type, 'expense');
  assert.equal(run('转换插头')[0].type, 'checklist');
}

function testIsCaseInsensitive() {
  assert.equal(run('LOUVRE').length, 1, 'upper-case query still matches');
  assert.equal(run('ichiran').length, 1, 'lower-case query matches mixed-case text');
}

function testAllTermsMustMatch() {
  assert.equal(run('ramen ichiran').length, 1, 'both terms present in one memo');
  assert.equal(
    run('ramen louvre').length,
    0,
    'terms spread across different records must not match'
  );
}

function testResultsCarryEnoughToNavigate() {
  const [memo] = run('竹林');
  assert.equal(memo.tripId, 1);
  assert.equal(memo.dayDate, '2026.03.15');
  assert.ok(memo.subtitle.includes('京都'));

  const [checklist] = run('passport');
  assert.equal(checklist.type, 'checklist');
  assert.equal(checklist.memoId, 101);
}

function testHandlesMissingFieldsWithoutThrowing() {
  assert.doesNotThrow(() => searchAll({ trips: null, memos: null, query: 'x' }));
  assert.doesNotThrow(() =>
    searchAll({ trips: [{ id: 1 }], memos: [{ id: 2 }], query: 'x' })
  );
  assert.deepEqual(searchAll({ trips: [{}], memos: [{}], query: 'zzz' }), []);
}

testEmptyQueryReturnsNothing();
testFindsAcrossRecordTypes();
testIsCaseInsensitive();
testAllTermsMustMatch();
testResultsCarryEnoughToNavigate();
testHandlesMissingFieldsWithoutThrowing();

console.log('search tests passed');
