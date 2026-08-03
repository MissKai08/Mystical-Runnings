Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through the sections in order. After finishing, go through the verification checklist at the end and report status on every line.

---

## 1. Splash screen — confirm edge-to-edge fill

**File:** `components/AppSplashScreen.tsx`

The current version sizes the `<Image>` to exact screen dimensions but still uses `resizeMode="contain"`, which can still letterbox on aspect ratios that don't match the source PNG. Replace with `<ImageBackground resizeMode="cover">` so it always fills the screen regardless of device aspect ratio, while keeping the progress bar overlay exactly as it is now:

```typescript
import React, { useEffect, useState } from "react";
import { View, StyleSheet, ImageBackground, useWindowDimensions } from "react-native";
import * as SplashScreen from "expo-splash-screen";

const SPLASH_IMAGE = require("../assets/images/splash.png");

interface Props {
  onComplete: () => void;
  fontsLoaded?: boolean;
}

export function AppSplashScreen({ onComplete, fontsLoaded }: Props) {
  const { width, height } = useWindowDimensions();
  const [progress, setProgress] = useState(0);
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => { SplashScreen.hideAsync().catch(() => {}); }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) { clearInterval(progressTimer); return 100; }
        return prev + 2;
      });
    }, 100);
    const doneTimer = setTimeout(() => setTimerDone(true), 5500);
    return () => { clearInterval(progressTimer); clearTimeout(doneTimer); };
  }, []);

  useEffect(() => {
    if (timerDone && fontsLoaded) onComplete();
  }, [timerDone, fontsLoaded]);

  return (
    <ImageBackground
      source={SPLASH_IMAGE}
      style={{ position: "absolute", top: 0, left: 0, width, height, zIndex: 9999, alignItems: "center", justifyContent: "flex-end" }}
      resizeMode="cover"
    >
      <View style={[styles.progressSection, { width: width - 88 }]}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
          <View style={[styles.progressTip, { left: `${progress}%` as `${number}%`, marginLeft: -4 }]} />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  progressSection: { marginBottom: 72 },
  progressTrack: { width: "100%", height: 2, backgroundColor: "#7C3AED22", borderRadius: 1, overflow: "visible" },
  progressFill: { position: "absolute", left: 0, top: 0, height: 2, backgroundColor: "#D4A843", borderRadius: 1, shadowColor: "#D4A843", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6, elevation: 4 },
  progressTip: { position: "absolute", top: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: "#D4A843", shadowColor: "#D4A843", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 8, elevation: 6 },
});
```

---

## 2. USNO API — replace SunCalc

**File:** `hooks/useSunMoon.ts`

Keep the existing location fetching/caching logic untouched. Replace only the time-computation step. Remove the `suncalc` import as the primary path and replace with a USNO-backed async call:

```
GET https://aa.usno.navy.mil/api/rstt/oneday?date=YYYY-MM-DD&coords=LAT,LON&tz=TZ_OFFSET_HOURS
```
Response: `data.properties.data.sundata[]` and `data.properties.data.moondata[]`, each entry `{ phen: "R"|"S"|..., time: "HH:MM" }`. Filter `phen === "R"` (rise) / `"S"` (set) and combine with the requested date to build local `Date` objects.

Cache in AsyncStorage: key `` `@usno_rstt_${dateStr}_${lat.toFixed(2)}_${lon.toFixed(2)}` ``, TTL 24 hours. Wrap in try/catch; on any failure, fall back to the existing `suncalc` computation (keep that code as the fallback path, don't delete it). Preserve the `SunMoonTimes` interface exactly (`sunrise`, `sunset`, `moonrise`, `moonset`, `cityName`) — `SunMoonBar.tsx` must not need changes.

**File:** `constants/spiritualData.ts`

Do NOT touch `PHASE_LOOKUP` or its 2024–2027 hardcoded entries. Only replace the mathematical fallback formula used for years outside that table with a call to:
```
GET https://aa.usno.navy.mil/api/moon/phases/year?year=YYYY&nump=99
```
Response: `data.phasedata[]`, each `{ phase: "New Moon"|"First Quarter"|"Full Moon"|"Last Quarter", date: "YYYY MMM DD", time: "HH:MM" }`. Cache under `` `@usno_phases_${year}` ``, 30-day TTL. On failure, fall back to the existing math formula (keep it, don't remove).

---

## 3. Notifications — remove Save button, auto-save

**File:** `components/NotificationSettingsModal.tsx`

Remove the "Save" button and the `handleSave` function entirely. Every settings mutation (`toggleMaster`, `updateType`, the advance-days segment press) should trigger auto-save: call `saveNotificationSettings(settings)` then `scheduleAllNotifications(settings)`, debounced ~600ms after the last change so a burst of toggles doesn't trigger a reschedule per tap. Use a `useRef` timer that resets on each call.

Turning the master switch OFF must cancel scheduled notifications immediately (not wait on a debounce) — call `cancelAllNotifications()` directly inside `toggleMaster` when `value === false`, in addition to the debounced save/schedule flow.

Replace the old "Saved confirmation" card (which only showed after the Save button) with a brief, quiet confirmation that appears after each auto-save fires (e.g. a small checkmark + "Synced" that fades after ~2 seconds) — same visual slot as the current `savedCount` card, just triggered automatically instead of on button press.

Update the footer note (currently "Press Save to apply changes...") to reflect the new behavior, e.g. "Reminders are scheduled locally on your device and update automatically. No account or internet required."

**File:** `utils/notificationSettings.ts`

In `DEFAULT_SETTINGS`, change:
```typescript
masterEnabled: false,
```
to:
```typescript
masterEnabled: true,
```
and change `dailyBriefing: false` to `dailyBriefing: true` in the `types` object. Leave every other default as-is.

---

## 4. Backup redesign — folder picker, timestamps, remove fake cloud auto-backup

**File:** `utils/backup.ts`

**4a. Timestamped filenames.** Replace the fixed `BACKUP_FILENAME` constant with a function that generates a timestamped name for every export (manual local, manual cloud, and auto-backup):
```typescript
function generateBackupFilename(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `mystical-runnings-backup-${stamp}.json`;
}
```
Use this everywhere `BACKUP_FILENAME` is currently referenced in `exportBackup`, `exportBackupSilent`, and `getLastBackupDate`. Note `getLastBackupDate` currently looks for the fixed filename directly — since the filename is now dynamic, that function should rely on the `LAST_MANUAL_EXPORT_KEY` timestamp in AsyncStorage instead of reading a fixed file path (it already has that as a fallback — make it the primary path for native, not just web).

**4b. Android folder picker (Storage Access Framework).** Add new functions:
```typescript
export async function pickBackupFolder(): Promise<string | null> {
  const { StorageAccessFramework } = await import("expo-file-system");
  const result = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!result.granted) return null;
  await AsyncStorage.setItem(BACKUP_FOLDER_URI_KEY, result.directoryUri);
  return result.directoryUri;
}

export async function getBackupFolderUri(): Promise<string | null> {
  return AsyncStorage.getItem(BACKUP_FOLDER_URI_KEY);
}
```
(Add `const BACKUP_FOLDER_URI_KEY = "@mystical_backup_folder_uri";` near the other key constants.) This is Android-only — guard with `Platform.OS === "android"`.

**4c. Local export uses the picked folder.** In `exportBackup(destination)`, for the `"local"` case on Android: if a folder URI is stored, write into it using `StorageAccessFramework.createFileAsync(folderUri, filename, "application/json")` followed by writing the JSON content to that URI. If no folder is set yet, fall back to current Documents-folder behavior but the UI (see 4e) should prompt the user to pick one.

For iOS: keep writing to `Paths.document` (no SAF equivalent available), but see 4d for the visibility fix.

**4d. iOS Documents visibility.** File: `app.json`. Add to the `ios` block:
```json
"ios": {
  "supportsTablet": false,
  "infoPlist": {
    "UIFileSharingEnabled": true,
    "LSSupportsOpeningDocumentsInPlace": true
  }
}
```
This makes the app's Documents folder visible under "On My iPhone" in the Files app, so local exports become findable without needing a picker.

**4e. Backup settings UI.** File: `components/BackupRestoreModal.tsx`. Add a "Backup Folder" row (Android only — hide entirely on iOS) showing either "Not set — tap to choose" or the currently selected folder name, with a button that calls `pickBackupFolder()`. If auto-backup frequency is Daily/Weekly and no folder is set, show a small warning nudging the user to pick one.

**4f. Remove fake "Cloud" auto-backup destination.** The `AUTO_BACKUP_DEST_KEY`/`getAutoBackupDestination`/`setAutoBackupDestination` functions and the "Destination: Local/Cloud" UI toggle should be removed entirely — auto-backup only ever has a **frequency** (off/daily/weekly), no destination choice. `exportBackupSilent()` should always write to the picked Android folder (or Documents/iCloud-synced Documents on iOS) using the timestamped filename from 4a. Manual export keeps both "Local" and "Cloud (Share)" buttons exactly as they work today — only the *auto*-backup destination toggle goes away.

---

## 5. Wheel of the Year 2026 — remaining fixes

**File:** `constants/spiritualData.ts`

**5a. Fix Dark Moon Gemini date.** In `DARK_MOONS`, find the entry with `description: "Dark Moon in Gemini. Exact conjunction Sunday, June 14 at 10:54 pm."` — its `date` is `new Date(2026, 5, 15)` but should be `new Date(2026, 5, 14)` to match the description. Change only the `date` field.

**5b. Add tide/element/polarity/intent to the 9 `SABBATS` entries.** These currently have only `name`, `date`, `type`, `description`. Add the following fields to each (matched by `name`), right after `description`:

| Sabbat (`name`) | tide | polarity | element | intent |
|---|---|---|---|---|
| Yule — Winter Solstice (Dec 2025) | Imbolctide | Waxing | Earth Receptive | To Resonate |
| Imbolc — High Winter | Imbolctide | Waxing | Earth Receptive | To Resonate |
| Ostara — Spring Equinox | Ostaratide | Waning | Air Projective | To Know |
| Beltane — High Spring | Beltanetide | Waxing | Air Receptive | To Wonder |
| Litha — Summer Solstice | Lithatide | Waning | Fire Projective | To Will |
| Lammas — High Summer | Lammastide | Waxing | Fire Receptive | To Surrender |
| Mabon — Autumn Equinox | Mabontide | Waning | Water Projective | To Dare |
| Samhain — High Autumn | Samhaintide | Waxing | Water Receptive | To Accept |
| Yule — Winter Solstice (Dec 2026) | Yuletide | Waning | Earth Projective | To be Silent |

Do not change `name`, `date`, `type`, or `description` on these entries.

---

## 6. "curated by MissKai" — hyperlink

**File:** `app/(tabs)/index.tsx`

Find:
```typescript
<Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>curated by MissKai</Text>
```
Replace with:
```typescript
<Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>
  curated by{" "}
  <Text
    style={styles.brandSubtitleLink}
    onPress={() => Linking.openURL("https://www.misskai.com")}
    accessibilityRole="link"
  >
    MissKai
  </Text>
</Text>
```
Add `Linking` to the existing `react-native` import list at the top of the file. In the `StyleSheet.create` block, add right after `brandSubtitle`:
```typescript
brandSubtitleLink: {
  textDecorationLine: "underline",
  color: "#D4A843",
},
```

---

## 7. Astro events 2027–2030 (meteor showers, oppositions, elongations, solstices)

**File:** `constants/spiritualData.ts`, append to `ASTRO_EVENTS`

Add entries in the exact same object shape as the existing 2026 entries (`name`, `date`, `type`, `description`, `endDate` where applicable). Use plain descriptive language matching the existing style — do not copy wording from any external site.

**Meteor showers (same dates every year in this range — add once per year):**

| Shower | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|
| Quadrantids | Jan 3–4 | Jan 3–4 | Jan 3–4 | Jan 3–4 |
| Lyrids | Apr 22–23 | Apr 22–23 | Apr 22–23 | Apr 22–23 |
| Eta Aquarids | May 6–7 | May 6–7 | May 6–7 | May 6–7 |
| Delta Aquarids | Jul 28–29 | Jul 28–29 | Jul 28–29 | Jul 28–29 |
| Perseids | Aug 12–13 | Aug 12–13 | Aug 12–13 | Aug 12–13 |
| Draconids | Oct 7 | Oct 7 | Oct 7 | Oct 7 |
| Orionids | Oct 21–22 | Oct 21–22 | Oct 21–22 | Oct 21–22 |
| Taurids | Nov 4–5 | Nov 4–5 | Nov 4–5 | Nov 4–5 |
| Leonids | Nov 17–18 | Nov 17–18 | Nov 17–18 | Nov 17–18 |
| Geminids | Dec 13–14 | Dec 13–14 | Dec 13–14 | Dec 13–14 |
| Ursids | Dec 21–22 | Dec 21–22 | Dec 21–22 | Dec 21–22 |

**Planet oppositions:**

| Planet | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|
| Mars | Feb 19 | — | Mar 25 | — |
| Jupiter | Feb 10 | Mar 12 | Apr 11 | May 13 |
| Saturn | Oct 18 | Oct 30 | Nov 13 | Nov 27 |
| Uranus | Nov 30 | Dec 3 | Dec 8 | Dec 12 |
| Neptune | Sep 28 | Sep 30 | Oct 2 | Oct 5 |

**Planet elongations (Mercury alternates Eastern/Western roughly every 6 weeks; Venus much less often):**

- **2027 Mercury:** Feb 3 (E), Mar 17 (W), May 28 (E), Jul 15 (W), Sep 24 (E), Nov 4 (W). **Venus:** Jan 3 (W).
- **2028 Mercury:** Jan 17 (E), Feb 27 (W), May 9 (E), Jun 26 (W), Sep 6 (E), Oct 17 (W), Dec 31 (E). **Venus:** Mar 22 (E), Aug 11 (W).
- **2029 Mercury:** Feb 9 (W), Apr 21 (E), Jun 8 (W), Aug 19 (E), Oct 1 (W), Dec 14 (E). **Venus:** Oct 27 (E).
- **2030 Mercury:** Jan 22 (W), Apr 4 (E), May 21 (W), Aug 2 (E), Sep 15 (W), Nov 26 (E). **Venus:** Mar 17 (W).

(E = Greatest Eastern Elongation, visible evening sky after sunset. W = Greatest Western Elongation, visible morning sky before sunrise.)

**Solstices/equinoxes:**

| | 2027 | 2028 | 2029 | 2030 |
|---|---|---|---|---|
| March Equinox | Mar 20 | Mar 20 | Mar 20 | Mar 20 |
| June Solstice | Jun 21 | Jun 20 | Jun 21 | Jun 21 |
| September Equinox | Sep 23 | Sep 22 | Sep 22 | Sep 22 |
| December Solstice | Dec 22 | Dec 21 | Dec 21 | Dec 21 |

Do not add eclipses, moon phase/new-moon/full-moon entries, or supermoon flags to `ASTRO_EVENTS` — those are handled separately in sections 8–9 below or already covered by `PHASE_LOOKUP`.

---

## 8. Named full moons 2028–2030 (folk names + supermoon/blue moon flags)

**File:** `constants/spiritualData.ts`, append to `NAMED_FULL_MOONS`

Add entries in the same shape as existing 2026 entries (`name`, `date`, `type: "named-moon"`, `description`, `sign` where known — sign is not available for these years, omit it). Use the standard Native American folk-name cycle already established: Wolf, Snow, Worm, Pink, Flower, Strawberry, Buck, Sturgeon, Corn/Harvest, Hunters, Beaver, Cold.

Add a boolean `isSupermoon` and/or `isBlueMoon` field to `WheelEvent` if not already present, and set `true` only where noted below.

**2028:** Wolf Moon Jan 12 (supermoon), Snow Moon Feb 10 (supermoon), Worm Moon Mar 11 (supermoon), Pink Moon Apr 9, Flower Moon May 8, Strawberry Moon Jun 7, Buck Moon Jul 6, Sturgeon Moon Aug 5, Corn Moon Sep 3, Hunters/Harvest Moon Oct 3, Beaver Moon Nov 2, Cold Moon Dec 2, plus a second full moon Dec 31 (blue moon, no folk name — note in description that it's the rare second full moon in the same calendar month).

**2029:** Wolf Moon Jan 30, Snow Moon Feb 28 (supermoon), Worm Moon Mar 30 (supermoon), Pink Moon Apr 28 (supermoon), Flower Moon May 27, Strawberry Moon Jun 26, Buck Moon Jul 25, Sturgeon Moon Aug 24 (blue moon — third of four full moons this season), Corn/Harvest Moon Sep 22, Hunters Moon Oct 22, Beaver Moon Nov 21, Cold Moon Dec 20.

**2030:** Wolf Moon Jan 19, Snow Moon Feb 18, Worm Moon Mar 19, Pink Moon Apr 18, Flower Moon May 17, Strawberry Moon Jun 15, Buck Moon Jul 15, Sturgeon Moon Aug 13, Corn/Harvest Moon Sep 11, Hunters Moon Oct 11, Beaver Moon Nov 10, Cold Moon Dec 9. No supermoons or blue moons in 2030.

Dates for 2027 are NOT added here — 2027 gets the full Wheel-of-Year treatment in section 9 instead, which supersedes this basic name-only approach for that year.

---

## 9. Wheel of the Year 2027 — full treatment

**File:** `constants/spiritualData.ts`

Source: Heron Michelle, "2027 Witch's Wheel of the Year Calendar," published July 31, 2026 on Patheos (Witch on Fire blog). Same author/framework as the existing 2026 data. Add full entries to `SABBATS`, `NAMED_FULL_MOONS`, and `DARK_MOONS` for 2027, matching the existing object shape exactly (`name`, `date`, `type`, `description`, `sign`, `tide`, `polarity`, `element`, `intent`, `timing`).

For full moon `name` fields, pair Heron Michelle's poetic title with the standard folk name in the format `"[Her Title] · [Folk Name]"` (e.g., `"Quickening Full Moon · Wolf Moon"`), since her 2027 titles differ from the folk-name convention used elsewhere in the app. Dark moons don't have folk-name equivalents — use her title alone (e.g., `"Dark Moon Capricorn"`).

**Cross-check all dates against the existing `PHASE_LOOKUP` table before finalizing** — `PHASE_LOOKUP` already has authoritative USNO dates through 2027, and it is the source of truth if there's ever a one-day discrepancy with the source article (which reports exact times in Eastern Time, so its calendar date should normally already agree with `PHASE_LOOKUP`, but verify each one).

By tide period:

**Imbolctide (Waxing – Earth Receptive – To Resonate):** Dark Moon Capricorn, Jan 7, 2027, conjunction 3:24 PM ET. Quickening Full Moon · Wolf Moon, Leo, Jan 22, 2027, opposition 7:17 AM ET. Sabbat of Imbolc — High Winter, Feb 3, 2027, sun reaches 15° Aquarius. *(Note: Sabbat of Yule/Dec 21 2026 and Cold Full Moon/Dec 23 2026 that open this tide already exist in the data from section 5.)*

**Ostaratide (Waning – Air Projective – To Know):** Dark Moon Aquarius (Solar Eclipse), Feb 6, 2027, conjunction 10:56 AM ET. Storm Full Moon · Snow Moon (Lunar Eclipse), Virgo, Feb 20, 2027, opposition 6:14 PM ET. Dark Moon Pisces, Mar 8, 2027, conjunction 4:29 AM ET. Sabbat of Ostara — Spring Equinox, Mar 20, 2027, sun enters Aries 4:25 PM ET.

**Beltanetide (Waxing – Air Receptive – To Wonder):** Wind Full Moon · Worm Moon, Libra, Mar 22, 2027, opposition 6:44 AM ET. Dark Moon Aries, Apr 6, 2027, conjunction 7:51 PM ET. Flower Full Moon · Pink Moon, Scorpio, Apr 20, 2027, opposition 6:27 PM ET. Sabbat of Beltane — High Spring, May 5, 2027, sun reaches 15° Taurus.

**Lithatide (Waning – Fire Projective – To Will):** Dark Moon Taurus, May 6, 2027, conjunction 6:59 AM ET. Blue Moon Scorpio (Full Moon · Flower Moon, blue moon — third of four this season), May 20, 2027, opposition 6:59 AM ET — note in the description that Lunar Leadership shifts to Dark Moon leadership from this point forward per the source's framework. Dark Moon Gemini, Jun 4, 2027, conjunction 3:40 PM ET — **also apply the June 14 correction pattern from section 5a here: verify this date against `PHASE_LOOKUP` for June 2027's new moon before finalizing.** Strong Sun Full Moon · Strawberry Moon, Sagittarius, Jun 18, 2027, opposition 8:44 PM ET (verify exact date against `PHASE_LOOKUP`; source time converts close to midnight ET and may land on the 18th or 19th depending on the table). Sabbat of Litha — Summer Solstice, Jun 21, 2027, sun enters Cancer 10:11 AM ET.

**Lammastide (Waxing – Fire Receptive – To Surrender):** Dark Moon Cancer, Jul 3, 2027, conjunction 11:02 PM ET. Blessing Full Moon · Buck Moon (Lunar Eclipse), Capricorn, Jul 18, 2027, opposition 11:45 AM ET. Dark Moon Leo (Solar Eclipse), Aug 2, 2027, conjunction 6:05 AM ET. Sabbat of Lammas — High Summer, Aug 7, 2027, sun reaches 15° Leo.

**Mabontide (Waning – Water Projective – To Dare):** Corn Full Moon · Sturgeon Moon (Lunar Eclipse), Aquarius, Aug 17, 2027, opposition 3:29 AM ET. Dark Moon Virgo, Aug 31, 2027, conjunction 1:41 PM ET. Harvest Full Moon · Corn Moon, Pisces, Sep 15, 2027, opposition 7:03 PM ET. Sabbat of Mabon — Autumn Equinox, Sep 23, 2027, sun enters Libra 2:02 AM ET.

**Samhaintide (Waxing – Water Receptive – To Accept):** Dark Moon Libra, Sep 29, 2027, conjunction 10:36 PM ET. Blood Full Moon · Hunters Moon, Aries, Oct 15, 2027, opposition 9:47 AM ET. Dark Moon Scorpio, Oct 29, 2027, conjunction 9:37 AM ET. Sabbat of Samhain — High Autumn, Nov 7, 2027, sun reaches 15° Scorpio.

**Yuletide (Waning – Earth Projective – To be Silent):** Mourning Full Moon · Beaver Moon, Taurus, Nov 13, 2027, opposition 10:26 PM ET. Dark Moon Sagittarius, Nov 27, 2027, conjunction 10:24 PM ET. Long Nights Full Moon · Cold Moon, Gemini, Dec 13, 2027, opposition 11:09 AM ET. Sabbat of Yule — Winter Solstice, Dec 21, 2027, sun enters Capricorn 9:42 PM ET.

Write `description` fields in the same plain style as existing entries (mention sign, exact time, and any eclipse note) — do not copy the source article's phrasing verbatim, paraphrase in the app's existing voice. `timing` fields should give the same kind of "best celebrated..." guidance the 2026 entries already include, derived from the source's "narrow window" / "best celebrated the night before" notes.

---

## VERIFICATION CHECKLIST — report status of each line

- [ ] Splash screen fills edge-to-edge on a tall phone with no border showing
- [ ] Sun/moon times pull from USNO with SunCalc fallback working in airplane mode
- [ ] Moon phase for a date past 2027 pulls from USNO year-phases API with math-formula fallback intact
- [ ] Notification settings save automatically on toggle — no Save button visible anywhere
- [ ] Turning master notifications off immediately cancels all scheduled notifications (test: toggle off, check device notification settings, confirm none remain scheduled)
- [ ] Fresh install: master notifications default to ON
- [ ] Android: "Backup Folder" picker exists in Backup & Restore settings, remembers the chosen folder
- [ ] Local export writes into the picked folder (or prompts to pick one) with a timestamped filename
- [ ] Auto-backup has no "Cloud" destination option — frequency only
- [ ] iOS: Documents folder is visible in the Files app under "On My iPhone"
- [ ] June 14, 2026 (not June 15) shows the Gemini Dark Moon
- [ ] All 9 2026 Sabbats show tide/polarity/element/intent details
- [ ] Tapping "MissKai" in the home header opens https://www.misskai.com
- [ ] Meteor showers, oppositions, elongations, and solstices appear correctly for 2027–2030 on the calendar
- [ ] Named full moons with correct folk names appear for 2028–2030, with supermoon/blue moon notes where applicable
- [ ] Full 2027 Wheel of the Year (sabbats, full/dark moons with signs and tide data, eclipse notes) displays correctly, including on the Dec 2027 Sabbat of Yule
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
