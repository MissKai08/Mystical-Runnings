import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import * as Haptics from "expo-haptics";
import { useFontScale } from "@/contexts/FontScaleContext";

interface Resource {
  title: string;
  source: string;
  category: string;
  url: string;
  emoji: string;
  color: string;
}

const RESOURCES: Resource[] = [
  {
    title: "Mystic Mamma",
    source: "mysticmamma.com",
    category: "Spiritual",
    url: "https://mysticmamma.com/",
    emoji: "🌟",
    color: "#A78BFA",
  },
  {
    title: "Yoruba Culture",
    source: "256 Healing Arts",
    category: "Education",
    url: "https://www.256healingarts.com/yoruba-culture",
    emoji: "📚",
    color: "#D4A843",
  },
  {
    title: "Open Educational Resources for Ifa",
    source: "ATLA LibGuides",
    category: "Academic",
    url: "https://atla.libguides.com/OER_Ifa",
    emoji: "🎓",
    color: "#7C3AED",
  },
  {
    title: "Orisha Journey",
    source: "Daydream Alston",
    category: "Community",
    url: "https://www.daydreamalston.com/orisha-journey",
    emoji: "✨",
    color: "#22D3EE",
  },
  {
    title: "Got2B Oshun",
    source: "got2boshun.org",
    category: "Organization",
    url: "https://www.got2boshun.org/",
    emoji: "🌊",
    color: "#F59E0B",
  },
  {
    title: "Got2B Oshun — Tools & Supplies",
    source: "Amazon Shop",
    category: "Shop",
    url: "https://www.amazon.com/shop/got2boshun/list/P4NS1RBG4TH6?ref_=cm_sw_r_apann_aipsflist_aipsfgot2boshun_K507X0QXMZWQ33BBQ998",
    emoji: "🛒",
    color: "#F59E0B",
  },
  {
    title: "Creating an Orisha Altar",
    source: "Original Botanica",
    category: "Guide",
    url: "https://originalbotanica.com/blog/creating-an-orisha-altar-",
    emoji: "🕯️",
    color: "#34D399",
  },
  {
    title: "2026 Wheel of the Year Calendar",
    source: "Witch on Fire · Patheos",
    category: "Paganism",
    url: "https://www.patheos.com/blogs/witchonfire/2025/08/2026-wheel-of-the-year-astrological-calendar-for-witches/",
    emoji: "🌿",
    color: "#34D399",
  },
  {
    title: "Moon Phases 2026 — Lunar Calendar",
    source: "Google Calendar",
    category: "Moon",
    url: "https://share.google/m8xoPWktS3Tdrzmnz",
    emoji: "🌕",
    color: "#A78BFA",
  },
  {
    title: "Ifá — A Universal Concept of All Life",
    source: "True Ifá · Amazon",
    category: "Book",
    url: "https://a.co/d/02MUDmOk",
    emoji: "📖",
    color: "#D4A843",
  },
  {
    title: "True Ifa Community",
    source: "Facebook Group",
    category: "Community",
    url: "https://www.facebook.com/share/1FfjvAHELn/",
    emoji: "🌟",
    color: "#22D3EE",
  },
  {
    title: "Ose Calendar — Sacred Ifa Days",
    source: "Ashe Soul",
    category: "Calendar",
    url: "https://www.ashesoul.com/osecalendar",
    emoji: "📅",
    color: "#F59E0B",
  },
  {
    title: "The Old Farmer's Almanac",
    source: "Gardening · Weather · Moon · Calendar",
    category: "Calendar",
    url: "https://share.google/vXQaMUABYeyaFhQVQ",
    emoji: "🌾",
    color: "#22C55E",
  },
  {
    title: "The Witches' Almanac",
    source: "Witches' Almanac Ltd.",
    category: "Reference",
    url: "https://share.google/1Fz3hZ0zBkQJiacxy",
    emoji: "🧙",
    color: "#7C3AED",
  },
  {
    title: "The Quantum Field - Manifestation Meditation",
    source: "Matt Cooke",
    category: "Meditation",
    url: "https://share.google/UNjuWC1JNGpy0ZUod",
    emoji: "🪐",
    color: "#A78BFA",
  },
  {
    title: "Chani Nicholas",
    source: "Astrology · Linktree",
    category: "Astrology",
    url: "https://linktr.ee/chaninicholas",
    emoji: "⭐",
    color: "#A78BFA",
  },
];

const CATEGORIES = Array.from(new Set(RESOURCES.map((r) => r.category)));

export default function ResourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fs } = useFontScale();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.foreground }]}>Resources</Text>
      <Text style={[styles.screenSub, { color: colors.mutedForeground }]}>
        Sacred guides, communities & tools
      </Text>

      {CATEGORIES.map((cat) => {
        const items = RESOURCES.filter((r) => r.category === cat);
        return (
          <View key={cat} style={styles.categorySection}>
            <Text style={[styles.categoryLabel, { color: colors.mutedForeground }]}>{cat.toUpperCase()}</Text>
            {items.map((r, i) => (
              <Pressable
                key={i}
                onPress={() => { Haptics.selectionAsync(); Linking.openURL(r.url); }}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <View style={[styles.emojiBadge, { backgroundColor: r.color + "1A" }]}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                </View>
                <View style={styles.textBlock}>
                  <Text style={[styles.title, { color: colors.foreground, fontSize: fs(14) }]} numberOfLines={2}>{r.title}</Text>
                  <Text style={[styles.source, { color: colors.mutedForeground, fontSize: fs(12) }]}>{r.source}</Text>
                </View>
                <Feather name="external-link" size={14} color={colors.mutedForeground} style={{ alignSelf: "center" }} />
              </Pressable>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  screenSub: {
    fontSize: 13,
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  emojiBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emoji: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  source: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
