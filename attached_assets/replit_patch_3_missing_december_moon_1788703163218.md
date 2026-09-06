Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

---

## Missing December 2026 Full Moon entry

**File:** `constants/spiritualData.ts`

The `NAMED_FULL_MOONS` array's 2026 section (starts at the comment `// 2026 Named Full Moons (aligned with USNO major-phase dates)`) currently has only 12 entries and ends at "Long Nights Full Moon" on November 24, 2026, then jumps directly to the `// ── 2027 Named Full Moons` section. The final Full Moon of 2026 — December 23 — is missing entirely. This has been verified against live astronomical data (USNO-sourced): the Full Moon on December 23, 2026 peaks at 8:28 PM Eastern, in Cancer (not Capricorn — Capricorn is the Sun's sign at that moment; Cancer is the Moon's sign, which is what a Full Moon name/sign should reference).

Add this entry as the last item in the 2026 section, immediately after the existing "Long Nights Full Moon" (Nov 24, 2026) entry and before the `// ── 2027 Named Full Moons` comment line:

```typescript
{
  name: "Cold Full Moon",
  date: new Date(2026, 11, 23),
  type: "named-moon",
  description: "Full Moon in Cancer. Exact opposition Wednesday, December 23 at 8:28 pm.",
  sign: "Cancer",
  tide: "Yuletide",
  polarity: "Waning",
  element: "Earth Projective",
  intent: "To be Silent",
  timing: "Narrow window: celebrate after the Moon enters Cancer at 4:58 pm, and before the exact opposition, a window of about 3 hours 50 minutes.",
},
```

Do not modify the existing November 24, 2026 entry or anything in the 2027 section — only insert this new object between them.

---

## Three Dark Moon entries have a `date` field that doesn't match their own `description` text (Sept/Oct/Dec 2026)

**File:** `constants/spiritualData.ts`

In the `DARK_MOONS` array, three 2026 entries have a hardcoded `date:` value that is 1-2 days later than what their own `description:` field (and real astronomical data) says. This is a plain data-entry mistake in these specific hardcoded values — not the USNO timezone-conversion bug, since these are static `new Date(year, month, day)` literals with no runtime UTC math involved. November's entry is correct and must not be touched.

Find and fix these three entries (identify each by its unique `description` text, since line numbers may shift):

1. Entry with description `"Dark Moon in Virgo. Exact conjunction Thursday, September 10 at 11:27 pm."` — currently has `date: new Date(2026, 8, 12)`. Change to `date: new Date(2026, 8, 10)`.

2. Entry with description `"Dark Moon in Libra. Exact conjunction Saturday, October 10 at 11:50 am."` — currently has `date: new Date(2026, 9, 11)`. Change to `date: new Date(2026, 9, 10)`.

3. Entry with description `"Dark Moon in Sagittarius. Exact conjunction Tuesday, December 8 at 7:52 pm."` — currently has `date: new Date(2026, 11, 9)`. Change to `date: new Date(2026, 11, 8)`.

Do NOT change the entry with description `"Dark Moon in Scorpio. Exact conjunction Monday, November 9 at 2:02 am."` — its `date: new Date(2026, 10, 9)` is already correct. Do not change any description text, sign, or other fields on any of these four entries — only the three `date` values listed above.

---

## VERIFICATION CHECKLIST

- [ ] December 23, 2026 now shows a Full Moon entry on the Calendar (Month/Week/Day/Schedule views) and Almanac
- [ ] The entry displays "Cold Full Moon," sign Cancer, and the correct 8:28 PM Wednesday timing
- [ ] The existing November 24, 2026 "Long Nights Full Moon" entry is unchanged
- [ ] The 2027 Named Full Moons section is unchanged
- [ ] Dark Moon on the calendar for September 2026 now shows on the 10th (not the 12th)
- [ ] Dark Moon on the calendar for October 2026 now shows on the 10th (not the 11th)
- [ ] Dark Moon on the calendar for December 2026 now shows on the 8th (not the 9th)
- [ ] Dark Moon on the calendar for November 2026 is unchanged (still the 9th)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
