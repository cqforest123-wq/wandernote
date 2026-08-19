import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';

execSync('node /tmp/extract-notif.mjs', { cwd: process.cwd() });
const { reminderDateFor, planReminders } = await import('/tmp/notifPure.mjs');

const NOW = new Date(2026, 7, 14, 12, 0); // 2026-08-14 12:00 local

function testFiresTheEveningBefore() {
  const fire = reminderDateFor('2026.08.20', NOW);
  assert.ok(fire, 'a future departure should schedule');
  assert.equal(fire.getFullYear(), 2026);
  assert.equal(fire.getMonth(), 7);
  assert.equal(fire.getDate(), 19, 'the day before departure');
  assert.equal(fire.getHours(), 19, 'in the evening, while there is still time to pack');
}

function testSkipsMomentsAlreadyPassed() {
  assert.equal(reminderDateFor('2026.08.01', NOW), null, 'departure in the past');
  assert.equal(
    reminderDateFor('2026.08.14', NOW),
    null,
    'departing today — the evening-before moment is gone, so no reminder rather than one that fires immediately'
  );
  // Departing tomorrow still schedules: this evening's 19:00 has not arrived.
  const tomorrow = reminderDateFor('2026.08.15', NOW);
  assert.ok(tomorrow, 'leaving tomorrow should still get tonight\'s reminder');
  assert.equal(tomorrow.getDate(), 14);
  assert.equal(tomorrow.getHours(), 19);
}

function testIgnoresUnusableDates() {
  for (const bad of [null, undefined, '', 'not-a-date', '2026.08', '2026.13.99.1']) {
    assert.equal(reminderDateFor(bad, NOW), null, `rejects ${JSON.stringify(bad)}`);
  }
}

function testPlanIsOrderedAndCapped() {
  const trips = [];
  for (let i = 1; i <= 15; i += 1) {
    trips.push({ city: `City${i}`, plannedDate: `2026.09.${String(i).padStart(2, '0')}` });
  }
  trips.push({ city: 'Past', plannedDate: '2026.01.01' });
  trips.push({ city: 'NoDate' });

  const planned = planReminders(trips, NOW);

  assert.equal(planned.length, 10, 'iOS only keeps 64 pending notifications; cap well under it');
  assert.equal(planned[0].trip.city, 'City1', 'soonest first');
  assert.ok(
    planned.every((p, i) => i === 0 || p.fireAt >= planned[i - 1].fireAt),
    'chronological'
  );
  assert.ok(
    !planned.some(p => ['Past', 'NoDate'].includes(p.trip.city)),
    'past and undated trips are dropped'
  );
}

function testHandlesNoTrips() {
  assert.deepEqual(planReminders(null, NOW), []);
  assert.deepEqual(planReminders([], NOW), []);
}

testFiresTheEveningBefore();
testSkipsMomentsAlreadyPassed();
testIgnoresUnusableDates();
testPlanIsOrderedAndCapped();
testHandlesNoTrips();

console.log('notification tests passed');
