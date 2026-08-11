Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Scope: three small tweaks to the Prayer Voice picker feature only. Do not touch anything else in `prayer.tsx`, `VoicePickerModal.tsx`, or `voicePreference.ts` beyond what's specified.

---

## 1. Default voice — prefer the Nigerian voice instead of the generic system default

**File:** `utils/voicePreference.ts`

Add these two exports (do not remove or change `getVoicePreference`, `setVoicePreference`, or `clearVoicePreference`):
```typescript
export const PREFERRED_DEFAULT_VOICE_ID = "en-ng-x-tfn-network";

export async function getEffectiveVoicePreference(): Promise<string> {
  const saved = await getVoicePreference();
  return saved ?? PREFERRED_DEFAULT_VOICE_ID;
}
```

**File:** `app/(tabs)/prayer.tsx`

Replace:
```typescript
import { getVoicePreference } from "@/utils/voicePreference";
```
with:
```typescript
import { getEffectiveVoicePreference } from "@/utils/voicePreference";
```

Replace the `speak()` function:
```typescript
async function speak(text: string) {
  Speech.stop();
  const voiceId = await getVoicePreference();
  Speech.speak(text, {
    voice: voiceId ?? undefined,
    language: voiceId ? undefined : "en-NG",
    pitch: 0.85,
    rate: 0.65,
  });
}
```
with:
```typescript
async function speak(text: string) {
  Speech.stop();
  const voiceId = await getEffectiveVoicePreference();
  Speech.speak(text, {
    voice: voiceId,
    language: "en-NG",
    pitch: 0.85,
    rate: 0.65,
  });
}
```
If `en-ng-x-tfn-network` isn't installed on a given device, the TTS engine falls back to the plain `en-NG` language default — this is expected, not an error to handle.

---

## 2. Sort the voice list — en-NG first, then alphabetical

**File:** `components/VoicePickerModal.tsx`

In the `load()` function, right after this existing line:
```typescript
const english = all.filter(
  (v) => v.language?.toLowerCase().startsWith("en") ?? false
);
```
insert a sort before `setVoices(english.length > 0 ? english : all);`:
```typescript
english.sort((a, b) => {
  const aIsNG = a.language?.toLowerCase() === "en-ng";
  const bIsNG = b.language?.toLowerCase() === "en-ng";
  if (aIsNG && !bIsNG) return -1;
  if (bIsNG && !aIsNG) return 1;
  const langCompare = (a.language ?? "").localeCompare(b.language ?? "");
  if (langCompare !== 0) return langCompare;
  return (a.name ?? a.identifier).localeCompare(b.name ?? b.identifier);
});
```

---

## 3. Voice icon needs a label — currently unclear what it does

**File:** `app/(tabs)/prayer.tsx`

Replace the header's voice-picker trigger:
```tsx
<Pressable onPress={() => { Haptics.selectionAsync(); setVoicePickerOpen(true); }} hitSlop={10}>
  <Feather name="volume-2" size={18} color={colors.mutedForeground} />
</Pressable>
```
with:
```tsx
<Pressable
  onPress={() => { Haptics.selectionAsync(); setVoicePickerOpen(true); }}
  style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
  hitSlop={10}
>
  <Feather name="volume-2" size={16} color={colors.mutedForeground} />
  <Text style={{ fontSize: 12, fontWeight: "600", color: colors.mutedForeground }}>Voice</Text>
</Pressable>
```

---

## VERIFICATION CHECKLIST

- [ ] Fresh install / never opened Voice Picker before: tapping "Speak" on a prayer uses the Nigerian voice (`en-ng-x-tfn-network`), not the generic default
- [ ] Existing saved voice preference (if any) still overrides the new default — this only affects users who've never picked a voice
- [ ] Voice Picker list shows en-NG voices first, then the rest alphabetically by language/name
- [ ] Header now shows "🔊 Voice" (icon + label) next to "Ifa Prayer" instead of a bare icon
- [ ] Tapping it still opens the Voice Picker exactly as before
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
