import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

const STORAGE_KEY = "@mystical_altar_v1";

export interface AltarSymbol {
  emoji: string;
  label: string;
  color: string;
}

export const ALTAR_SYMBOLS: AltarSymbol[] = [
  { emoji: "💀", label: "Ancestors", color: "#E2E8F0" },
  { emoji: "⭐", label: "Ase", color: "#D4A843" },
  { emoji: "🕯️", label: "Candle", color: "#D4A843" },
  { emoji: "🪵", label: "Cinnamon", color: "#D97706" },
  { emoji: "🥥", label: "Coconut", color: "#F5F5DC" },
  { emoji: "🧴", label: "Coconut Oil", color: "#F5F5DC" },
  { emoji: "🧊", label: "Cool Water", color: "#38BDF8" },
  { emoji: "🌽", label: "Cornmeal", color: "#FBBF24" },
  { emoji: "🐚", label: "Cowrie", color: "#D4A843" },
  { emoji: "🌙", label: "Crescent", color: "#C4B5FD" },
  { emoji: "💎", label: "Crystal", color: "#67E8F9" },
  { emoji: "🌑", label: "Dark Moon", color: "#7C3AED" },
  { emoji: "🔮", label: "Divination", color: "#A78BFA" },
  { emoji: "🔑", label: "Elegba", color: "#FB923C" },
  { emoji: "🧿", label: "Eshu", color: "#FB923C" },
  { emoji: "🌸", label: "Flowers", color: "#F9A8D4" },
  { emoji: "🌕", label: "Full Moon", color: "#A78BFA" },
  { emoji: "🍸", label: "Gin", color: "#94A3B8" },
  { emoji: "🌿", label: "Herbs", color: "#34D399" },
  { emoji: "🍯", label: "Honey", color: "#D4A843" },
  { emoji: "🪔", label: "Incense", color: "#F59E0B" },
  { emoji: "🍃", label: "Leaf", color: "#4ADE80" },
  { emoji: "🪄", label: "Obatala", color: "#E0F2FE" },
  { emoji: "🗡️", label: "Ogun", color: "#92400E" },
  { emoji: "🌺", label: "Offering", color: "#F472B6" },
  { emoji: "⭕", label: "Olodumare", color: "#FDE047" },
  { emoji: "🔆", label: "Ori", color: "#F59E0B" },
  { emoji: "💛", label: "Oshun", color: "#FCD34D" },
  { emoji: "🌬️", label: "Oya", color: "#8B5CF6" },
  { emoji: "🫒", label: "Palm Oil", color: "#D97706" },
  { emoji: "🌶️", label: "Peppercorn", color: "#EF4444" },
  { emoji: "🪬", label: "Protection", color: "#60A5FA" },
  { emoji: "🔥", label: "Sacred Fire", color: "#FB923C" },
  { emoji: "🧂", label: "Salt", color: "#CBD5E1" },
  { emoji: "⚡", label: "Sango", color: "#FCD34D" },
  { emoji: "🌰", label: "Shea Butter", color: "#FDE047" },
  { emoji: "🫧", label: "Spirit", color: "#BAE6FD" },
  { emoji: "🌟", label: "Star", color: "#FDE68A" },
  { emoji: "🍓", label: "Sweet Fruit", color: "#FB7185" },
  { emoji: "🍶", label: "Sweet Liquor", color: "#D4A843" },
  { emoji: "🍂", label: "Tobacco", color: "#92400E" },
  { emoji: "🏺", label: "Vessel", color: "#F59E0B" },
  { emoji: "🌊", label: "Yemoja", color: "#38BDF8" },
];

export type AltarSlot = AltarSymbol | null;

const EMPTY_ALTAR: AltarSlot[] = Array(9).fill(null);

const SLOT_LABELS = [
  "NW", "N", "NE",
  "W",  "✦", "E",
  "SW", "S", "SE",
];

const CENTER_IDX = 4;

interface SacredAltarProps {
  collapsed?: boolean;
}

export default function SacredAltar({ collapsed = false }: SacredAltarProps) {
  const colors = useColors();
  const [slots, setSlots] = useState<AltarSlot[]>(EMPTY_ALTAR);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [open, setOpen] = useState(!collapsed);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length === 9) setSlots(parsed);
        } catch {}
      }
    });
  }, []);

  const persist = useCallback((next: AltarSlot[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const handleSlotPress = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (slots[idx]) {
      Alert.alert(
        slots[idx]!.emoji + " " + slots[idx]!.label,
        "What would you like to do with this offering?",
        [
          { text: "Change", onPress: () => { setActiveSlot(idx); setPickerOpen(true); } },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const next = [...slots];
              next[idx] = null;
              setSlots(next);
              persist(next);
            },
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      setActiveSlot(idx);
      setPickerOpen(true);
    }
  };

  const handlePick = (sym: AltarSymbol) => {
    if (activeSlot === null) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next = [...slots];
    next[activeSlot] = sym;
    setSlots(next);
    persist(next);
    setPickerOpen(false);
    setActiveSlot(null);
  };

  const filledCount = slots.filter(Boolean).length;

  return (
    <View style={[s.wrapper, { borderColor: "#D4A84333", backgroundColor: colors.card }]}>
      {/* Header */}
      <Pressable
        style={s.header}
        onPress={() => { Haptics.selectionAsync(); setOpen((v) => !v); }}
      >
        <View style={s.headerLeft}>
          <Text style={s.headerEmoji}>🏛️</Text>
          <View>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Sacred Altar</Text>
            <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
              {filledCount === 0
                ? "Place your offerings"
                : `${filledCount} of 9 offerings placed`}
            </Text>
          </View>
        </View>
        <Text style={[s.chevron, { color: colors.mutedForeground }]}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {open && (
        <>
          {/* Altar grid: 3×3 */}
          <View style={s.grid}>
            {slots.map((slot, idx) => {
              const isCenter = idx === CENTER_IDX;
              const label = SLOT_LABELS[idx];
              return (
                <Pressable
                  key={idx}
                  onPress={() => handleSlotPress(idx)}
                  style={({ pressed }) => [
                    s.cell,
                    isCenter && s.centerCell,
                    slot
                      ? { borderColor: slot.color + "88", backgroundColor: slot.color + "18" }
                      : { borderColor: colors.border, backgroundColor: "transparent" },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  {slot ? (
                    <>
                      <Text style={[s.cellEmoji, isCenter && s.centerEmoji]}>{slot.emoji}</Text>
                      <Text style={[s.cellLabel, { color: slot.color }]}>{slot.label}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[s.emptyPlus, { color: colors.border }]}>+</Text>
                      <Text style={[s.emptyLabel, { color: colors.border }]}>{label}</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.hint, { color: colors.mutedForeground }]}>
            Tap a spot to place an offering · Hold a placed symbol to remove
          </Text>
        </>
      )}

      {/* Symbol Picker Modal */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setPickerOpen(false); setActiveSlot(null); }}
      >
        <View style={[s.pickerModal, { backgroundColor: colors.background }]}>
          <View style={[s.pickerHeader, { borderBottomColor: colors.border }]}>
            <Text style={[s.pickerTitle, { color: colors.foreground }]}>Choose an Offering</Text>
            <Pressable
              onPress={() => { setPickerOpen(false); setActiveSlot(null); }}
              style={s.pickerClose}
              hitSlop={10}
            >
              <Text style={[s.pickerCloseText, { color: colors.mutedForeground }]}>✕</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.pickerGrid}>
            {ALTAR_SYMBOLS.map((sym) => (
              <Pressable
                key={sym.emoji + sym.label}
                onPress={() => handlePick(sym)}
                style={({ pressed }) => [
                  s.pickerCell,
                  { borderColor: sym.color + "55", backgroundColor: sym.color + "11" },
                  pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
                ]}
              >
                <Text style={s.pickerEmoji}>{sym.emoji}</Text>
                <Text style={[s.pickerLabel, { color: sym.color }]}>{sym.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  chevron: {
    fontSize: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 8,
  },
  cell: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  centerCell: {
    borderStyle: "solid",
    borderWidth: 1.5,
  },
  cellEmoji: {
    fontSize: 26,
  },
  centerEmoji: {
    fontSize: 32,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  emptyPlus: {
    fontSize: 20,
    fontWeight: "300",
  },
  emptyLabel: {
    fontSize: 8,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  hint: {
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 2,
    letterSpacing: 0.2,
  },
  pickerModal: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  pickerClose: {
    padding: 4,
  },
  pickerCloseText: {
    fontSize: 18,
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 10,
  },
  pickerCell: {
    width: "21%",
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: 6,
  },
  pickerEmoji: {
    fontSize: 30,
  },
  pickerLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
