// The binary takes its version from the pbxproj; the About screen reads
// app.json. Nothing keeps those two in step, so a bump that misses one makes
// the app quietly report a version it is not. This fails the moment they drift.
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const app = JSON.parse(readFileSync('app.json', 'utf8'));
const pbx = readFileSync('ios/WanderNote.xcodeproj/project.pbxproj', 'utf8');

const uniq = (re) => [...new Set([...pbx.matchAll(re)].map((m) => m[1].trim()))];

const marketing = uniq(/MARKETING_VERSION = ([^;]+);/g);
const build = uniq(/CURRENT_PROJECT_VERSION = ([^;]+);/g);

const problems = [];

if (marketing.length !== 1) {
  problems.push(`pbxproj has mixed MARKETING_VERSION values: ${marketing.join(', ')}`);
}
if (build.length !== 1) {
  problems.push(`pbxproj has mixed CURRENT_PROJECT_VERSION values: ${build.join(', ')}`);
}

const expected = marketing[0];
const expectedBuild = build[0];

if (app.expo.version !== expected) {
  problems.push(
    `app.json version ${app.expo.version} != pbxproj ${expected} — the About screen would show the wrong number`
  );
}
if (String(app.expo.ios.buildNumber) !== expectedBuild) {
  problems.push(`app.json buildNumber ${app.expo.ios.buildNumber} != pbxproj ${expectedBuild}`);
}
if (pkg.version !== expected) {
  problems.push(`package.json version ${pkg.version} != pbxproj ${expected}`);
}

// The iOS target uses a real Info.plist; literal values there silently win over
// the build settings, which is how 1.0.4 once shipped as 1.0.0.
const plist = readFileSync('ios/WanderNote/Info.plist', 'utf8');
for (const [key, want] of [
  ['CFBundleShortVersionString', '$(MARKETING_VERSION)'],
  ['CFBundleVersion', '$(CURRENT_PROJECT_VERSION)'],
]) {
  const found = plist.match(
    new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`)
  )?.[1];

  if (found !== want) {
    problems.push(`Info.plist ${key} is "${found}", expected "${want}"`);
  }
}

if (problems.length > 0) {
  console.error('version check failed:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}

console.log(`version check passed: ${expected} (${expectedBuild})`);
