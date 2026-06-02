import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import {
  getMoonPhaseData,
  getMercuryRetrogradeInfo,
  isIfaPrayerDay,
  getIfaFestivalForDate,
  getSabbatForDate,
  getNamedFullMoonForDate,
  getDarkMoonForDate,
  getEclipseForDate,
  getOseDay,
  OSE_GROUPS,
  isSameDay,
  EVENT_COLORS,
  addDays,
  formatDateShort,
} from "@/constants/spiritualData";
import { getDailyWisdom } from "@/constants/dailyWisdom";
import { getDailyProverb } from "@/constants/ifaProverbs";
import {
  getHolidaysForDate,
  HOLIDAY_REGION_COLOR,
  HOLIDAY_REGION_LABEL,
  HOLIDAY_REGION_FLAG,
} from "@/constants/religiousHolidays";
import { saveIntention, loadIntention } from "@/utils/intentionsStorage";
import { saveUserProfile, isTodayBirthday, UserProfile } from "@/utils/userProfile";
import { MAX_SCALE_INDEX } from "@/utils/fontScale";
import { useFontScale } from "@/contexts/FontScaleContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { MoonPhaseCircle } from "@/components/MoonPhaseCircle";
import { LunarProgressBar } from "@/components/LunarProgressBar";
import { TodayWidget } from "@/components/TodayWidget";
import { NotificationSettingsModal } from "@/components/NotificationSettingsModal";
import { OseDetailModal } from "@/components/OseDetailModal";
import { EventDetailModal, EventDetail } from "@/components/EventDetailModal";
import MoonWaterModal from "@/components/MoonWaterModal";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const PHASE_EMOJI: Record<string, string> = {
  "dark-moon": "🌑", "new-moon": "🌑", "waxing-crescent": "🌒",
  "first-quarter": "🌓", "waxing-gibbous": "🌔", "full-moon": "🌕",
  "named-moon": "🌕", "waning-gibbous": "🌖", "last-quarter": "🌗",
  "waning-crescent": "🌘",
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];


export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const today = useMemo(() => new Date(), []);
  const moon = useMemo(() => getMoonPhaseData(today), [today]);
  const retrograde = useMemo(() => getMercuryRetrogradeInfo(today), [today]);
  const prayerDay = useMemo(() => isIfaPrayerDay(today), [today]);
  const festival = useMemo(() => getIfaFestivalForDate(today), [today]);
  const sabbat = useMemo(() => getSabbatForDate(today), [today]);
  const namedMoon = useMemo(() => getNamedFullMoonForDate(today), [today]);
  const darkMoon = useMemo(() => getDarkMoonForDate(today), [today]);
  const eclipse = useMemo(() => getEclipseForDate(today), [today]);
  const oseDay = useMemo(() => getOseDay(today), [today]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [oseModalGroup, setOseModalGroup] = useState<import("@/constants/spiritualData").OseGroup | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [intentionModalOpen, setIntentionModalOpen] = useState(false);
  const [intentionDraft, setIntentionDraft] = useState("");
  const [currentIntention, setCurrentIntention] = useState<string | null>(null);
  const [moonWaterOpen, setMoonWaterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ firstName: "", birthMonth: "", birthDay: "" });
  const { scaleIdx, fs, handleScaleChange } = useFontScale();
  const { profile, setProfile } = useUserProfile();
  const isBirthday = useMemo(() => profile ? isTodayBirthday(profile, today) : false, [profile, today]);

  const lastNewMoonDate = useMemo(() => {
    for (let i = 0; i <= 32; i++) {
      const d = addDays(today, -i);
      const dm = getDarkMoonForDate(d);
      const m = getMoonPhaseData(d);
      if (dm || (m.isMajorPhase && m.eventType === "new-moon")) return d;
    }
    return null;
  }, [today]);

  const isNewMoonWindow = useMemo(() => {
    if (darkMoon || (moon.isMajorPhase && moon.eventType === "new-moon")) return true;
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    const dm0 = getDarkMoonForDate(yesterday);
    const dm1 = getDarkMoonForDate(tomorrow);
    const m0 = getMoonPhaseData(yesterday);
    const m1 = getMoonPhaseData(tomorrow);
    return !!(dm0 || dm1 || (m0.isMajorPhase && m0.eventType === "new-moon") || (m1.isMajorPhase && m1.eventType === "new-moon"));
  }, [today, darkMoon, moon]);

  const isFullMoonWindow = useMemo(() => {
    return !!(namedMoon || (moon.isMajorPhase && moon.eventType === "full-moon"));
  }, [today, namedMoon, moon]);

  useEffect(() => {
    if (lastNewMoonDate) {
      loadIntention(lastNewMoonDate).then(setCurrentIntention);
    }
  }, [lastNewMoonDate]);

  const handleSaveProfile = useCallback(async () => {
    const month = parseInt(profileDraft.birthMonth, 10);
    const day = parseInt(profileDraft.birthDay, 10);
    if (!profileDraft.firstName.trim() || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) return;
    const p: UserProfile = { firstName: profileDraft.firstName.trim(), birthMonth: month, birthDay: day };
    await saveUserProfile(p);
    setProfile(p);
    setProfileOpen(false);
  }, [profileDraft]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todayHolidays = useMemo(() => getHolidaysForDate(today), [today]);
  const hasAnyAlert = !!(retrograde || prayerDay || festival || sabbat || namedMoon || darkMoon || eclipse || todayHolidays.length > 0);

  const weekStrip = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const dots: { color: string; key: string }[] = [];

      const nm = getNamedFullMoonForDate(d);
      const dm = getDarkMoonForDate(d);
      const ec = getEclipseForDate(d);
      const sb = getSabbatForDate(d);
      const rt = getMercuryRetrogradeInfo(d);
      const pr = isIfaPrayerDay(d);
      const fv = getIfaFestivalForDate(d);

      if (nm) dots.push({ color: EVENT_COLORS["named-moon"], key: "moon" });
      else if (dm) dots.push({ color: EVENT_COLORS["dark-moon"], key: "dark" });
      else if (m.isMajorPhase) dots.push({ color: EVENT_COLORS["full-moon"], key: "moon" });

      if (ec) dots.push({ color: EVENT_COLORS[ec.type], key: "eclipse" });
      if (sb) dots.push({ color: EVENT_COLORS.sabbat, key: "sabbat" });
      if (rt) dots.push({ color: EVENT_COLORS.retrograde, key: "retro" });
      if (pr) dots.push({ color: EVENT_COLORS["ifa-prayer"], key: "prayer" });
      if (fv) dots.push({ color: EVENT_COLORS["ifa-festival"], key: "festival" });

      // Build a short label for the most notable event
      let highlight = nm?.name ?? (dm ? `Dark Moon` : m.isMajorPhase ? m.name : null);
      if (!highlight && ec) highlight = ec.name;
      if (!highlight && sb) highlight = sb.name.split(" —")[0];

      return { date: d, dots, highlight };
    });
  }, [today]);

  const weekAheadNarrative = useMemo(() => {
    const parts: string[] = [];
    let moonMentioned = false;

    for (let i = 1; i <= 7; i++) {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const nm = getNamedFullMoonForDate(d);
      const dm = getDarkMoonForDate(d);
      const ec = getEclipseForDate(d);
      const s = getSabbatForDate(d);
      const f = getIfaFestivalForDate(d);
      const r = getMercuryRetrogradeInfo(d);
      const rPrev = getMercuryRetrogradeInfo(addDays(today, i - 1));
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "long" });

      if (!moonMentioned) {
        if (nm) {
          parts.push(
            `The ${nm.name} rises on ${dayLabel}${nm.sign ? ` in ${nm.sign}` : ""} — a sacred time for illumination, release, and gratitude.`
          );
          moonMentioned = true;
        } else if (dm) {
          parts.push(
            `The Dark Moon${dm.sign ? ` in ${dm.sign}` : ""} falls on ${dayLabel}, drawing a veil of stillness before the new cycle ignites.`
          );
          moonMentioned = true;
        } else if (m.isMajorPhase) {
          const phaseLines: Record<string, string> = {
            "new-moon": `The New Moon on ${dayLabel} opens a portal for fresh intentions — plant your seeds with clarity and conviction.`,
            "first-quarter": `The First Quarter Moon on ${dayLabel} calls for decisive action — push past resistance and tend what is growing.`,
            "last-quarter": `The Last Quarter Moon on ${dayLabel} invites release — forgive, let go, and clear space before the next cycle begins.`,
            "full-moon": `The Full Moon peaks on ${dayLabel} — illuminate what was hidden and release what no longer serves.`,
          };
          const line = phaseLines[m.eventType ?? ""];
          if (line) { parts.push(line); moonMentioned = true; }
        }
      }

      if (ec) {
        parts.push(
          `A ${ec.type === "solar-eclipse" ? "solar" : "lunar"} eclipse on ${dayLabel} accelerates transformation — what is ready to emerge cannot be held back.`
        );
      }
      if (s && parts.length < 2) {
        parts.push(`${s.name.split(" —")[0]} on ${dayLabel} marks a sacred turning of the Wheel of the Year.`);
      }
      if (r && !rPrev && parts.length < 2) {
        parts.push(`Mercury turns retrograde on ${dayLabel} — slow down, review, and speak with extra care.`);
      }
      if (f && parts.length < 2) {
        parts.push(`The ${f.name} arrives on ${dayLabel} — honor the Orisa through prayer and celebration.`);
      }
    }

    if (parts.length === 0) {
      const phase = getMoonPhaseData(today);
      const quiet: Record<string, string> = {
        "waxing-crescent": "The waxing crescent builds this week — tend your intentions and let momentum gather.",
        "waxing-gibbous": "The moon swells toward fullness this week — refine your work and prepare for completion.",
        "waning-gibbous": "The waning gibbous invites gratitude and integration — harvest the wisdom of the recent full moon.",
        "waning-crescent": "The waning crescent deepens the call to rest — surrender, reflect, and prepare for what comes next.",
      };
      return quiet[phase.eventType ?? ""] ?? "A steady week of alignment and flow. Move with the natural rhythms of the cosmos.";
    }

    return parts.slice(0, 2).join(" ");
  }, [today]);

  const dailyWisdom = useMemo(() => getDailyWisdom(today), [today]);
  const dailyProverb = useMemo(() => getDailyProverb(today), [today]);

  const upcomingDays = useMemo(() => {
    const result: { date: Date; events: { label: string; dotColor: string }[] }[] = [];
    for (let i = 1; i <= 21; i++) {
      const d = addDays(today, i);
      const m = getMoonPhaseData(d);
      const r = getMercuryRetrogradeInfo(d);
      const p = isIfaPrayerDay(d);
      const f = getIfaFestivalForDate(d);
      const s = getSabbatForDate(d);
      const nm = getNamedFullMoonForDate(d);
      const dm = getDarkMoonForDate(d);
      const ec = getEclipseForDate(d);
      const holidays = getHolidaysForDate(d);
      const events: { label: string; dotColor: string }[] = [];

      if (nm) events.push({ label: nm.name, dotColor: EVENT_COLORS["named-moon"] });
      else if (dm) {
        events.push({ label: "Dark Moon" + (dm.sign ? ` — ${dm.sign}` : ""), dotColor: EVENT_COLORS["dark-moon"] });
        if (m.isMajorPhase && m.eventType === "new-moon") events.push({ label: "New Moon", dotColor: EVENT_COLORS["new-moon"] });
      } else if (m.isMajorPhase) events.push({ label: m.name, dotColor: EVENT_COLORS["full-moon"] });

      if (ec) events.push({ label: ec.name, dotColor: EVENT_COLORS[ec.type] });
      if (s) events.push({ label: s.name.split(" —")[0], dotColor: EVENT_COLORS.sabbat });
      if (r && !getMercuryRetrogradeInfo(addDays(today, i - 1))) events.push({ label: "Mercury Retrograde begins", dotColor: EVENT_COLORS.retrograde });
      if (p) events.push({ label: "Ifa Prayer Day", dotColor: EVENT_COLORS["ifa-prayer"] });
      if (f) events.push({ label: f.name, dotColor: EVENT_COLORS["ifa-festival"] });
      for (const h of holidays) {
        events.push({ label: `${HOLIDAY_REGION_FLAG[h.region]} ${h.name}`, dotColor: HOLIDAY_REGION_COLOR[h.region] });
      }

      if (events.length > 0) result.push({ date: d, events });
    }
    return result.slice(0, 10);
  }, [today]);

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandHeader}>
        <Text style={[styles.brandTitle, { color: "#D4A843" }]}>Mystical Runnings</Text>
        <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>curated by MissKai</Text>
      </View>

      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </Text>
          {isBirthday && profile ? (
            <Text style={[styles.appName, { color: "#D4A843", fontSize: fs(22) }]}>
              🥳 Happy Birthday, {profile.firstName}!
            </Text>
          ) : (
            <Text style={[styles.appName, { color: colors.foreground, fontSize: fs(26) }]}>
              {profile ? `Welcome, ${profile.firstName}` : "Mystical Runnings"}
            </Text>
          )}
        </View>
        <View style={styles.headerBtns}>
          <Pressable
            onPress={() => handleScaleChange(-1)}
            disabled={scaleIdx === 0}
            style={[styles.scaleBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: scaleIdx === 0 ? 0.35 : 1 }]}
            hitSlop={6}
          >
            <Text style={[styles.scaleBtnText, { color: colors.mutedForeground }]}>A−</Text>
          </Pressable>
          <Pressable
            onPress={() => handleScaleChange(1)}
            disabled={scaleIdx === MAX_SCALE_INDEX}
            style={[styles.scaleBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: scaleIdx === MAX_SCALE_INDEX ? 0.35 : 1 }]}
            hitSlop={6}
          >
            <Text style={[styles.scaleBtnText, { color: colors.mutedForeground }]}>A+</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setProfileDraft({
                firstName: profile?.firstName ?? "",
                birthMonth: profile ? String(profile.birthMonth) : "",
                birthDay: profile ? String(profile.birthDay) : "",
              });
              setProfileOpen(true);
            }}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
          >
            <Feather name="user" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setNotifOpen(true); }}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: "#D4A84366" }]}
            hitSlop={8}
          >
            <Feather name="bell" size={20} color="#D4A843" />
          </Pressable>
        </View>
      </View>

      <NotificationSettingsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Today Widget — moon · ose · next event */}
      <TodayWidget today={today} />

      {/* Moon Phase Hero */}
      <View style={[styles.moonHero, { backgroundColor: colors.card, borderColor: "#A78BFA33" }]}>
        <MoonPhaseCircle moonData={moon} size={96} showLabel />
        {namedMoon && (
          <View style={[styles.namedMoonBadge, { backgroundColor: "#A78BFA22", borderColor: "#A78BFA55" }]}>
            <Text style={[styles.namedMoonText, { color: "#C4B5FD" }]}>
              {namedMoon.name} {namedMoon.sign ? `· ${namedMoon.sign}` : ""}
            </Text>
          </View>
        )}
        {darkMoon && (
          <View style={[styles.namedMoonBadge, { backgroundColor: "#4C1D9522", borderColor: "#6D28D955" }]}>
            <Text style={[styles.namedMoonText, { color: "#A78BFA" }]}>
              Dark Moon {darkMoon.sign ? `· ${darkMoon.sign}` : ""}
            </Text>
          </View>
        )}
        <LunarProgressBar moonData={moon} />

        {/* Moon Water Ritual button */}
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setMoonWaterOpen(true); }}
          style={[styles.moonWaterBtn, {
            backgroundColor: (moon.eventType === "full-moon" || moon.eventType === "named-moon") ? "#D4A84318" : "#7C3AED14",
            borderColor: (moon.eventType === "full-moon" || moon.eventType === "named-moon") ? "#D4A84355" : "#7C3AED44",
          }]}
        >
          <Text style={styles.moonWaterBtnEmoji}>💧</Text>
          <View style={styles.moonWaterBtnCenter}>
            <Text style={[styles.moonWaterBtnLabel, {
              color: (moon.eventType === "full-moon" || moon.eventType === "named-moon") ? "#D4A843" : "#A78BFA",
            }]}>MOON WATER RITUAL</Text>
            <Text style={[styles.moonWaterBtnPhase, { color: colors.foreground }]}>{moon.name}</Text>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* This Week at a Glance */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
      <View style={[styles.weekStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {weekStrip.map(({ date, dots, highlight }, i) => {
          const isToday = isSameDay(date, today);
          return (
            <View key={i} style={styles.weekDay}>
              <Text style={[styles.weekDayName, { color: isToday ? "#D4A843" : colors.mutedForeground }]}>
                {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
              </Text>
              <View style={[
                styles.weekDateCircle,
                isToday && { backgroundColor: "#D4A843" },
              ]}>
                <Text style={[
                  styles.weekDateNum,
                  { color: isToday ? "#080714" : colors.foreground },
                ]}>
                  {date.getDate()}
                </Text>
              </View>
              <View style={styles.weekDots}>
                {dots.slice(0, 3).map((dot, di) => (
                  <View
                    key={di}
                    style={[styles.weekDot, { backgroundColor: dot.color }]}
                  />
                ))}
              </View>
              {highlight && (
                <Text
                  style={[styles.weekHighlight, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {highlight}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Week Ahead */}
      <View style={[styles.weekAheadCard, { backgroundColor: colors.card, borderColor: "#7C3AED33" }]}>
        <View style={styles.weekAheadHeader}>
          <View style={[styles.weekAheadDot, { backgroundColor: "#7C3AED" }]} />
          <Text style={[styles.weekAheadLabel, { color: colors.mutedForeground }]}>WEEK AHEAD</Text>
        </View>
        <Text style={[styles.weekAheadText, { color: colors.foreground }]}>{weekAheadNarrative}</Text>
      </View>

      {/* Lunar Intention */}
      {(isNewMoonWindow || isFullMoonWindow || currentIntention) && (
        <View style={[styles.intentionCard, {
          backgroundColor: isNewMoonWindow ? "#4C1D9520" : "#A78BFA12",
          borderColor: isNewMoonWindow ? "#6D28D966" : "#A78BFA55",
        }]}>
          <View style={styles.intentionHeader}>
            <Text style={styles.intentionIcon}>
              {isNewMoonWindow ? "🌑" : isFullMoonWindow ? "🌕" : "✦"}
            </Text>
            <Text style={[styles.intentionLabel, { color: isNewMoonWindow ? "#A78BFA" : "#C4B5FD" }]}>
              {isNewMoonWindow ? "NEW MOON INTENTION" : isFullMoonWindow ? "FULL MOON REFLECTION" : "LUNAR INTENTION"}
            </Text>
          </View>

          {isNewMoonWindow && !currentIntention && (
            <>
              <Text style={[styles.intentionPrompt, { color: colors.foreground }]}>
                What do you wish to call into being this lunar cycle?
              </Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setIntentionDraft(""); setIntentionModalOpen(true); }}
                style={styles.intentionBtn}
              >
                <Text style={styles.intentionBtnText}>🌱 Plant My Intention</Text>
              </Pressable>
            </>
          )}

          {isNewMoonWindow && currentIntention && (
            <>
              <Text style={[styles.intentionText, { color: colors.foreground }]}>"{currentIntention}"</Text>
              <Pressable
                onPress={() => { Haptics.selectionAsync(); setIntentionDraft(currentIntention); setIntentionModalOpen(true); }}
                style={styles.intentionEditRow}
              >
                <Feather name="edit-2" size={11} color="#A78BFA" />
                <Text style={[styles.intentionEditText, { color: "#A78BFA" }]}>Edit intention</Text>
              </Pressable>
            </>
          )}

          {isFullMoonWindow && !isNewMoonWindow && (
            <>
              {currentIntention ? (
                <>
                  <Text style={[styles.intentionPromptSub, { color: colors.mutedForeground }]}>Your intention for this cycle:</Text>
                  <Text style={[styles.intentionText, { color: colors.foreground }]}>"{currentIntention}"</Text>
                  <Text style={[styles.intentionPrompt, { color: colors.mutedForeground, marginTop: 8 }]}>
                    The full moon illuminates what has blossomed. How has this intention unfolded?
                  </Text>
                </>
              ) : (
                <Text style={[styles.intentionPrompt, { color: colors.foreground }]}>
                  No intention was set for this cycle. The full moon still illuminates — what has emerged in you?
                </Text>
              )}
            </>
          )}

          {!isNewMoonWindow && !isFullMoonWindow && currentIntention && (
            <>
              <Text style={[styles.intentionText, { color: colors.foreground }]}>"{currentIntention}"</Text>
              <Text style={[styles.intentionPromptSub, { color: colors.mutedForeground }]}>Active intention for this lunar cycle</Text>
            </>
          )}
        </View>
      )}

      {/* This Day in Spirit */}
      <View style={[styles.wisdomCard, { backgroundColor: colors.card, borderColor: "#D4A84333" }]}>
        <View style={styles.wisdomHeader}>
          <Text style={[styles.wisdomLabel, { color: "#D4A843" }]}>✦ THIS DAY IN SPIRIT</Text>
        </View>
        <Text style={[styles.wisdomText, { color: colors.foreground }]}>"{dailyWisdom.text}"</Text>
        <Text style={[styles.wisdomSource, { color: colors.mutedForeground }]}>— {dailyWisdom.source}</Text>
      </View>

      {/* Ifa Proverb of the Day */}
      <View style={[styles.proverbCard, { backgroundColor: colors.card, borderColor: "#7C3AED44" }]}>
        <View style={styles.proverbHeader}>
          <View style={styles.proverbHeaderLeft}>
            <Text style={[styles.proverbSectionLabel, { color: "#7C3AED" }]}>IFA PROVERB OF THE DAY</Text>
            <View style={[styles.oduBadge, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED44" }]}>
              <Text style={[styles.oduBadgeText, { color: "#A78BFA" }]}>{dailyProverb.odu}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              Share.share({
                message: `"${dailyProverb.english}"\n\n— Odu ${dailyProverb.odu}\n\nMystical Runnings`,
              });
            }}
            hitSlop={10}
            style={[styles.shareBtn, { backgroundColor: "#7C3AED18", borderColor: "#7C3AED44" }]}
          >
            <Feather name="share" size={13} color="#A78BFA" />
          </Pressable>
        </View>
        <Text style={[styles.proverbYoruba, { color: "#A78BFA" }]}>{dailyProverb.yoruba}</Text>
        <Text style={[styles.proverbEnglish, { color: colors.foreground }]}>"{dailyProverb.english}"</Text>
        <View style={[styles.proverbDivider, { backgroundColor: "#7C3AED33" }]} />
        <Text style={[styles.proverbTeaching, { color: colors.mutedForeground }]}>{dailyProverb.teaching}</Text>
      </View>

      {/* Today's Energies */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Energies</Text>

      {eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: eclipse.name,
            category: eclipse.type === "solar-eclipse" ? "SOLAR ECLIPSE" : "LUNAR ECLIPSE",
            color: eclipse.type === "solar-eclipse" ? "#F59E0B" : "#EC4899",
            description: eclipse.description,
            guidance: eclipse.type === "solar-eclipse"
              ? "A powerful portal for bold new beginnings. Set intentions with full awareness — eclipses accelerate what is ready to emerge."
              : "Deep illumination and release. What the eclipse reveals cannot be unseen. Trust the profound process of transformation.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: eclipse.type === "solar-eclipse" ? "#F59E0B11" : "#EC489911",
            borderColor: eclipse.type === "solar-eclipse" ? "#F59E0B55" : "#EC489955",
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS[eclipse.type] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{eclipse.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{eclipse.description}</Text>
          </View>
        </Pressable>
      )}

      {sabbat && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: sabbat.name,
            category: "WHEEL OF THE YEAR",
            color: "#34D399",
            description: sabbat.description,
            guidance: "Honor this turning of the wheel. Light a candle, work with the land, and attune to the season's shifting energy.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#34D39911", borderColor: "#34D39944", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.sabbat }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{sabbat.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{sabbat.description}</Text>
          </View>
        </Pressable>
      )}

      {namedMoon && !eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: namedMoon.name,
            category: "FULL MOON",
            color: "#A78BFA",
            description: namedMoon.description,
            guidance: "Full moons illuminate what was hidden and call for release, gratitude, and completion. A sacred time for ritual and reflection.",
            rows: namedMoon.sign ? [{ label: "Sign", value: namedMoon.sign }] : [],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#A78BFA11", borderColor: "#A78BFA44", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["named-moon"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{namedMoon.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{namedMoon.description}</Text>
          </View>
        </Pressable>
      )}

      {darkMoon && !eclipse && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Dark Moon",
            category: "DARK MOON",
            color: "#6D28D9",
            description: darkMoon.sign
              ? `The Dark Moon rests in ${darkMoon.sign} — a liminal threshold between endings and new beginnings. The sky is void of moonlight.`
              : "A liminal threshold between endings and new beginnings. The sky is void of moonlight.",
            guidance: "Rest, retreat, and turn inward. Release what no longer serves. The next cycle begins soon — allow space for renewal.",
            rows: darkMoon.sign ? [{ label: "Sign", value: darkMoon.sign }] : [],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#4C1D9522", borderColor: "#6D28D955", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["dark-moon"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Dark Moon — {darkMoon.sign}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              Rest, release, and turn inward. The new cycle approaches.
            </Text>
          </View>
        </Pressable>
      )}

      {retrograde && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Mercury Retrograde",
            category: "PLANETARY",
            color: "#F97316",
            description: `${retrograde.label}. Mercury governs communication, technology, contracts, and travel. During retrograde, these areas can feel disrupted or delayed.`,
            guidance: "Pause major decisions and new commitments. Use this period to review, revise, and reconnect. Back up data, confirm appointments, and speak with extra care.",
            rows: [
              { label: "Active Until", value: retrograde.end.toLocaleDateString("en-US", { month: "long", day: "numeric" }) },
            ],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#F9731615", borderColor: "#F9731644", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS.retrograde }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Mercury Retrograde Active</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{retrograde.label}</Text>
          </View>
        </Pressable>
      )}

      {prayerDay && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: "Ojo Orunmila",
            category: "IFA PRAYER",
            color: "#D4A843",
            description: "A sacred prayer day honoring Orunmila (Ifa), the Orisa of wisdom, destiny, and divination. These days recur on a sacred Ifa calendar cycle.",
            guidance: "A powerful day for prayer, divination, and deep spiritual reflection. Offer gratitude to Orunmila — kola nuts, palm oil, and cool water are traditional.",
            rows: [
              { label: "Sacred to", value: "Orunmila · Ifa" },
              { label: "Offerings", value: "Kola nuts, palm oil, cool water" },
            ],
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#D4A84315", borderColor: "#D4A84344", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["ifa-prayer"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Ojo Orunmila</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>Sacred Ifa Prayer Day — offer gratitude</Text>
          </View>
        </Pressable>
      )}

      {festival && (
        <Pressable
          onPress={() => setSelectedEvent({
            title: festival.name,
            category: "IFA FESTIVAL",
            color: "#22D3EE",
            description: festival.description,
            guidance: "Participate in the energy of this festival through prayer, offerings, music, and communal celebration. Connect with the Orisa honored today.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: "#22D3EE15", borderColor: "#22D3EE44", opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: EVENT_COLORS["ifa-festival"] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{festival.name}</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>{festival.description}</Text>
          </View>
        </Pressable>
      )}

      {todayHolidays.map((h, i) => (
        <Pressable
          key={`h-${i}`}
          onPress={() => setSelectedEvent({
            title: h.name,
            category: HOLIDAY_REGION_LABEL[h.region],
            color: HOLIDAY_REGION_COLOR[h.region],
            description: h.description,
            guidance: h.region === "us"
              ? "Honor this day with awareness of community, history, and shared purpose."
              : h.region === "mexico"
              ? "Celebrate Mexico's living spiritual heritage — a sacred weaving of indigenous, Catholic, and ancestral traditions."
              : h.region === "india"
              ? "India's festivals are invitations to align with the divine — through color, fire, prayer, and community."
              : "Jewish sacred days are portals of memory, renewal, and covenant — a cycle of return and recommitment.",
          })}
          style={({ pressed }) => [styles.alertCard, {
            backgroundColor: HOLIDAY_REGION_COLOR[h.region] + "15",
            borderColor: HOLIDAY_REGION_COLOR[h.region] + "44",
            opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={[styles.alertDot, { backgroundColor: HOLIDAY_REGION_COLOR[h.region] }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>
              {HOLIDAY_REGION_FLAG[h.region]} {h.emoji} {h.name}
            </Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
              {h.description}
            </Text>
          </View>
        </Pressable>
      ))}

      {!hasAnyAlert && (
        <View style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.alertDot, { backgroundColor: colors.mutedForeground }]} />
          <View style={styles.alertText}>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>Clear Channels</Text>
            <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
              No major events today. A day of flow and alignment.
            </Text>
          </View>
        </View>
      )}

      {/* Ose Calendar — 4-group cycle strip */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Ose Calendar</Text>
      <View style={styles.oseStrip}>
        {OSE_GROUPS.map((group) => {
          const isActive = group.id === oseDay.id;
          return (
            <Pressable
              key={group.id}
              onPress={() => setOseModalGroup(group)}
              style={({ pressed }) => [
                styles.oseStripCell,
                {
                  backgroundColor: isActive ? `${group.color}1A` : `${group.color}08`,
                  borderColor: isActive ? group.color : colors.border,
                  borderWidth: isActive ? 2 : 1,
                  opacity: pressed ? 0.78 : isActive ? 1 : 0.6,
                },
              ]}
            >
              <View style={[styles.oseStripDot, { backgroundColor: group.color }]} />
              <Text
                style={[styles.oseStripName, { color: isActive ? group.color : colors.mutedForeground }]}
                numberOfLines={1}
              >
                {group.name.replace("Ose ", "")}
              </Text>
              {isActive ? (
                <View style={[styles.oseStripBadge, { backgroundColor: `${group.color}30` }]}>
                  <Text style={[styles.oseStripBadgeText, { color: group.color }]}>Today</Text>
                </View>
              ) : (
                <View style={styles.oseStripBadgePlaceholder} />
              )}
              <Text style={[styles.oseStripHint, { color: colors.mutedForeground }]}>
                {isActive ? "Details" : "Tap"}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <OseDetailModal group={oseModalGroup} onClose={() => setOseModalGroup(null)} />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <MoonWaterModal
        visible={moonWaterOpen}
        onClose={() => setMoonWaterOpen(false)}
        phase={moon.eventType}
        phaseName={moon.name}
        phaseEmoji={PHASE_EMOJI[moon.eventType] ?? "🌕"}
      />

      {/* Upcoming */}
      {upcomingDays.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Coming Up</Text>
          {upcomingDays.map(({ date, events }, i) => (
            <View key={i} style={[styles.upcomingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.upcomingDate}>
                <Text style={[styles.upcomingDay, { color: colors.mutedForeground }]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
                </Text>
                <Text style={[styles.upcomingNum, { color: colors.foreground }]}>{date.getDate()}</Text>
              </View>
              <View style={styles.upcomingEvents}>
                {events.map((e, ei) => (
                  <View key={ei} style={styles.upcomingEventRow}>
                    <View style={[styles.upcomingDot, { backgroundColor: e.dotColor }]} />
                    <Text style={[styles.upcomingEventText, { color: colors.foreground }]}>{e.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>

    {/* Lunar Intention Modal */}
    <Modal
      visible={intentionModalOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setIntentionModalOpen(false)}
    >
      <Pressable style={styles.intentionOverlay} onPress={() => setIntentionModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ width: "100%" }}
        >
          <Pressable
            style={styles.intentionModalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.intentionModalHandle} />
            <Text style={styles.intentionModalTitle}>🌑 Lunar Intention</Text>
            <Text style={styles.intentionModalSub}>
              Speak what you wish to call into being this lunar cycle.
            </Text>
            <TextInput
              style={styles.intentionInput}
              value={intentionDraft}
              onChangeText={setIntentionDraft}
              placeholder="Write your intention here..."
              placeholderTextColor="#6D6A8A"
              multiline
              autoFocus
              maxLength={300}
            />
            <Text style={styles.intentionCharCount}>{intentionDraft.length}/300</Text>
            <View style={styles.intentionModalBtns}>
              <Pressable
                style={styles.intentionModalCancel}
                onPress={() => setIntentionModalOpen(false)}
              >
                <Text style={styles.intentionModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.intentionModalSave, { opacity: intentionDraft.trim() ? 1 : 0.5 }]}
                onPress={async () => {
                  if (lastNewMoonDate && intentionDraft.trim()) {
                    await saveIntention(lastNewMoonDate, intentionDraft.trim());
                    setCurrentIntention(intentionDraft.trim());
                    setIntentionModalOpen(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                }}
              >
                <Text style={styles.intentionModalSaveText}>✦ Plant Intention</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>

    {/* Profile / Personalization Modal */}
    <Modal
      visible={profileOpen}
      transparent
      animationType="slide"
      onRequestClose={() => setProfileOpen(false)}
    >
      <Pressable style={styles.intentionOverlay} onPress={() => setProfileOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
          <Pressable style={styles.intentionModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.intentionModalHandle} />
            <Text style={[styles.intentionModalTitle, { color: colors.foreground }]}>👤 Your Profile</Text>
            <Text style={[styles.intentionModalSub, { color: colors.mutedForeground }]}>
              Personalize your experience. Enter your first name and birthday so the app can greet you on your special day.
            </Text>

            <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>First Name</Text>
            <TextInput
              style={[styles.intentionInput, { height: 44, marginBottom: 12 }]}
              value={profileDraft.firstName}
              onChangeText={(v) => setProfileDraft((d) => ({ ...d, firstName: v }))}
              placeholder="Your first name"
              placeholderTextColor="#6D6A8A"
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={40}
            />

            <View style={styles.profileBirthRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Month (1–12)</Text>
                <TextInput
                  style={[styles.intentionInput, { height: 44 }]}
                  value={profileDraft.birthMonth}
                  onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthMonth: v.replace(/[^0-9]/g, "") }))}
                  placeholder="e.g. 7"
                  placeholderTextColor="#6D6A8A"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.profileLabel, { color: colors.mutedForeground }]}>Birth Day (1–31)</Text>
                <TextInput
                  style={[styles.intentionInput, { height: 44 }]}
                  value={profileDraft.birthDay}
                  onChangeText={(v) => setProfileDraft((d) => ({ ...d, birthDay: v.replace(/[^0-9]/g, "") }))}
                  placeholder="e.g. 14"
                  placeholderTextColor="#6D6A8A"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={[styles.intentionModalBtns, { marginTop: 16 }]}>
              <Pressable style={styles.intentionModalCancel} onPress={() => setProfileOpen(false)}>
                <Text style={styles.intentionModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.intentionModalSave, { opacity: profileDraft.firstName.trim() ? 1 : 0.5 }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.intentionModalSaveText}>✦ Save Profile</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  brandHeader: {
    alignItems: "center",
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.4,
    textAlign: "center",
    fontFamily: "Beasigne",
  },
  brandSubtitle: {
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 1.2,
    textTransform: "lowercase",
    textAlign: "center",
  },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    flexShrink: 0,
  },
  scaleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
  },
  scaleBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  profileBirthRow: {
    flexDirection: "row",
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  moonHero: {
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    gap: 10,
  },
  namedMoonBadge: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
  },
  namedMoonText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  moonHeroExtra: {
    alignItems: "center",
  },
  moonHeroLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 2,
  },
  moonHeroSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  alertText: { flex: 1 },
  alertTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  upcomingDate: {
    width: 40,
    alignItems: "center",
  },
  upcomingDay: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  upcomingNum: {
    fontSize: 20,
    fontWeight: "700",
  },
  weekStrip: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    marginBottom: 24,
    gap: 2,
  },
  weekDay: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  weekDayName: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  weekDateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDateNum: {
    fontSize: 13,
    fontWeight: "700",
  },
  weekDots: {
    flexDirection: "row",
    gap: 2,
    height: 6,
    alignItems: "center",
  },
  weekDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  weekHighlight: {
    fontSize: 8,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 11,
    paddingHorizontal: 1,
  },
  upcomingEvents: { flex: 1, justifyContent: "center", gap: 4 },
  upcomingEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  upcomingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    flexShrink: 0,
  },
  oseStrip: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 24,
  },
  oseStripCell: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 5,
    minHeight: 96,
    justifyContent: "center",
  },
  oseStripDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  oseStripName: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textAlign: "center",
    textTransform: "uppercase",
  },
  oseStripBadge: {
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  oseStripBadgePlaceholder: {
    height: 16,
  },
  oseStripBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  oseStripHint: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  upcomingEventText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  weekAheadCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  wisdomCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  wisdomHeader: {
    marginBottom: 12,
  },
  wisdomLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  wisdomText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 10,
  },
  wisdomSource: {
    fontSize: 12,
    textAlign: "right",
    letterSpacing: 0.3,
  },
  proverbCard: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
  },
  proverbHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  proverbHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  proverbSectionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  oduBadge: {
    alignSelf: "flex-start",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  oduBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  shareBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  proverbYoruba: {
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  proverbEnglish: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    marginBottom: 12,
  },
  proverbDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  proverbTeaching: {
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  weekAheadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  weekAheadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekAheadLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  weekAheadText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  intentionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  intentionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  intentionIcon: {
    fontSize: 18,
  },
  intentionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  intentionPrompt: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
    marginBottom: 12,
  },
  intentionPromptSub: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  intentionText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
    fontWeight: "500",
    marginBottom: 10,
  },
  intentionBtn: {
    backgroundColor: "#6D28D9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  intentionBtnText: {
    color: "#E9D5FF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  intentionEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  intentionEditText: {
    fontSize: 12,
    fontWeight: "600",
  },
  intentionOverlay: {
    flex: 1,
    backgroundColor: "#00000088",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  intentionModalSheet: {
    backgroundColor: "#0F0C24",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#6D28D966",
    width: "100%",
  },
  intentionModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3D3A5A",
    alignSelf: "center",
    marginBottom: 20,
  },
  intentionModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E9D5FF",
    marginBottom: 6,
  },
  intentionModalSub: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: "italic",
  },
  intentionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: "#6D28D911",
    borderColor: "#6D28D955",
    color: "#E9D5FF",
  },
  intentionCharCount: {
    fontSize: 11,
    color: "#6D6A8A",
    textAlign: "right",
    marginTop: 6,
    marginBottom: 16,
  },
  intentionModalBtns: {
    flexDirection: "row",
    gap: 12,
  },
  intentionModalCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#3D3A5A",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  intentionModalCancelText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  intentionModalSave: {
    flex: 2,
    backgroundColor: "#6D28D9",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  intentionModalSaveText: {
    color: "#E9D5FF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  moonWaterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  moonWaterBtnEmoji: { fontSize: 22 },
  moonWaterBtnCenter: { flex: 1, gap: 2 },
  moonWaterBtnLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  moonWaterBtnPhase: { fontSize: 15, fontWeight: "700" },
});
