import assert from 'node:assert/strict';
import {
  formatForecastDay,
  formatStoredDate,
  formatStoredDay,
  formatStoredDayRange,
  formatStoredMonth,
  formatStoredTime,
  formatStoredWeekday,
  parseStoredDay,
  parseStoredMonth,
} from '../lib/dateFormat.js';

// Intl output uses narrow no-break spaces in some locales; compare on plain spaces.
const plain = s => String(s).replace(/[  ]/g, ' ');

function testDaysReadTheWayEachRegionWritesThem() {
  // The reason this module exists: every screen used to print "2026.04.12".
  assert.equal(plain(formatStoredDay('2026.04.12', 'en-US')), 'Apr 12, 2026');
  assert.equal(plain(formatStoredDay('2026.04.12', 'en-GB')), '12 Apr 2026');
  assert.equal(plain(formatStoredDay('2026.04.12', 'de-DE')), '12. Apr. 2026');
  assert.equal(plain(formatStoredDay('2026.04.12', 'fr-FR')), '12 avr. 2026');
  assert.equal(plain(formatStoredDay('2026.04.12', 'zh-CN')), '2026年4月12日');
}

function testLanguageAndRegionCombine() {
  // English UI on a German iPhone orders the day first, as Germans expect.
  assert.equal(plain(formatStoredDay('2026.04.12', 'en-DE')), '12 Apr 2026');
}

function testMonths() {
  assert.equal(plain(formatStoredMonth('2026.04', 'en-US')), 'Apr 2026');
  assert.equal(plain(formatStoredMonth('2026.4', 'en-US')), 'Apr 2026');
}

function testTripDatesAreEitherDayOrMonth() {
  assert.equal(plain(formatStoredDate('2026.04.12', 'en-US')), 'Apr 12, 2026');
  assert.equal(plain(formatStoredDate('2026.04', 'en-US')), 'Apr 2026');
}

function testWeekdayComesFromTheDateNotTheStoredText() {
  // 2026-04-12 is a Sunday. A day created in Chinese stored 周日.
  assert.equal(formatStoredWeekday('2026.04.12', 'en-US', '周日'), 'Sun');
  // Abbreviation punctuation varies between ICU versions ("So" / "So.").
  assert.match(formatStoredWeekday('2026.04.12', 'de-DE', '周日'), /^So\.?$/);
  assert.equal(formatStoredWeekday('not a date', 'en-US', '周日'), '周日', 'unreadable date keeps the stored text');
}

function testTimesFollowTheRegionClock() {
  assert.equal(plain(formatStoredTime('14:05', 'en-US')), '2:05 PM');
  assert.equal(plain(formatStoredTime('14:05', 'de-DE')), '14:05');
  assert.equal(plain(formatStoredTime('07:30', 'en-GB')), '07:30', 'a 24-hour clock pads the hour');
  assert.equal(plain(formatStoredTime('07:30', 'en-US')), '7:30 AM', 'a 12-hour clock does not');
}

function testRanges() {
  assert.equal(plain(formatStoredDayRange('2026.04.12', '2026.04.15', 'en-US')), 'Apr 12, 2026 – Apr 15, 2026');
  assert.equal(plain(formatStoredDayRange('2026.04.12', '2026.04.12', 'en-US')), 'Apr 12, 2026');
  assert.equal(plain(formatStoredDayRange('2026.04.12', null, 'en-US')), 'Apr 12, 2026');
}

function testUnreadableValuesPassThrough() {
  // Older or hand-edited data should still show something.
  assert.equal(formatStoredDay('someday', 'en-US'), 'someday');
  assert.equal(formatStoredDay('', 'en-US'), '');
  assert.equal(formatStoredDay(undefined, 'en-US'), '');
  assert.equal(formatStoredTime('noon', 'en-US'), 'noon');
  assert.equal(formatStoredTime('25:00', 'en-US'), '25:00');
  assert.equal(formatStoredDate('2026', 'en-US'), '2026');
}

function testImpossibleDatesAreNotRolledOver() {
  // new Date(2026, 1, 30) quietly becomes March 2nd.
  assert.equal(parseStoredDay('2026.02.30'), null);
  assert.equal(formatStoredDay('2026.02.30', 'en-US'), '2026.02.30');
  assert.equal(parseStoredMonth('2026.13'), null);
}

function testABadLocaleDoesNotThrow() {
  assert.ok(formatStoredDay('2026.04.12', 'not_a_locale!!').length > 0);
}

function testForecastColumnsNameTheWeekday() {
  // 2026-09-15 is a Tuesday. The strip used to read "09/15".
  assert.equal(formatForecastDay('2026-09-15', 'en-US'), 'Tue');
  assert.equal(formatForecastDay('2026-09-15', 'fr-FR'), 'mar.');
  assert.equal(formatForecastDay('garbage', 'en-US'), 'garbage');
}

testDaysReadTheWayEachRegionWritesThem();
testLanguageAndRegionCombine();
testMonths();
testTripDatesAreEitherDayOrMonth();
testWeekdayComesFromTheDateNotTheStoredText();
testTimesFollowTheRegionClock();
testRanges();
testUnreadableValuesPassThrough();
testImpossibleDatesAreNotRolledOver();
testABadLocaleDoesNotThrow();
testForecastColumnsNameTheWeekday();

console.log('date format tests passed');
