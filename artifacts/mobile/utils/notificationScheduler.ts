import * as Notifications from "expo-notifications";
import {
  SABBATS,
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
  OSE_GROUPS,
  getMoonPhaseData,
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

// Days ahead language for notification bodies
function tomorrowOrIn(advanceDays: number): string {
  if (advanceDays === 1) return "tomorrow";
  if (advanceDays === 2) return "in two days";
  return "in three days";
}

function getOseTransitionEvents(windowDays = 90): SchedulableEvent[] {
  const now = new Date();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);

  const todayDiff = Math.round((noon.getTime() - OSE_ANCHOR_MS) / MS_PER_DAY);
  const todayIdx = ((todayDiff % 4) + 4) % 4;
  const currentGroupStart = todayDiff - todayIdx;
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

function getComputedMajorPhaseEvents(windowDays = 120): SchedulableEvent[] {
  const now = new Date();
  const events: SchedulableEvent[] = [];

  // Days covered by the curated named/dark moon lists — skip those
  const namedMoonKeys = new Set(
    NAMED_FULL_MOONS.map((m) => `${m.date.getFullYear()}-${m.date.getMonth()}-${m.date.getDate()}`)
  );
  const darkMoonKeys = new Set(
    DARK_MOONS.map((m) => `${m.date.getFullYear()}-${m.date.getMonth()}-${m.date.getDate()}`)
  );

  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const cutoff = new Date(now.getTime() + windowDays * MS_PER_DAY);

  while (cursor <= cutoff) {
    const m = getMoonPhaseData(cursor);
    if (m.isMajorPhase) {
      const k = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (!namedMoonKeys.has(k) && !darkMoonKeys.has(k)) {
        const eventDate = new Date(cursor);
        eventDate.setHours(0, 0, 0, 0);

        let name: string;
        let body: string;

        switch (m.eventType) {
          case "new-moon":
            name = "🌑 New Moon";
            body =
              "The New Moon rises — a portal of fresh beginnings opens. Plant seeds of intention and open yourself to the new cycle ahead.";
            break;
          case "first-quarter":
            name = "🌓 First Quarter Moon";
            body =
              "The First Quarter Moon arrives — take decisive action on your intentions. Push past resistance with clarity and courage.";
            break;
          case "full-moon":
            name = "🌕 Full Moon";
            body =
              "The Full Moon peaks — it illuminates what was hidden and calls for completion, gratitude, and letting go.";
            break;
          case "last-quarter":
            name = "🌗 Last Quarter Moon";
            body =
              "The Last Quarter Moon arrives — forgive, release, and clear space before the next lunar cycle begins.";
            break;
          default:
            name = `🌙 ${m.name}`;
            body = `The ${m.name} arrives — align with the moon's natural rhythm.`;
        }

        events.push({ name, date: eventDate, body });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

function getFutureEvents(settings: NotificationSettings): SchedulableEvent[] {
  const now = new Date();
  const events: SchedulableEvent[] = [];
  const when = tomorrowOrIn(settings.advanceDays);

  if (settings.types.namedMoons) {
    for (const m of NAMED_FULL_MOONS) {
      if (m.date > now) {
        events.push({
          name: `🌕 ${m.name}`,
          date: m.date,
          body: `The ${m.name} rises ${when}${m.sign ? ` in ${m.sign}` : ""} — a sacred time for illumination, release, and gratitude.`,
        });
      }
    }
  }

  if (settings.types.darkMoons) {
    for (const m of DARK_MOONS) {
      if (m.date > now) {
        events.push({
          name: `🌑 Dark Moon${m.sign ? ` · ${m.sign}` : ""}`,
          date: m.date,
          body: `The Dark Moon${m.sign ? ` in ${m.sign}` : ""} falls ${when} — rest, turn inward, and release what no longer serves before the new cycle ignites.`,
        });
      }
    }
  }

  if (settings.types.majorPhases) {
    events.push(...getComputedMajorPhaseEvents(120));
  }

  if (settings.types.sabbats) {
    for (const s of SABBATS) {
      if (s.date > now) {
        const shortName = s.name.split(" —")[0];
        events.push({
          name: `🌿 ${shortName}`,
          date: s.date,
          body: `${shortName} arrives ${when} — honor this sacred turning of the Wheel of the Year. ${s.description}`,
        });
      }
    }
  }

  if (settings.types.eclipses) {
    for (const e of ECLIPSES) {
      if (e.date > now) {
        const isSolar = e.type === "solar-eclipse";
        events.push({
          name: isSolar ? `☀️ ${e.name}` : `🌕 ${e.name}`,
          date: e.date,
          body: isSolar
            ? `A solar eclipse arrives ${when} — a powerful portal for bold new beginnings. Set intentions with full awareness; eclipses accelerate what is ready to emerge.`
            : `A lunar eclipse arrives ${when} — deep illumination and release. What it reveals cannot be unseen. Trust the profound process of transformation.`,
        });
      }
    }
  }

  if (settings.types.mercuryRetrograde) {
    for (const r of MERCURY_RETROGRADES) {
      if (r.start > now) {
        events.push({
          name: "☿ Mercury Retrograde Begins",
          date: r.start,
          body: `Mercury turns retrograde ${when} — slow down, review commitments, back up your data, and speak with extra care until ${r.end.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
        });
      }
      if (r.end > now) {
        events.push({
          name: "☿ Mercury Goes Direct",
          date: r.end,
          body: `Mercury goes direct ${when} — communications, technology, and travel begin to flow freely again. Resume forward motion with clarity.`,
        });
      }
    }
  }

  if (settings.types.ifaFestivals) {
    for (const f of IFA_FESTIVALS) {
      if (f.date > now) {
        events.push({
          name: `✨ ${f.name}`,
          date: f.date,
          body: `The ${f.name} arrives ${when} — honor the Orisa through prayer, offerings, music, and communal celebration.`,
        });
      }
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
  // Reserve 2 slots for repeating triggers (Ifa prayer day + potential future repeats).
  const sorted = events
    .map((e) => {
      // Ose transition events already have their exact notify time as `date`;
      // major phase events already have their date set to midnight of the event day;
      // for everything else, offset by advanceDays.
      const isOse = e.name.startsWith("✦ Ose");
      const isMajorPhase =
        e.name.startsWith("🌑 New") ||
        e.name.startsWith("🌓") ||
        e.name.startsWith("🌗");
      const useRaw = isOse;
      return { ...e, trigger: useRaw ? e.date : notifDate(e.date, settings.advanceDays) };
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
          body: "Today is sacred for Ifa practice — open with gratitude to Olodumare and Ori, and carry that devotion through your day.",
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
