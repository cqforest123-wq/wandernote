// Bump the build number everywhere it is written, in one step.
//
// It lives in four places — the pbxproj (twice over, per configuration),
// app.json, and implicitly in every install the tester is trying to tell
// apart. Bumping by hand meant a whole day of builds all reporting the same
// number, which made "which build is this?" unanswerable.
//
// Usage:  node scripts/bumpBuild.mjs           bump the build number
//         node scripts/bumpBuild.mjs 1.2.0     also set the marketing version
import { readFileSync, writeFileSync } from 'node:fs';

const nextMarketing = process.argv[2] || null;

const pbxPath = 'ios/WanderNote.xcodeproj/project.pbxproj';
let pbx = readFileSync(pbxPath, 'utf8');

const builds = [...new Set([...pbx.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map(m => m[1].trim()))];

if (builds.length !== 1) {
  console.error(`pbxproj has mixed build numbers: ${builds.join(', ')}`);
  process.exit(1);
}

const nextBuild = String(Number(builds[0]) + 1);

if (!Number.isFinite(Number(builds[0]))) {
  console.error(`build number "${builds[0]}" is not a number`);
  process.exit(1);
}

pbx = pbx.replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${nextBuild};`);

if (nextMarketing) {
  pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${nextMarketing};`);
}

writeFileSync(pbxPath, pbx);

const marketing = [...new Set([...pbx.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map(m => m[1].trim()))][0];

for (const [path, edit] of [
  ['app.json', json => {
    json.expo.version = marketing;
    json.expo.ios.buildNumber = nextBuild;
  }],
  ['package.json', json => { json.version = marketing; }],
]) {
  const json = JSON.parse(readFileSync(path, 'utf8'));
  edit(json);
  writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
}

console.log(`bumped to ${marketing} (${nextBuild})`);
