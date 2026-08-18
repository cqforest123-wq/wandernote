import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@wandernote_diagnostics';

/**
 * Enough to see what just happened without becoming a wall of text to scroll,
 * copy and read. Older entries fall off the front.
 */
const MAX_ENTRIES = 60;

/**
 * A small on-device activity log, so a problem report can say what actually
 * happened instead of what it looked like.
 *
 * Deliberately records outcomes and counts only — never trip text, place names,
 * coordinates, amounts or file paths. A diagnostic log that quietly accumulated
 * the user's travel journal would be a worse problem than the one it solves.
 * If you add an event, keep its payload to numbers, enum-ish strings and flags.
 */

let queue = Promise.resolve();

function shortTime(date) {
  const pad = (n) => String(n).padStart(2, '0');

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function readAll() {
  try {
    const raw = await AsyncStorage.getItem(KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * @param {string} tag   Area, e.g. 'photo-import', 'watch-sync', 'rates'.
 * @param {string} event What happened, in a few words.
 * @param {object} [data] Numbers and flags only.
 */
export function logEvent(tag, event, data) {
  // Serialized so concurrent callers cannot clobber each other's append.
  queue = queue
    .then(async () => {
      const entries = await readAll();

      entries.push({
        at: shortTime(new Date()),
        tag,
        event,
        ...(data && Object.keys(data).length > 0 ? { data } : {}),
      });

      const trimmed = entries.slice(-MAX_ENTRIES);

      await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
    })
    .catch(() => {});

  return queue;
}

export async function readDiagnostics() {
  return readAll();
}

export async function clearDiagnostics() {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch (e) {
    // Nothing useful to do — the log is best-effort by design.
  }
}

/** Plain text, ready to paste into a bug report. */
export function formatDiagnostics(entries) {
  if (!entries || entries.length === 0) {
    return '';
  }

  // Newest first: the thing you just did is the thing you want to read.
  return [...entries]
    .reverse()
    .map((e) => {
      const detail = e.data ? ' ' + JSON.stringify(e.data) : '';

      return `${e.at} [${e.tag}] ${e.event}${detail}`;
    })
    .join('\n');
}
