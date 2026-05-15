const fs = require('fs');

const home = fs.readFileSync('screens/HomeScreen.js', 'utf8');
const map = fs.readFileSync('lib/destinationEnMap.js', 'utf8');

const countries = [...new Set([...home.matchAll(/name:'([^']+)',cities:\[/g)].map(m => m[1]))];

const cities = new Set();
for (const m of home.matchAll(/cities:\[([^\]]*)\]/g)) {
  for (const c of m[1].matchAll(/'([^']+)'/g)) cities.add(c[1]);
}

const mapped = new Set([...map.matchAll(/['"]([^'"]+)['"]\s*:/g)].map(m => m[1]));

const missingCountries = countries.filter(x => !mapped.has(x));
const missingCities = [...cities].filter(x => !mapped.has(x));

console.log('countries total:', countries.length);
console.log('countries missing:', missingCountries.length);
console.log('cities total:', cities.size);
console.log('cities missing:', missingCities.length);

if (missingCountries.length) console.log('MISSING COUNTRIES:', missingCountries);
if (missingCities.length) console.log('MISSING CITIES:', missingCities);

if (missingCountries.length || missingCities.length) process.exit(1);

console.log('✅ destination English mapping complete');
