import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { getVoicePreference, setVoicePreference, clearVoicePreference } from "@/utils/voicePreference";

const PREVIEW_TEXT = "Sacred words carry the weight of intention. May your prayers be heard.";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function VoicePickerModal({ visible, onClose }: Props) {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, saved] = await Promise.all([
        Speech.getAvailableVoicesAsync(),
        getVoicePreference(),
      ]);
      // Filter to English voices only; fall back to all if none found
      const english = all.filter(
        (v) => v.language?.toLowerCase().startsWith("en") ?? false
      );
      setVoices(english.length > 0 ? english : all);
      setSelectedId(saved);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) load();
    else {
      Speech.stop();
      setPreviewingId(null);
    }
  }, [visible, load]);

  async function handleSelect(voice: Speech.Voice) {
    Haptics.selectionAsync();
    setSelectedId(voice.identifier);
    await setVoicePreference(voice.identifier);
    // Preview the selected voice
    setPreviewingId(voice.identifier);
    Speech.stop();
    Speech.speak(PREVIEW_TEXT, {
      voice: voice.identifier,
      pitch: 0.85,
      rate: 0.65,
      onDone: () => setPreviewingId(null),
      onError: () => setPreviewingId(null),
    });
  }

  async function handleClear() {
    Haptics.selectionAsync();
    Speech.stop();
    setSelectedId(null);
    setPreviewingId(null);
    await clearVoicePreference();
  }

  function voiceLabel(voice: Speech.Voice): string {
    // Produce a readable name: prefer voice.name, fall back to identifier
    return voice.name ?? voice.identifier;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>Prayer Voice</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Tap a voice to preview and select it. Your choice is saved automatically.
        </Text>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={colors.mutedForeground} />
          </View>
        ) : voices.length === 0 ? (
          <View style={styles.centerWrap}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No voices available on this device.{"\n"}The default system voice will be used.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          >
            {/* Default option */}
            <Pressable
              style={[
                styles.row,
                {
                  backgroundColor: colors.card,
                  borderColor: selectedId === null ? "#D4A84366" : colors.border,
                },
              ]}
              onPress={handleClear}
            >
              <View style={styles.rowLeft}>
                <Feather
                  name="volume-2"
                  size={16}
                  color={selectedId === null ? "#D4A843" : colors.mutedForeground}
                />
                <View>
                  <Text
                    style={[
                      styles.rowName,
                      { color: selectedId === null ? colors.foreground : colors.mutedForeground },
                    ]}
                  >
                    System Default (en-NG)
                  </Text>
                  <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                    Original prayer voice
                  </Text>
                </View>
              </View>
              {selectedId === null && (
                <Feather name="check" size={16} color="#D4A843" />
              )}
            </Pressable>

            {voices.map((voice) => {
              const isSelected = selectedId === voice.identifier;
              const isPreviewing = previewingId === voice.identifier;
              return (
                <Pressable
                  key={voice.identifier}
                  style={[
                    styles.row,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSelected ? "#D4A84366" : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(voice)}
                >
                  <View style={styles.rowLeft}>
                    <Feather
                      name={isPreviewing ? "volume-2" : "volume-1"}
                      size={16}
                      color={isSelected ? "#D4A843" : colors.mutedForeground}
                    />
                    <View>
                      <Text
                        style={[
                          styles.rowName,
                          { color: isSelected ? colors.foreground : colors.mutedForeground },
                        ]}
                      >
                        {voiceLabel(voice)}
                      </Text>
                      {voice.language ? (
                        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                          {voice.language}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {isSelected && !isPreviewing && (
                    <Feather name="check" size={16} color="#D4A843" />
                  )}
                  {isPreviewing && (
                    <ActivityIndicator size="small" color="#D4A843" />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
