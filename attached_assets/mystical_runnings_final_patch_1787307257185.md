Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Mercury Retrograde — fix 2028 dates, extend through 2030

**File:** `constants/spiritualData.ts`

Two 2028 entries in `MERCURY_RETROGRADES` have wrong end dates (confirmed against farmersalmanac.com/mercury-retrograde, the original source for this array). Both drifted to "24" — looks like a copy/paste slip, not a source disagreement.

Replace the three existing 2028 lines:
```typescript
{ start: new Date(2028, 0, 24), end: new Date(2028, 1, 24), label: "Mercury Retrograde in Aquarius" },
{ start: new Date(2028, 4, 21), end: new Date(2028, 5, 24), label: "Mercury Retrograde in Gemini" },
{ start: new Date(2028, 8, 19), end: new Date(2028, 9, 11), label: "Mercury Retrograde in Libra" },
```
with the corrected version:
```typescript
{ start: new Date(2028, 0, 24), end: new Date(2028, 1, 14), label: "Mercury Retrograde in Aquarius" },
{ start: new Date(2028, 4, 21), end: new Date(2028, 5, 13), label: "Mercury Retrograde in Gemini" },
{ start: new Date(2028, 8, 19), end: new Date(2028, 9, 11), label: "Mercury Retrograde in Libra" },
```
(only the two `end` dates change — Feb 24→14, Jun 24→13.)

Then append these new entries directly after the 2028 block, extending the array through 2030 (source: farmersalmanac.com, 2029 has four retrogrades — an unusually high count called out on the source page):
```typescript
{ start: new Date(2029, 0, 7), end: new Date(2029, 0, 27), label: "Mercury Retrograde in Aquarius/Capricorn" },
{ start: new Date(2029, 4, 1), end: new Date(2029, 4, 25), label: "Mercury Retrograde in Taurus" },
{ start: new Date(2029, 8, 2), end: new Date(2029, 8, 24), label: "Mercury Retrograde in Virgo/Libra" },
{ start: new Date(2029, 11, 22), end: new Date(2030, 0, 11), label: "Mercury Retrograde in Capricorn" },
{ start: new Date(2030, 3, 12), end: new Date(2030, 4, 6), label: "Mercury Retrograde in Taurus/Aries" },
{ start: new Date(2030, 7, 15), end: new Date(2030, 8, 8), label: "Mercury Retrograde in Virgo" },
{ start: new Date(2030, 11, 5), end: new Date(2030, 11, 25), label: "Mercury Retrograde in Capricorn/Sagittarius" },
```
Note: the Dec 22, 2029 – Jan 11, 2030 period is a single retrograde spanning the year boundary — only add it once (as shown, with the 2029 start date), don't duplicate it under 2030.

---

## 2. Sacred Altar — add four new offering symbols

**File:** `components/SacredAltar.tsx`

Add four entries to the `ALTAR_SYMBOLS` array, in alphabetical position by label (matching the array's existing ordering convention):

Insert after `{ emoji: "🪔", label: "Incense", color: "#F59E0B" },` and before `{ emoji: "🍃", label: "Leaf", color: "#4ADE80" },`:
```typescript
{ emoji: "🥜", label: "Kola Nut", color: "#92400E" },
```

Insert after `{ emoji: "🗡️", label: "Ogun", color: "#92400E" },` and before `{ emoji: "🌺", label: "Offering", color: "#F472B6" },`... 

**Correction — insert in this exact order to keep alphabetization clean:**
```typescript
{ emoji: "🪄", label: "Obatala", color: "#E0F2FE" },
{ emoji: "🌺", label: "Offering", color: "#F472B6" },
{ emoji: "🗡️", label: "Ogun", color: "#92400E" },
{ emoji: "🍆", label: "Okra", color: "#4ADE80" },
{ emoji: "⭕", label: "Olodumare", color: "#FDE047" },
```
(This reorders the existing Obatala/Ogun/Offering block into correct alphabetical order — Obatala, Offering, Ogun, Okra, Olodumare — while adding "Okra" as the only new line. If you'd rather not touch the existing three lines' order, just insert `{ emoji: "🍆", label: "Okra", color: "#4ADE80" },` directly after the Ogun line instead and leave the existing order as-is.)

Insert after `{ emoji: "🌬️", label: "Oya", color: "#8B5CF6" },` and before `{ emoji: "🫒", label: "Palm Oil", color: "#D97706" },`:
```typescript
{ emoji: "🌴", label: "Palm Nut", color: "#D97706" },
```

Insert after `{ emoji: "🏺", label: "Vessel", color: "#F59E0B" },` and before `{ emoji: "🌊", label: "Yemoja", color: "#38BDF8" },`:
```typescript
{ emoji: "🍠", label: "Yam", color: "#B45309" },
```

---

## 3. Resources screen — rename, recategorize, sort, and add new links

**File:** `app/(tabs)/resources.tsx`

### 3a. Fix "Got2B Oshun" spelling (2 entries)
Change both occurrences of `"Got2B Oshun"` to `"Got2BOshun"`:
```typescript
title: "Got2BOshun",
...
title: "Got2BOshun — Tools & Supplies",
```
(Leave `source`, `url`, `emoji`, `color` unchanged on both.)

### 3b. Merge "Academic" and "Education" into "Academic/Education"
Change the `category` field on these two existing entries:
```typescript
// "Yoruba Culture" entry — currently category: "Education"
category: "Academic/Education",

// "Open Educational Resources for Ifa" entry — currently category: "Academic"
category: "Academic/Education",
```

### 3c. Sort categories alphabetically
Replace:
```typescript
const CATEGORIES = Array.from(new Set(RESOURCES.map((r) => r.category)));
```
with:
```typescript
const CATEGORIES = Array.from(new Set(RESOURCES.map((r) => r.category))).sort();
```

### 3d. Add 22 new resources
Append these entries to the `RESOURCES` array (before the closing `];`):
```typescript
{
  title: "Go Astronomy Astrological Events",
  source: "Go-Astronomy.com",
  category: "Astronomy",
  url: "https://go-astronomy.com/solar-system/event-calendar.htm",
  emoji: "🔭",
  color: "#38BDF8",
},
{
  title: "Moon Phase Guide",
  source: "moonphase.guide",
  category: "Moon",
  url: "https://moonphase.guide/",
  emoji: "🌕",
  color: "#A78BFA",
},
{
  title: "256 Healing Arts - Sékou Alájé",
  source: "256healingarts.com",
  category: "Organization",
  url: "https://www.256healingarts.com/",
  emoji: "🪶",
  color: "#D4A843",
},
{
  title: "List of All Orishas — Yoruba Deities",
  source: "Original Botanica",
  category: "Guide",
  url: "https://originalbotanica.com/blog/list-all-orishas-yoruba-deities",
  emoji: "🕯️",
  color: "#34D399",
},
{
  title: "African Folklore in the Americas",
  source: "TheCollector.com",
  category: "Academic/Education",
  url: "https://www.thecollector.com/mythological-african-folklore-americas/",
  emoji: "📚",
  color: "#7C3AED",
},
{
  title: "Astrology.com",
  source: "astrology.com",
  category: "Astrology",
  url: "https://www.astrology.com",
  emoji: "⭐",
  color: "#A78BFA",
},
{
  title: "High on the Hog: How African American Cuisine Transformed America",
  source: "Netflix",
  category: "Film & Culture",
  url: "https://www.netflix.com/title/81034518",
  emoji: "🎬",
  color: "#EF4444",
},
{
  title: "Coco",
  source: "Pixar",
  category: "Film & Culture",
  url: "https://www.pixar.com/coco",
  emoji: "🎬",
  color: "#EF4444",
},
{
  title: "Encanto",
  source: "Disney",
  category: "Film & Culture",
  url: "https://movies.disney.com/encanto",
  emoji: "🎬",
  color: "#EF4444",
},
{
  title: "Day of the Dead (Día de los Muertos)",
  source: "History.com",
  category: "Film & Culture",
  url: "https://www.history.com/articles/day-of-the-dead",
  emoji: "💀",
  color: "#EF4444",
},
{
  title: "About Diwali",
  source: "Princeton University",
  category: "Film & Culture",
  url: "https://diwali.princeton.edu/about/about-diwali/",
  emoji: "🪔",
  color: "#EF4444",
},
{
  title: "NASA Skywatching",
  source: "NASA.gov",
  category: "Astronomy",
  url: "https://www.nasa.gov/solar-system/skywatching/astronomy/",
  emoji: "🔭",
  color: "#38BDF8",
},
{
  title: "Neil deGrasse Tyson",
  source: "neildegrassetyson.com",
  category: "Astronomy",
  url: "https://neildegrassetyson.com/",
  emoji: "🔭",
  color: "#38BDF8",
},
{
  title: "Ifa Global Site",
  source: "ifaglobalsite.com",
  category: "Community",
  url: "https://www.ifaglobalsite.com/",
  emoji: "✨",
  color: "#22D3EE",
},
{
  title: "Ethiopian Orthodox Canonical Books",
  source: "ethiopianorthodox.org",
  category: "Religious Texts",
  url: "https://www.ethiopianorthodox.org/english/canonical/books.html",
  emoji: "📜",
  color: "#D4A843",
},
{
  title: "Carl Sagan",
  source: "carlsagan.com",
  category: "Astronomy",
  url: "https://carlsagan.com/",
  emoji: "🔭",
  color: "#38BDF8",
},
{
  title: "Octavia Butler",
  source: "octaviabutler.com",
  category: "Book",
  url: "https://www.octaviabutler.com/",
  emoji: "📖",
  color: "#D4A843",
},
{
  title: "The Crystal Bible Series",
  source: "Penguin Random House",
  category: "Book",
  url: "https://www.penguinrandomhouse.com/series/9SB/the-crystal-bible-series/",
  emoji: "📖",
  color: "#D4A843",
},
{
  title: "What Is Reiki?",
  source: "reiki.org",
  category: "Guide",
  url: "https://www.reiki.org/faqs/what-reiki",
  emoji: "🕯️",
  color: "#34D399",
},
{
  title: "Intentional Prayer in Traditional Yoruba Religion",
  source: "ileoro.org",
  category: "Guide",
  url: "https://www.ileoro.org/post/intentional-prayer-in-traditional-yoruba-religion",
  emoji: "🕯️",
  color: "#34D399",
},
{
  title: "Mercury Retrograde Table",
  source: "Astrology Zone",
  category: "Astrology",
  url: "https://www.astrologyzone.com/updated-mercury-retrograde-dates",
  emoji: "⭐",
  color: "#A78BFA",
},
{
  title: "Mercury Retrograde Dates",
  source: "Farmers' Almanac",
  category: "Calendar",
  url: "https://www.farmersalmanac.com/mercury-retrograde",
  emoji: "🌾",
  color: "#22C55E",
},
```

---

## VERIFICATION CHECKLIST

- [ ] 2028 Jan–Feb Mercury Retrograde now ends Feb 14 (not Feb 24)
- [ ] 2028 May–Jun Mercury Retrograde now ends Jun 13 (not Jun 24)
- [ ] 2029 shows four Mercury Retrograde periods (Jan, May, Sep, and the Dec-into-Jan-2030 one)
- [ ] 2030 shows three more Mercury Retrograde periods (Apr, Aug, Dec) plus the carryover from Dec 2029
- [ ] Sacred Altar picker includes Kola Nut, Palm Nut, Okra, and Yam as selectable offerings
- [ ] Sacred Altar picker still shows all original 42 symbols — nothing removed
- [ ] Resources: "Got2BOshun" spelling corrected in both entries (main link + Tools & Supplies link)
- [ ] Resources: "Yoruba Culture" and "Open Educational Resources for Ifa" both now show under "ACADEMIC/EDUCATION" (single merged category, no separate "Academic" or "Education" section remains)
- [ ] Resources: category section headers appear in alphabetical order top to bottom
- [ ] Resources: all 22 new links appear, tappable, and open correctly
- [ ] Resources: no existing link, title, or category (other than the two merges above) was altered
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
