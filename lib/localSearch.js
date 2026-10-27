function includesQuery(value, query) {
  return String(value ?? '').toLocaleLowerCase().includes(query);
}

export function searchLocalTravelData(trips, rawQuery) {
  const query = String(rawQuery ?? '').trim().toLocaleLowerCase();
  if (!query) return { trips: [...(trips || [])], notes: [] };

  const matchingTrips = [];
  const matchingNotes = [];

  for (const trip of trips || []) {
    const days = Array.isArray(trip.days) ? trip.days : [];
    const tripMatches = [trip.city, trip.country, trip.date, trip.plannedDate]
      .some(value => includesQuery(value, query))
      || days.some(day => includesQuery(day.date, query));
    const tripNotes = [];

    for (const day of days) {
      for (const memo of Array.isArray(day.memos) ? day.memos : []) {
        if (includesQuery(memo.text, query) || includesQuery(memo.tag, query)) {
          tripNotes.push({ trip, day, memo });
        }
      }
    }

    if (tripMatches || tripNotes.length > 0) matchingTrips.push(trip);
    matchingNotes.push(...tripNotes);
  }

  return { trips: matchingTrips, notes: matchingNotes };
}
