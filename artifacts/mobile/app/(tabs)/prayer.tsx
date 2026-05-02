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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";

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
    title: "Protection Prayer to Ogun & Elegba",
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = PRAYERS.filter(
    (p) => activeFilter === "all" || p.category === activeFilter
  );

  const toggleExpand = (id: string) => {
    Haptics.selectionAsync();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openIfaLink = () => {
    Linking.openURL("https://en.wikipedia.org/wiki/If%C3%A1");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 8, paddingBottom: bottomPad + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Ifa Prayer</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          Sacred Orisa prayers and invocations
        </Text>

        {/* Info card */}
        <Pressable
          style={[styles.infoCard, { backgroundColor: "#D4A84312", borderColor: "#D4A84344" }]}
          onPress={openIfaLink}
        >
          <View style={styles.infoCardLeft}>
            <Text style={[styles.infoCardTitle, { color: "#D4A843" }]}>About Ifa</Text>
            <Text style={[styles.infoCardText, { color: colors.mutedForeground }]}>
              Ifa is a system of divination and religious texts originating from the Yoruba people of West Africa. Tap to learn more.
            </Text>
          </View>
          <Feather name="external-link" size={16} color="#D4A843" />
        </Pressable>

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
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(cat.key as FilterKey);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Prayer Cards */}
        {filtered.map((prayer) => {
          const isExpanded = expandedId === prayer.id;
          return (
            <Pressable
              key={prayer.id}
              onPress={() => toggleExpand(prayer.id)}
              style={[
                styles.prayerCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isExpanded ? "#D4A84366" : colors.border,
                },
              ]}
            >
              <View style={styles.prayerHeader}>
                <View style={styles.prayerMeta}>
                  <View style={[styles.orishaChip, { backgroundColor: "#D4A84322" }]}>
                    <Text style={[styles.orishaText, { color: "#D4A843" }]}>{prayer.orisha}</Text>
                  </View>
                  <Text style={[styles.prayerTitle, { color: colors.foreground }]}>{prayer.title}</Text>
                  <Text style={[styles.prayerPurpose, { color: colors.mutedForeground }]}>
                    {prayer.purpose}
                  </Text>
                </View>
                <Feather
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>

              {isExpanded && (
                <View style={styles.prayerBody}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  {prayer.yoruba && (
                    <>
                      <Text style={[styles.langLabel, { color: colors.mutedForeground }]}>YORUBA</Text>
                      <Text style={[styles.prayerText, styles.yorubaText, { color: "#D4A843" }]}>
                        {prayer.yoruba}
                      </Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  screenSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoCardLeft: { flex: 1 },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoCardText: {
    fontSize: 13,
    lineHeight: 18,
  },
  filterScroll: { marginBottom: 16 },
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
