// Cross-trip search over everything the user has written: trips, day memos,
// checklist items and expense notes. Pure functions, so the matching rules can
// be tested without a device.

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

/**
 * Case-insensitive substring match.
 *
 * Deliberately not fuzzy: this content is the user's own words in seven
 * possible languages, and fuzzy matching across CJK produces noise rather than
 * help. Multiple terms must all appear, in any field of the same record.
 */
function matches(haystacks, terms) {
  // A separator no term can cross. parseQuery splits on whitespace, so a term
  // never contains a space and cannot match across two fields — and a plain
  // space, unlike the NUL that used to sit here, leaves this a text file that
  // grep and `file` still read as source rather than as binary data.
  const pool = haystacks.map(normalize).join(' ');

  return terms.every(term => pool.includes(term));
}

export function parseQuery(query) {
  return normalize(query).split(/\s+/).filter(Boolean);
}

/**
 * @returns {Array<{type, tripId, tripName, dayDate, title, subtitle, memoId}>}
 */
export function searchAll({ trips, memos, query }) {
  const terms = parseQuery(query);

  if (terms.length === 0) {
    return [];
  }

  const results = [];

  for (const trip of trips || []) {
    const tripName = [trip?.city, trip?.country].filter(Boolean).join(', ');

    if (matches([trip?.city, trip?.country, trip?.plannedDate, trip?.date], terms)) {
      results.push({
        type: 'trip',
        tripId: trip?.id,
        tripName,
        title: tripName,
        // The stored date travels separately so the screen can format it for
        // the reader; this module knows nothing about locales.
        subtitle: '',
        date: trip?.plannedDate || trip?.date || '',
      });
    }

    for (const day of trip?.days || []) {
      for (const memo of day?.memos || []) {
        if (matches([memo?.text, memo?.tag], terms)) {
          results.push({
            type: 'memo',
            tripId: trip?.id,
            tripName,
            dayDate: day?.date,
            title: memo?.text || '',
            subtitle: tripName,
            date: day?.date || '',
          });
        }
      }

      for (const expense of day?.expenses || []) {
        if (matches([expense?.note, expense?.category, expense?.currency], terms)) {
          results.push({
            type: 'expense',
            tripId: trip?.id,
            tripName,
            dayDate: day?.date,
            title: expense?.note || expense?.category || '',
            subtitle: tripName,
            date: day?.date || '',
            amount: expense?.amount,
            currency: expense?.currency,
          });
        }
      }
    }
  }

  for (const memo of memos || []) {
    const itemTexts = (memo?.items || []).map(item =>
      typeof item === 'string' ? item : item?.text
    );

    if (matches([memo?.title, ...itemTexts], terms)) {
      results.push({
        type: 'checklist',
        memoId: memo?.id,
        tripId: memo?.tripId ?? null,
        title: memo?.title || '',
        subtitle: `${(memo?.items || []).length}`,
      });
    }
  }

  return results;
}
