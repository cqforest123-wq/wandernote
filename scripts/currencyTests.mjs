import assert from 'node:assert/strict';
import {
  collectTripExpenses,
  convert,
  formatMoney,
  sumByCategory,
  sumExpenses,
} from '../lib/currencyMath.js';

// USD-anchored, like the live table.
const RATES = {
  base: 'USD',
  rates: { USD: 1, CNY: 7.2, JPY: 150, EUR: 0.92 },
};

function testConvertsThroughTheBase() {
  // 1000 JPY -> USD -> CNY
  const value = convert(1000, 'JPY', 'CNY', RATES);
  assert.ok(Math.abs(value - (1000 / 150) * 7.2) < 1e-9, 'cross-rate maths');

  assert.equal(convert(50, 'USD', 'USD', RATES), 50, 'same currency is identity');
  assert.ok(
    Math.abs(convert(10, 'USD', 'CNY', RATES) - 72) < 1e-9,
    'converting from the base currency itself'
  );
  assert.ok(
    Math.abs(convert(72, 'CNY', 'USD', RATES) - 10) < 1e-9,
    'converting to the base currency itself'
  );
}

function testRefusesToGuessWhenARateIsMissing() {
  assert.equal(
    convert(100, 'KRW', 'CNY', RATES),
    null,
    'an unknown currency must return null, never a silently wrong number'
  );
  assert.equal(convert(100, 'USD', 'CNY', null), null, 'no table at all');
  assert.equal(convert('abc', 'USD', 'CNY', RATES), null, 'non-numeric amount');
  assert.equal(
    convert(100, 'ZERO', 'CNY', { base: 'USD', rates: { ZERO: 0, CNY: 7.2 } }),
    null,
    'a zero rate would divide by zero'
  );
}

function testTotalsAdmitWhatTheyCouldNotConvert() {
  const expenses = [
    { amount: 100, currency: 'CNY', category: 'food' },
    { amount: 1500, currency: 'JPY', category: 'food' },
    { amount: 5000, currency: 'KRW', category: 'stay' },
  ];

  const { total, unconvertible } = sumExpenses(expenses, 'CNY', RATES);

  assert.equal(unconvertible.length, 1, 'the KRW entry cannot be converted');
  assert.equal(unconvertible[0].currency, 'KRW');
  assert.ok(
    Math.abs(total - (100 + (1500 / 150) * 7.2)) < 1e-9,
    'the total covers only what was convertible'
  );
}

function testNoRatesMeansNoTotal() {
  const expenses = [{ amount: 100, currency: 'JPY' }];
  const { total, unconvertible } = sumExpenses(expenses, 'CNY', null);

  assert.equal(total, 0, 'without rates nothing is summed');
  assert.equal(unconvertible.length, 1, 'and the entry is reported as unconverted');
}

function testCategoryTotals() {
  const expenses = [
    { amount: 100, currency: 'CNY', category: 'food' },
    { amount: 50, currency: 'CNY', category: 'food' },
    { amount: 20, currency: 'CNY', category: 'transport' },
    { amount: 10, currency: 'CNY' },
  ];

  const totals = sumByCategory(expenses, 'CNY', RATES);

  assert.equal(totals.food, 150);
  assert.equal(totals.transport, 20);
  assert.equal(totals.other, 10, 'a missing category falls into other');
}

function testFormatting() {
  assert.equal(formatMoney(1234.5, 'CNY'), '¥1,234.50');
  assert.equal(formatMoney(1500, 'JPY'), '¥1,500', 'yen carries no decimals');
  assert.equal(formatMoney(1000000, 'KRW'), '₩1,000,000');
  assert.equal(formatMoney(9.9, 'USD'), '$9.90');
  assert.equal(formatMoney('nope', 'USD'), '', 'garbage in, empty string out');
}

function testCollectsAcrossDays() {
  const trip = {
    days: [
      { expenses: [{ amount: 1 }, { amount: 2 }] },
      {},
      { expenses: [{ amount: 3 }] },
    ],
  };

  assert.equal(collectTripExpenses(trip).length, 3);
  assert.equal(collectTripExpenses(null).length, 0);
}

testConvertsThroughTheBase();
testRefusesToGuessWhenARateIsMissing();
testTotalsAdmitWhatTheyCouldNotConvert();
testNoRatesMeansNoTotal();
testCategoryTotals();
testFormatting();
testCollectsAcrossDays();

console.log('currency tests passed');
