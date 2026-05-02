import * as Notifications from "expo-notifications";
import {
  SABBATS,
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
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

interface SchedulableEvent {
  name: string;
  date: Date;
  body: string;
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

  // iOS allows max 64 local notifications — take the soonest 60 to leave room
  const sorted = events
    .map((e) => ({ ...e, trigger: notifDate(e.date, settings.advanceDays) }))
    .filter((e) => e.trigger > now)
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())
    .slice(0, 60);

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

  // Weekly Ifa Prayer Day (Thursday = day 4) if enabled
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
