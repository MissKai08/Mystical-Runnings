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
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getEclipseForDate,
  getSabbatForDate,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getDailyOdu,
  addDays,
} from "@/constants/spiritualData";
import { ODU_REFLECTIONS } from "@/constants/spiritualData";
import {
  RELIGIOUS_HOLIDAYS,
  getHolidaysForDate,
  HOLIDAY_REGION_FLAG,
  HOLIDAY_REGION_LABEL,
  type HolidayRegion,
} from "@/constants/religiousHolidays";
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

function moonEmojiForType(type: string): string {
  if (type === "new-moon") return "🌑";
  if (type === "first-quarter") return "🌓";
  if (type === "full-moon") return "🌕";
  if (type === "last-quarter") return "🌗";
  return "🌙";
}

const JOURNAL_PROMPTS: Record<string, string> = {
  "new-moon": "What seeds of intention are you planting as this new cycle begins?",
  "first-quarter": "What obstacle is asking you to push through it right now?",
  "full-moon": "What is illuminated in your life right now that you can no longer look away from?",
  "named-moon": "What ancestral or seasonal wisdom is available to you in this moment?",
  "last-quarter": "What habit, belief, or pattern are you truly ready to release before the next cycle?",
  "waning-crescent": "As this cycle closes, what do you need to rest, restore, or surrender?",
  "dark-moon": "What lives in your shadow that is asking to be witnessed — not fixed, just seen?",
};

function getJournalPromptEvents(settings: NotificationSettings): SchedulableEvent[] {
  if (!settings.types.journalPrompt) return [];
  const now = new Date();
  const events: SchedulableEvent[] = [];

  for (const m of NAMED_FULL_MOONS) {
    if (m.date <= now) continue;
    const trigger = new Date(m.date);
    trigger.setHours(8, 0, 0, 0);
    events.push({
      name: `🌕 ${m.name} · Journal Prompt`,
      date: trigger,
      body: JOURNAL_PROMPTS["named-moon"],
    });
  }

  for (const m of DARK_MOONS) {
    if (m.date <= now) continue;
    const trigger = new Date(m.date);
    trigger.setHours(8, 0, 0, 0);
    events.push({
      name: `🌑 Dark Moon · Journal Prompt`,
      date: trigger,
      body: JOURNAL_PROMPTS["dark-moon"],
    });
  }

  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  const cutoff = new Date(now.getTime() + 120 * MS_PER_DAY);
  const namedKeys = new Set(NAMED_FULL_MOONS.map((m) => `${m.date.getFullYear()}-${m.date.getMonth()}-${m.date.getDate()}`));
  const darkKeys = new Set(DARK_MOONS.map((m) => `${m.date.getFullYear()}-${m.date.getMonth()}-${m.date.getDate()}`));

  while (cursor <= cutoff) {
    const m = getMoonPhaseData(cursor);
    if (m.isMajorPhase) {
      const k = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (!namedKeys.has(k) && !darkKeys.has(k)) {
        const trigger = new Date(cursor);
        trigger.setHours(8, 0, 0, 0);
        if (trigger > now) {
          const prompt = JOURNAL_PROMPTS[m.eventType] ?? JOURNAL_PROMPTS["full-moon"];
          events.push({
            name: `${moonEmojiForType(m.eventType)} ${m.name} · Journal Prompt`,
            date: trigger,
            body: prompt,
          });
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

function getDailyBriefingItems(date: Date, settings: NotificationSettings): string[] {
  const items: string[] = [];
  const nm = getNamedFullMoonForDate(date);
  const dm = getDarkMoonForDate(date);
  const moon = getMoonPhaseData(date);
  if (nm) items.push(`🌕 ${nm.name}`);
  else if (dm) items.push("🌑 Dark Moon");
  else if (moon.isMajorPhase) items.push(`${moonEmojiForType(moon.eventType)} ${moon.name}`);
  const ec = getEclipseForDate(date);
  if (ec) items.push(ec.type === "solar-eclipse" ? `☀️ ${ec.name}` : `🌕 ${ec.name}`);
  const sb = getSabbatForDate(date);
  if (sb) items.push(`🌿 ${sb.name.split(" —")[0]}`);
  const rt = getMercuryRetrogradeInfo(date);
  if (rt) items.push("☿ Mercury Retrograde");
  if (isIfaPrayerDay(date)) items.push("🌟 Ifa Prayer Day");
  const fv = getIfaFestivalForDate(date);
  if (fv) items.push(`✨ ${fv.name}`);
  const holidays = getHolidaysForDate(date);
  for (const h of holidays) {
    if (h.region === "us" && settings.types.holidaysUs) items.push(`${HOLIDAY_REGION_FLAG["us"]} ${h.name}`);
    if (h.region === "mexico" && settings.types.holidaysMexico) items.push(`${HOLIDAY_REGION_FLAG["mexico"]} ${h.name}`);
    if (h.region === "india" && settings.types.holidaysIndia) items.push(`${HOLIDAY_REGION_FLAG["india"]} ${h.name}`);
    if (h.region === "jewish" && settings.types.holidaysJewish) items.push(`${HOLIDAY_REGION_FLAG["jewish"]} ${h.name}`);
  }
  return items;
}

function getHolidayEvents(region: HolidayRegion, when: string): SchedulableEvent[] {
  const now = new Date();
  const flag = HOLIDAY_REGION_FLAG[region];
  const label = HOLIDAY_REGION_LABEL[region];
  return RELIGIOUS_HOLIDAYS.filter((h) => h.region === region && h.date > now).map((h) => ({
    name: `${flag} ${h.emoji} ${h.name}`,
    date: h.date,
    body: `${h.name} arrives ${when} — a sacred day in the ${label} tradition. ${h.description}`,
  }));
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

  if (settings.types.holidaysUs) {
    events.push(...getHolidayEvents("us", when));
  }

  if (settings.types.holidaysMexico) {
    events.push(...getHolidayEvents("mexico", when));
  }

  if (settings.types.holidaysIndia) {
    events.push(...getHolidayEvents("india", when));
  }

  if (settings.types.holidaysJewish) {
    events.push(...getHolidayEvents("jewish", when));
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

  // Daily Odu Reflection — pre-schedule 30 days at 7:30 AM
  if (settings.types.oduReflection) {
    for (let i = 0; i < 30 && scheduled < 62; i++) {
      const date = addDays(now, i + 1);
      date.setHours(0, 0, 0, 0);
      const odu = getDailyOdu(date);
      const reflection = ODU_REFLECTIONS[odu.name] ?? odu.guidance;
      const trigger = new Date(date);
      trigger.setHours(7, 30, 0, 0);
      if (trigger <= now) continue;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `✦ ${odu.name} · Daily Odu`,
            body: reflection,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        });
        scheduled++;
      } catch {
        // skip
      }
    }
  }

  // Daily Sacred Briefing — pre-schedule 30 days of 7 AM morning summaries
  if (settings.types.dailyBriefing) {
    const now = new Date();
    for (let i = 0; i < 30 && scheduled < 62; i++) {
      const date = addDays(now, i + 1);
      date.setHours(0, 0, 0, 0);
      const items = getDailyBriefingItems(date, settings);
      if (items.length === 0) continue;
      const trigger = new Date(date);
      trigger.setHours(7, 0, 0, 0);
      if (trigger <= now) continue;
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `✦ Sacred Briefing · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            body: items.join(" · "),
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: trigger,
          },
        });
        scheduled++;
      } catch {
        // skip
      }
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
