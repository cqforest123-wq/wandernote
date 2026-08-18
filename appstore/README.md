# App Store assets

## screenshots-en/

Six English screenshots at 1320×2868 — the 6.9" size Apple requires — captured
on an iPhone 17 Pro Max simulator with the status bar pinned to 9:41.

| File | Screen | What it is meant to say |
|------|--------|-------------------------|
| 01-trips | Home | This is a travel journal, and here is a trip library |
| 02-trip-and-spending | Trip overview | Days, notes, photos, and where the money went |
| 03-travel-log | Day log | Every day carries its own notes and photographs |
| 04-map-footprints | Map | The strongest one: photo pins and the route between them |
| 05-search | Search | One search reaches trips, notes, spending and lists |
| 06-packing-lists | Lists | Packing lists tied to a trip |

The AI screen is deliberately absent: its value is under review and the proxy
fix is not yet deployed, so promising it on the store page would be premature.
The Watch app is absent too — the complication has never been verified on a
real face, and watchOS screenshots are a separate size requirement.

### The photographs are placeholders

The images in these shots are abstract gradients generated for the purpose, not
photographs of Kyoto, Lisbon or Reykjavik. They are honest stand-ins rather
than borrowed pictures: Apple's own simulator sample photos are Apple's
property, and using them in a store listing is not ours to do.

**Re-take these with real travel photographs before submitting.** The app is
about photographs, and a screenshot full of gradients undersells it badly. The
fastest route is to seed a device with your own trip and repeat the same six
screens.

### Reproducing the demo data

The trips, notes, expenses and checklists were written straight into the
simulator's AsyncStorage — three trips (Kyoto, Lisbon, Reykjavik), 14 photos,
9 notes, 16 expenses, one packing list. Photo URIs are absolute paths into the
app's data container, so they must be rewritten whenever the container moves
(every reinstall does this).
