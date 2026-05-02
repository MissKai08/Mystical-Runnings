import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
} from "react-native";
import { SearchBar } from "@/components/SearchBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

type Tab = "guide" | "prayers";

interface IbaItem {
  word: string;
  meaning: string;
}

const IBA_LIST: IbaItem[] = [
  { word: "Iba Olodumare", meaning: "Supreme Being — Source of all creation" },
  { word: "Iba Ori", meaning: "Your Head / Inner Spirit — your divine self" },
  { word: "Iba Iya", meaning: "Mother — honor to your mother" },
  { word: "Iba Baba", meaning: "Father — honor to your father" },
  { word: "Iba Irunmole", meaning: "Primordial Beings — the divine forces" },
  { word: "Iba Orisa", meaning: "Deified ancestors and aspects of nature" },
  { word: "Iba Egungun", meaning: "Your personal ancestors" },
  { word: "Iba [Name]", meaning: "A benevolent elder or ancestor of your choosing" },
];

const ORI_PRAYER_LINES = [
  "Ori guide me",
  "Ori guide me",
  "Ori support me",
  "Ori support me",
  "Ori support my abundance",
  "Ori support my future children",
  "Ori support my relationship",
  "Ori protect my house",
  "Ori guide me",
  "Ori guide me",
  "Ori guide me",
  "Protector of children, my inner character is thankful.",
  "Ase.",
];

interface Prayer {
  id: string;
  title: string;
  orisha: string;
  yoruba?: string;
  english: string;
  purpose: string;
  category: "daily" | "cleansing" | "guidance" | "gratitude" | "protection";
}

const PRAYERS: Prayer[] = [
  {
    id: "1",
    title: "Morning Invocation to Orunmila",
    orisha: "Orunmila",
    purpose: "Begin each day with wisdom and clarity",
    category: "daily",
    yoruba: "Ẹ jẹ ká juba Ọrúnmìlà\nỌkàn mi, Ọpẹlẹ mi\nJọ gbọ ìpè mi loni",
    english:
      "Let us pay homage to Orunmila\nMy heart, my divination chain\nPlease hear my call today\n\nI rise with the blessing of Ifa\nGuide my words, my steps, my choices\nThat I may walk in alignment with my destiny.",
  },
  {
    id: "2",
    title: "Prayer to Osun for Love & Flow",
    orisha: "Osun",
    purpose: "Invoke sweetness, fertility, and emotional abundance",
    category: "daily",
    yoruba: "Àṣà! Àṣà! Yeye Osun\nỌwọ́ mi gé, Ẹlẹ́gbẹ mi",
    english:
      "Àṣà! Àṣà! Mother Osun\nSweet water flows through me\nBless me with love, abundance, and grace\n\nLet your golden light illuminate my path\nYeye, Mother of Sweet Waters, I honor you.",
  },
  {
    id: "3",
    title: "Prayer to Ogun for Strength & Clarity",
    orisha: "Ogun",
    purpose: "Clear obstacles and invoke iron will",
    category: "cleansing",
    yoruba: "Ogun onire, Ogun alada meji\nỌba ní pa ẹni tó sọ pé Ogun kò gbọdọ̀ jẹun",
    english:
      "Ogun, Lord of Iron and Labor\nClear my path with your machete\nRemove all obstacles blocking my way\n\nGive me the strength to build and create\nBless my hands, my tools, my purpose.",
  },
  {
    id: "4",
    title: "Prayer to Oshosi for Justice",
    orisha: "Oshosi",
    purpose: "Seek justice, truth, and righteous outcomes",
    category: "guidance",
    yoruba: "Oshosi asho awo\nOde mata meji",
    english:
      "Oshosi, Divine Hunter of Truth\nYour arrow flies straight and true\nGuide my aim toward justice and clarity\n\nHelp me see what is hidden\nBring light to dark places\nThat right may prevail.",
  },
  {
    id: "5",
    title: "Gratitude Prayer — Ese Ifa",
    orisha: "Ifa / Orunmila",
    purpose: "Give thanks for blessings received",
    category: "gratitude",
    yoruba: "E se, E se, E se oooo\nIfa asegun ota\nMo dupe lowo Orunmila",
    english:
      "Thank you, Thank you, Thank you\nIfa who overcomes all enemies\nI give thanks to Orunmila\n\nFor the breath in my body\nFor the wisdom in my path\nFor the ancestors who walk beside me\nAse.",
  },
  {
    id: "6",
    title: "Protection Prayer",
    orisha: "Elegba & Ogun",
    purpose: "Spiritual protection for self, home, and family",
    category: "protection",
    yoruba: "Baba Elegba, ẹnu ọ̀nà\nMó wà níbẹ̀ kí o ṣí ona fún mi",
    english:
      "Elegba, guardian of all crossroads\nOpen the way before me\nOgun, shield of iron and fire\nProtect all who dwell under this roof\n\nLet no harm, no evil, no darkness enter\nSurround us with your divine armor.\nAse.",
  },
  {
    id: "7",
    title: "New Moon Intention Prayer",
    orisha: "Obatala",
    purpose: "Set intentions at the new moon",
    category: "daily",
    yoruba: "Obatala, orisa of white cloth\nPure as chalk, white as clouds",
    english:
      "Obatala, Father of Pure Cloth\nAs the moon enters darkness to be born anew\nSo do I release what no longer serves\n\nI plant my intentions in the fertile dark\nThat they may grow toward light\nWith clarity, with purpose, with peace.\nAse.",
  },
  {
    id: "8",
    title: "Full Moon Release Prayer",
    orisha: "Yemoja",
    purpose: "Release and let go at the full moon",
    category: "cleansing",
    yoruba: "Yemoja, Iya mi oloromi\nMother of all waters",
    english:
      "Yemoja, Great Mother of Waters\nAs the moon shines full and bright\nLet your tides carry away\nAll that I release with intention\n\nWash me clean, restore me whole\nI am renewed in your sacred waves.\nAse.",
  },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "gratitude", label: "Gratitude" },
  { key: "guidance", label: "Guidance" },
  { key: "cleansing", label: "Cleansing" },
  { key: "protection", label: "Protection" },
] as const;

type FilterKey = "all" | Prayer["category"];

export default function PrayerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("guide");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [ibaExpanded, setIbaExpanded] = useState(false);
  const [oriExpanded, setOriExpanded] = useState(false);
  const [guardianExpanded, setGuardianExpanded] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = PRAYERS.filter((p) => {
    const matchesCategory = activeFilter === "all" || p.category === activeFilter;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.orisha.toLowerCase().includes(q) ||
      p.purpose.toLowerCase().includes(q) ||
      p.english.toLowerCase().includes(q) ||
      (p.yoruba ?? "").toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openGuideLink = () => {
    Linking.openURL("https://www.daydreamalston.com/prayer-guide");
  };

  const openVideoLink = () => {
    Linking.openURL("https://youtu.be/MWQCb42xKUw");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Ifa Prayer</Text>
        <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Pressable
            style={[styles.tabBtn, activeTab === "guide" && { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab("guide"); }}
          >
            <Text style={[styles.tabLabel, { color: activeTab === "guide" ? colors.primaryForeground : colors.mutedForeground }]}>
              Morning Guide
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === "prayers" && { backgroundColor: colors.primary }]}
            onPress={() => { Haptics.selectionAsync(); setActiveTab("prayers"); }}
          >
            <Text style={[styles.tabLabel, { color: activeTab === "prayers" ? colors.primaryForeground : colors.mutedForeground }]}>
              Prayers
            </Text>
          </Pressable>
        </View>
      </View>

      {activeTab === "guide" ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Source credit */}
          <Pressable
            style={[styles.sourceCard, { backgroundColor: "#D4A84312", borderColor: "#D4A84344" }]}
            onPress={openGuideLink}
          >
            <View style={styles.sourceCardLeft}>
              <Text style={[styles.sourceCardLabel, { color: colors.mutedForeground }]}>SOURCE GUIDE</Text>
              <Text style={[styles.sourceCardTitle, { color: "#D4A843" }]}>
                Ifa Orisa Beginner's Prayer Guide
              </Text>
              <Text style={[styles.sourceCardBy, { color: colors.mutedForeground }]}>
                by Daydream Alston — tap to read full guide
              </Text>
            </View>
            <Feather name="external-link" size={16} color="#D4A843" />
          </Pressable>

          {/* Wake up instruction */}
          <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stepBadge}>
              <Text style={[styles.stepNumber, { color: colors.primaryForeground }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Upon Waking</Text>
              <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                Say aloud immediately when you wake:
              </Text>
              <View style={[styles.quoteBox, { backgroundColor: "#D4A84315", borderColor: "#D4A84355" }]}>
                <Text style={[styles.quoteText, { color: "#D4A843" }]}>
                  "Thank You Olodumare,{"\n"}Thank You Ori for allowing me to see this day."
                </Text>
              </View>
              <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                Then go to your shrine if you have one, or find a quiet, intentional space.
              </Text>
            </View>
          </View>

          {/* Iba Homage */}
          <Pressable
            style={[styles.stepCard, { backgroundColor: colors.card, borderColor: ibaExpanded ? "#D4A84366" : colors.border }]}
            onPress={() => { Haptics.selectionAsync(); setIbaExpanded(!ibaExpanded); }}
          >
            <View style={styles.stepBadge}>
              <Text style={[styles.stepNumber, { color: colors.primaryForeground }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>Pay Homage (Iba)</Text>
                  <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                    Recite each Iba aloud. "Iba" is pronounced <Text style={{ color: "#D4A843" }}>E-ba</Text>.
                  </Text>
                </View>
                <Feather
                  name={ibaExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              {ibaExpanded && (
                <View style={styles.ibaList}>
                  {IBA_LIST.map((item, i) => (
                    <View key={i} style={[styles.ibaRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.ibaWord, { color: "#D4A843" }]}>{item.word}</Text>
                      <Text style={[styles.ibaMeaning, { color: colors.mutedForeground }]}>{item.meaning}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Pressable>

          {/* Ori Prayer */}
          <Pressable
            style={[styles.stepCard, { backgroundColor: colors.card, borderColor: oriExpanded ? "#A78BFA66" : colors.border }]}
            onPress={() => { Haptics.selectionAsync(); setOriExpanded(!oriExpanded); }}
          >
            <View style={[styles.stepBadge, { backgroundColor: "#7C3AED" }]}>
              <Text style={[styles.stepNumber, { color: "#fff" }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>Ori Prayer</Text>
                  <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                    Hold your head with both hands. Cool water may be applied as an offering.
                  </Text>
                </View>
                <Feather
                  name={oriExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              {oriExpanded && (
                <View style={[styles.oriBox, { backgroundColor: "#A78BFA12", borderColor: "#A78BFA33" }]}>
                  {ORI_PRAYER_LINES.map((line, i) => {
                    const isAse = line === "Ase.";
                    const isRepeat = i > 0 && ORI_PRAYER_LINES[i - 1] === line;
                    return (
                      <Text
                        key={i}
                        style={[
                          styles.oriLine,
                          { color: isAse ? "#D4A843" : colors.foreground },
                          isAse && styles.oriFinal,
                          isRepeat && { color: colors.mutedForeground },
                        ]}
                      >
                        {line}
                        {isRepeat ? <Text style={{ color: "#A78BFA" }}> (2x)</Text> : null}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          </Pressable>

          {/* Guardian Orisa */}
          <Pressable
            style={[styles.stepCard, { backgroundColor: colors.card, borderColor: guardianExpanded ? "#22D3EE44" : colors.border }]}
            onPress={() => { Haptics.selectionAsync(); setGuardianExpanded(!guardianExpanded); }}
          >
            <View style={[styles.stepBadge, { backgroundColor: "#0E7490" }]}>
              <Text style={[styles.stepNumber, { color: "#fff" }]}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>Guardian Orisa</Text>
                  <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                    If you know your Head/Guardian Orisa, call upon them now.
                  </Text>
                </View>
                <Feather
                  name={guardianExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              {guardianExpanded && (
                <View style={[styles.quoteBox, { backgroundColor: "#22D3EE11", borderColor: "#22D3EE33" }]}>
                  <Text style={[styles.quoteText, { color: colors.foreground }]}>
                    Speak from the heart. There is no single formula — call your Orisa by name, state your gratitude, your needs, and your intentions for the day.{"\n\n"}
                    <Text style={{ color: "#22D3EE" }}>
                      Not sure who your Guardian Orisa is? Ifa divination with a Babalawo or Iyanifa can reveal this.
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </Pressable>

          {/* Daily Conduct */}
          <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.stepBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.stepNumber, { color: colors.mutedForeground }]}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Daily Conduct</Text>
              <Text style={[styles.stepNote, { color: colors.mutedForeground }]}>
                Commit to following your initiation taboos and walking with{" "}
                <Text style={{ color: "#D4A843", fontStyle: "italic" }}>iwa rere</Text> — good character.
              </Text>
              <Text style={[styles.stepNote, { color: colors.mutedForeground, marginTop: 6 }]}>
                Good character is the foundation of all Ifa practice. No prayer is complete without right action.
              </Text>
            </View>
          </View>

          {/* Video link */}
          <Pressable
            style={[styles.videoCard, { backgroundColor: "#7C3AED22", borderColor: "#7C3AED55" }]}
            onPress={openVideoLink}
          >
            <Feather name="play-circle" size={28} color="#A78BFA" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.videoTitle, { color: colors.foreground }]}>Watch the Step-by-Step Video</Text>
              <Text style={[styles.videoSub, { color: colors.mutedForeground }]}>
                Full explanation by Daydream Alston — YouTube
              </Text>
            </View>
            <Feather name="external-link" size={16} color="#A78BFA" />
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Search */}
          <View style={styles.prayerSearchWrap}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by orisha, title, or keywords…"
            />
            {searchQuery.length > 0 && (
              <Text style={[styles.prayerSearchCount, { color: "#A78BFA" }]}>
                {filtered.length} prayer{filtered.length === 1 ? "" : "s"} found
              </Text>
            )}
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeFilter === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => { Haptics.selectionAsync(); setActiveFilter(cat.key as FilterKey); }}
                  style={[
                    styles.filterChip,
                    { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.filterText, { color: isActive ? colors.primaryForeground : colors.mutedForeground }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {filtered.length === 0 && searchQuery.length > 0 && (
            <View style={styles.prayerNoResults}>
              <Feather name="search" size={28} color="#A78BFA66" />
              <Text style={[styles.prayerNoResultsText, { color: "#A78BFA99" }]}>
                No prayers match "{searchQuery}"
              </Text>
            </View>
          )}

          {filtered.map((prayer) => {
            const isExpanded = expandedId === prayer.id;
            return (
              <Pressable
                key={prayer.id}
                onPress={() => toggleExpand(prayer.id)}
                style={[
                  styles.prayerCard,
                  { backgroundColor: colors.card, borderColor: isExpanded ? "#D4A84366" : colors.border },
                ]}
              >
                <View style={styles.prayerHeader}>
                  <View style={styles.prayerMeta}>
                    <View style={[styles.orishaChip, { backgroundColor: "#D4A84322" }]}>
                      <Text style={[styles.orishaText, { color: "#D4A843" }]}>{prayer.orisha}</Text>
                    </View>
                    <Text style={[styles.prayerTitle, { color: colors.foreground }]}>{prayer.title}</Text>
                    <Text style={[styles.prayerPurpose, { color: colors.mutedForeground }]}>{prayer.purpose}</Text>
                  </View>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </View>
                {isExpanded && (
                  <View style={styles.prayerBody}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {prayer.yoruba && (
                      <>
                        <Text style={[styles.langLabel, { color: colors.mutedForeground }]}>YORUBA</Text>
                        <Text style={[styles.prayerText, styles.yorubaText, { color: "#D4A843" }]}>{prayer.yoruba}</Text>
                      </>
                    )}
                    <Text style={[styles.langLabel, { color: colors.mutedForeground }]}>ENGLISH</Text>
                    <Text style={[styles.prayerText, { color: colors.foreground }]}>{prayer.english}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  prayerSearchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 4,
  },
  prayerSearchCount: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    paddingLeft: 4,
    paddingBottom: 4,
  },
  prayerNoResults: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  prayerNoResultsText: {
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sourceCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sourceCardLeft: { flex: 1 },
  sourceCardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 3,
  },
  sourceCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  sourceCardBy: {
    fontSize: 12,
  },
  stepCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4A843",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: "800",
  },
  stepContent: { flex: 1 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  stepNote: {
    fontSize: 13,
    lineHeight: 19,
  },
  quoteBox: {
    borderRadius: 10,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  ibaList: {
    marginTop: 12,
    gap: 0,
  },
  ibaRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  ibaWord: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  ibaMeaning: {
    fontSize: 13,
    lineHeight: 18,
  },
  oriBox: {
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    gap: 4,
  },
  oriLine: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: "italic",
  },
  oriFinal: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
    fontStyle: "normal",
  },
  videoCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  videoSub: {
    fontSize: 12,
  },
  filterScroll: { marginBottom: 12 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
  },
  prayerCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
  },
  prayerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  prayerMeta: { flex: 1 },
  orishaChip: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  orishaText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  prayerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
    lineHeight: 20,
  },
  prayerPurpose: {
    fontSize: 13,
    lineHeight: 17,
  },
  prayerBody: { marginTop: 12 },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  langLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 2,
  },
  prayerText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  yorubaText: {
    fontStyle: "italic",
  },
});
