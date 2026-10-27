export function summarizeYearTrips(trips) {
  const days = (trips || []).flatMap(trip => Array.isArray(trip.days) ? trip.days : []);
  const memos = days.flatMap(day => Array.isArray(day.memos) ? day.memos : []);
  const photos = days.flatMap(day => Array.isArray(day.photos) ? day.photos : []);
  const countryCounts = {};
  (trips || []).forEach(trip => {
    const country = String(trip.country || '').trim();
    if (country) countryCounts[country] = (countryCounts[country] || 0) + 1;
  });
  return {
    tripCount: (trips || []).length,
    dayCount: days.length,
    memoCount: memos.length,
    photoCount: photos.length,
    countries: Object.entries(countryCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
  };
}

export function buildYearReportShareText(year, stats, labels) {
  const lines = [
    labels.title(year),
    labels.tripCount(stats.tripCount),
    labels.countryCount(stats.countries.length),
    labels.dayCount(stats.dayCount),
    labels.memoCount(stats.memoCount),
    labels.photoCount(stats.photoCount),
  ];
  if (stats.countries.length) {
    lines.push('', labels.countriesHeading);
    stats.countries.forEach(([country, count]) => lines.push(`${country}: ${count}`));
  }
  lines.push('', `— ${labels.source}`);
  return lines.join('\n');
}
