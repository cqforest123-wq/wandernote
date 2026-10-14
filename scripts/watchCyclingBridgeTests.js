const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../lib/watch/OutdoorGlanceNativeModule.js'), 'utf8'
);

async function loadBridge({ os = 'ios', nativeBridge } = {}) {
  const timers = new Map();
  let nextTimer = 0;
  const context = vm.createContext({
    setTimeout(callback, delay) {
      const timer = ++nextTimer;
      timers.set(timer, { callback, delay });
      return timer;
    },
    clearTimeout(timer) { timers.delete(timer); },
  });
  const reactNative = new vm.SyntheticModule(['NativeModules', 'Platform'], function () {
    this.setExport('NativeModules', { OutdoorGlanceWatchBridge: nativeBridge });
    this.setExport('Platform', { OS: os });
  }, { context });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(() => reactNative);
  await module.evaluate();
  return { start: module.namespace.startOutdoorCyclingWorkoutOnWatch, timers };
}

test('unsupported platform and older native builds safely report unavailable', async () => {
  const android = await loadBridge({ os: 'android' });
  assert.equal(await android.start(), false);
  const missing = await loadBridge();
  assert.equal(await missing.start(), false);
  const older = await loadBridge({ nativeBridge: { publishOutdoorGlanceSnapshot() {} } });
  assert.equal(await older.start(), false);
  assert.equal(android.timers.size + missing.timers.size + older.timers.size, 0);
});

test('successful launch reaches native once and clears the timeout', async () => {
  let calls = 0;
  const bridge = await loadBridge({ nativeBridge: {
    async startOutdoorCyclingWorkoutOnWatch() { calls++; },
  } });
  assert.equal(await bridge.start(), true);
  assert.equal(calls, 1);
  assert.equal(bridge.timers.size, 0);
});

test('native launch rejection reaches the caller and clears the timeout', async () => {
  const error = new Error('Watch disconnected');
  const bridge = await loadBridge({ nativeBridge: {
    async startOutdoorCyclingWorkoutOnWatch() { throw error; },
  } });
  await assert.rejects(bridge.start(), failure => failure === error);
  assert.equal(bridge.timers.size, 0);
});

test('synchronous native failure also reaches the caller', async () => {
  const error = new Error('Native launch unavailable');
  const bridge = await loadBridge({ nativeBridge: {
    startOutdoorCyclingWorkoutOnWatch() { throw error; },
  } });
  await assert.rejects(bridge.start(), failure => failure === error);
  assert.equal(bridge.timers.size, 0);
});

test('a native call that never completes times out and accepts a later retry', async () => {
  let finishLate;
  let attempts = 0;
  const bridge = await loadBridge({ nativeBridge: {
    startOutdoorCyclingWorkoutOnWatch() {
      attempts++;
      return attempts === 1 ? new Promise(resolve => { finishLate = resolve; }) : Promise.resolve();
    },
  } });
  const pending = bridge.start();
  const rejection = assert.rejects(pending, /timed out/);
  const timer = [...bridge.timers.values()][0];
  assert.equal(timer.delay, 20000);
  timer.callback();
  await rejection;
  assert.equal(bridge.timers.size, 0);
  finishLate();
  assert.equal(await bridge.start(), true);
  assert.equal(attempts, 2);
  assert.equal(bridge.timers.size, 0);
});
