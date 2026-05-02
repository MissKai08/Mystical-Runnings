import * as Notifications from "expo-notifications";
import {
  SABBATS,
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
  OSE_GROUPS,
} from "@/constants/spiritualData";
import type { NotificationSettings } from "./notificationSettings";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MS_PER_DAY = 86_400_000;
// April 26 2026 = Day 0 (Obatala) — must match spiritualData.ts anchor
const OSE_ANCHOR_MS = new Date(2026, 3, 26).getTime();

interface SchedulableEvent {
  name: string;
  date: Date;
  body: string;
}

function getOseTransitionEvents(windowDays = 90): SchedulableEvent[] {
  const now = new Date();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);

  const todayDiff = Math.round((noon.getTime() - OSE_ANCHOR_MS) / MS_PER_DAY);
  const todayIdx = ((todayDiff % 4) + 4) % 4;
  // Day offset where the CURRENT group started
  const currentGroupStart = todayDiff - todayIdx;
  // First upcoming transition = start of NEXT group
  let nextDiff = currentGroupStart + 4;

  const events: SchedulableEvent[] = [];
  const cutoff = now.getTime() + windowDays * MS_PER_DAY;

  while (true) {
    const transitionMs = OSE_ANCHOR_MS + nextDiff * MS_PER_DAY;
    if (transitionMs > cutoff) break;

    const transitionDate = new Date(transitionMs);
    transitionDate.setHours(7, 0, 0, 0);

    if (transitionDate > now) {
      const groupIdx = (((nextDiff % 4) + 4) % 4);
      const group = OSE_GROUPS[groupIdx];
      events.push({
        name: `✦ ${group.name}`,
        date: transitionDate,
        body: group.guidance,
      });
    }

    nextDiff += 4;
  }

  return events;
}

function getFutureEvents(settings: NotificationSettings): SchedulableEvent[] {
  const now = new Date();
  const events: SchedulableEvent[] = [];

  if (settings.types.namedMoons) {
    for (const m of NAMED_FULL_MOONS) {
      if (m.date > now)
        events.push({ name: `✦ ${m.name}`, date: m.date, body: m.description });
    }
  }

  if (settings.types.darkMoons) {
    for (const m of DARK_MOONS) {
      if (m.date > now)
        events.push({
          name: "🌑 Dark Moon",
          date: m.date,
          body: m.description,
        });
    }
  }

  if (settings.types.sabbats) {
    for (const s of SABBATS) {
      if (s.date > now)
        events.push({
          name: `🌿 ${s.name.split(" —")[0]}`,
          date: s.date,
          body: s.description,
        });
    }
  }

  if (settings.types.eclipses) {
    for (const e of ECLIPSES) {
      if (e.date > now)
        events.push({
          name: e.type === "solar-eclipse" ? `☀️ ${e.name}` : `🌕 ${e.name}`,
          date: e.date,
          body: e.description,
        });
    }
  }

  if (settings.types.mercuryRetrograde) {
    for (const r of MERCURY_RETROGRADES) {
      if (r.start > now)
        events.push({
          name: "☿ Mercury Retrograde Begins",
          date: r.start,
          body: r.label,
        });
    }
  }

  if (settings.types.ifaFestivals) {
    for (const f of IFA_FESTIVALS) {
      if (f.date > now)
        events.push({ name: `✨ ${f.name}`, date: f.date, body: f.description });
    }
  }

  if (settings.types.oseTransitions) {
    events.push(...getOseTransitionEvents(90));
  }

  return events;
}

function notifDate(eventDate: Date, advanceDays: number): Date {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - advanceDays);
  d.setHours(8, 0, 0, 0);
  return d;
}

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleAllNotifications(
  settings: NotificationSettings
): Promise<number> {
  await cancelAllNotifications();

  if (!settings.masterEnabled) return 0;

  const granted = await requestPermissions();
  if (!granted) return 0;

  const now = new Date();
  const events = getFutureEvents(settings);
  let scheduled = 0;

  // iOS allows max 64 local notifications.
  // Reserve 2 slots for repeating triggers (Ifa prayer day).
  // Ose transitions already included in `events` list above when enabled,
  // so they compete fairly in the sorted cap.
  const sorted = events
    .map((e) => {
      // Ose transition events already have their exact notify time as `date`;
      // for everything else, offset by advanceDays.
      const isOse = e.name.startsWith("✦ Ose");
      return { ...e, trigger: isOse ? e.date : notifDate(e.date, settings.advanceDays) };
    })
    .filter((e) => e.trigger > now)
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())
    .slice(0, 62);

  for (const evt of sorted) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: evt.name,
          body: evt.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: evt.trigger,
        },
      });
      scheduled++;
    } catch {
      // skip if individual scheduling fails
    }
  }

  // Weekly Ifa Prayer Day (Thursday = weekday 5 in Expo) — repeating trigger
  if (settings.types.ifaPrayerDays) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌟 Ifa Prayer Day",
          body: "Today is sacred for Ifa practice — begin with gratitude to Olodumare and Ori.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 5, // 1=Sun … 5=Thu in Expo's system
          hour: 7,
          minute: 0,
        },
      });
      scheduled++;
    } catch {
      // skip
    }
  }

  return scheduled;
}
