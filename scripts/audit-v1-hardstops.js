const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const INCLUDE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.json']);
const SKIP_DIRS = new Set(['node_modules', '.git', '.expo', 'ios', 'android', 'scripts']);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (INCLUDE_EXT.has(path.extname(full))) out.push(full);
  }
  return out;
}

const files = walk(ROOT);

const checks = [
  {
    level: 'BLOCKER',
    name: 'isPro forced true',
    regex: /const\s+\[isPro,\s*setIsPro\]\s*=\s*useState\(true\)|useState\(true\).*isPro/,
  },
  {
    level: 'BLOCKER',
    name: 'RevenueCat placeholder key',
    regex: /YOUR_REVENUECAT|REVENUECAT_.*YOUR|wandernote_pro_monthly|wandernote_pro_yearly/,
  },
  {
    level: 'BLOCKER',
    name: 'Raw HTTP endpoint',
    regex: /http:\/\/(?!localhost|127\.0\.0\.1)/,
  },
  {
    level: 'BLOCKER',
    name: 'Hardcoded private API key pattern',
    regex: /(sk-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|ANTHROPIC_API_KEY\s*=\s*['"][^'"]+['"])/,
  },
  {
    level: 'WARN',
    name: 'console debug/log remains',
    regex: /console\.log\(/,
  },
  {
    level: 'WARN',
    name: 'TODO/FIXME remains',
    regex: /TODO|FIXME|HACK/,
  },
  {
    level: 'WARN',
    name: 'Expo Go / __DEV__ logic',
    regex: /__DEV__|Expo Go|Browser Mode/,
  },
  {
    level: 'WARN',
    name: 'Hidden YearReport v1 flag',
    regex: /ENABLE_YEAR_REPORT\s*=\s*false/,
  },
];

let findings = [];

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  lines.forEach((line, idx) => {
    for (const check of checks) {
      if (check.regex.test(line)) {
        let shown = line.trim();

        // Redact likely secrets if any are accidentally matched.
        shown = shown.replace(/sk-[A-Za-z0-9_-]{8,}/g, 'sk-***REDACTED***');
        shown = shown.replace(/AIza[A-Za-z0-9_-]{8,}/g, 'AIza***REDACTED***');
        shown = shown.replace(/ANTHROPIC_API_KEY\s*=\s*['"][^'"]+['"]/g, 'ANTHROPIC_API_KEY="***REDACTED***"');

        findings.push({
          level: check.level,
          name: check.name,
          file: rel,
          line: idx + 1,
          text: shown,
        });
      }
    }
  });
}

const blockers = findings.filter(f => f.level === 'BLOCKER');
const warnings = findings.filter(f => f.level === 'WARN');

console.log(`BLOCKERS: ${blockers.length}`);
for (const f of blockers) {
  console.log(`[${f.level}] ${f.name} :: ${f.file}:${f.line}`);
  console.log(`  ${f.text}`);
}

console.log(`\nWARNINGS: ${warnings.length}`);
for (const f of warnings) {
  console.log(`[${f.level}] ${f.name} :: ${f.file}:${f.line}`);
  console.log(`  ${f.text}`);
}

if (blockers.length > 0) {
  console.log('\n❌ Release hard-stop blockers found.');
  process.exit(1);
}

console.log('\n✅ No release blocker found by static audit.');
