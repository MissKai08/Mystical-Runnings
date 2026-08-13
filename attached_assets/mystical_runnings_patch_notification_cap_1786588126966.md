Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

Scope: one file, `utils/notificationScheduler.ts`. This fixes daily notifications (Odu Reflection, Sacred Intention Check-In, and potentially others) silently failing to schedule.

---

## 1. Notification budget cap incorrectly applies iOS's limit on Android too

**File:** `utils/notificationScheduler.ts`

Root cause: `scheduleAllNotifications()` shares a single `scheduled` counter (capped at 62) across ALL notification types in one call — event reminders (up to 17 types) + Moon Phase Journal Prompts are scheduled first and hard-sliced to 62 slots, then Daily Odu Reflection, then Daily Sacred Briefing, then Sacred Intention Check-In each check `scheduled < 62` before adding anything. If the first block already consumes most or all of the 62 slots (easy to do with many event types + prompts enabled), whichever daily type comes later in this sequence gets starved — which is exactly the "some daily notifications just don't show up" symptom, and which specific type loses out depends on how many event/prompt items happen to be due in the next 30 days at any given time.

The 62 cap exists only because **iOS** hard-limits apps to 64 local notifications (the existing code comment says so directly). Android has no such OS-level cap. Applying it unconditionally on Android is an artificial bottleneck that isn't needed there.

Add the import:
```typescript
import { ODU_REFLECTIONS } from "@/constants/spiritualData";
```
becomes:
```typescript
import { ODU_REFLECTIONS } from "@/constants/spiritualData";
import { Platform } from "react-native";
```

Inside `scheduleAllNotifications`, find:
```typescript
  const now = new Date();
  const events = [...getFutureEvents(settings), ...getJournalPromptEvents(settings)];
  let scheduled = 0;

  // iOS allows max 64 local notifications.
  // Reserve 2 slots for repeating triggers (Ifa prayer day + potential future repeats).
  const sorted = events
    .map((e) => {
      // Ose transitions and journal prompts already carry their exact notify time;
      // major phase events have midnight of the event day; everything else offsets by advanceDays.
      const isOse = e.name.startsWith("✦ Ose");
      const isPrompt = e.name.includes("· Journal Prompt");
      const useRaw = isOse || isPrompt;
      return { ...e, trigger: useRaw ? e.date : notifDate(e.date, settings.advanceDays) };
    })
    .filter((e) => e.trigger > now)
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())
    .slice(0, 62);
```
replace with:
```typescript
  const now = new Date();
  const events = [...getFutureEvents(settings), ...getJournalPromptEvents(settings)];
  let scheduled = 0;

  // iOS allows max 64 local notifications; reserve 2 slots for repeating triggers
  // (Ifa prayer day + potential future repeats). Android has no equivalent OS-level
  // cap, so this limit only applies on iOS — applying it on Android was starving
  // whichever daily notification type happened to be scheduled last in this function.
  const MAX_NOTIFICATIONS = Platform.OS === "ios" ? 62 : Number.MAX_SAFE_INTEGER;

  const sorted = events
    .map((e) => {
      // Ose transitions and journal prompts already carry their exact notify time;
      // major phase events have midnight of the event day; everything else offsets by advanceDays.
      const isOse = e.name.startsWith("✦ Ose");
      const isPrompt = e.name.includes("· Journal Prompt");
      const useRaw = isOse || isPrompt;
      return { ...e, trigger: useRaw ? e.date : notifDate(e.date, settings.advanceDays) };
    })
    .filter((e) => e.trigger > now)
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())
    .slice(0, MAX_NOTIFICATIONS);
```

Then replace each of the three remaining `scheduled < 62` guards with `scheduled < MAX_NOTIFICATIONS`. There are three occurrences, in the Daily Odu Reflection, Daily Sacred Briefing, and Daily Sacred Intention Reminder loops — all identical:
```typescript
    for (let i = 0; i < 30 && scheduled < 62; i++) {
```
becomes (in all three places):
```typescript
    for (let i = 0; i < 30 && scheduled < MAX_NOTIFICATIONS; i++) {
```

Do not change anything else about how these loops work — only the cap value.

---

## VERIFICATION CHECKLIST

- [ ] On Android: with all 17 event types, all 4 daily notification types, and journal prompts enabled, check the device's actual scheduled notification count (e.g. via `Notifications.getAllScheduledNotificationsAsync()` in a temporary debug log, or just observing over several days) — should now be well over 62 if that many are legitimately due
- [ ] Daily Sacred Briefing, Daily Odu Reflection, Moon Phase Journal Prompt, and Sacred Intention Check-In all fire on their expected days going forward, not just some of them
- [ ] Re-toggling notification settings still correctly cancels and reschedules everything (no change to that flow, just the cap)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
- [ ] (Lower priority, not required to close this out) If Kai later tests on iOS, confirm the cap still applies there at 62 as before — this patch should not change iOS behavior at all
