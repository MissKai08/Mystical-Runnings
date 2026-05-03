import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getMoonPhaseData } from "@/constants/spiritualData";

// ─── Phase → Frequency + metadata ────────────────────────────────────────────

interface PhaseSound {
  freq: number;
  name: string;
  hz: string;
  meaning: string;
  color: string;
  emoji: string;
}

const PHASE_SOUNDS: Record<string, PhaseSound> = {
  "dark-moon":       { freq: 174, name: "Dark Moon",        hz: "174 Hz", meaning: "Foundation · Grounding · Safety",          color: "#4C1D95", emoji: "🌑" },
  "new-moon":        { freq: 396, name: "New Moon",         hz: "396 Hz", meaning: "Liberation · New Beginnings · Release Fear", color: "#6D28D9", emoji: "🌑" },
  "waxing-crescent": { freq: 417, name: "Waxing Crescent",  hz: "417 Hz", meaning: "Facilitating Change · Clearing",             color: "#7C3AED", emoji: "🌒" },
  "first-quarter":   { freq: 528, name: "First Quarter",    hz: "528 Hz", meaning: "Transformation · Heart · DNA Repair",        color: "#8B5CF6", emoji: "🌓" },
  "waxing-gibbous":  { freq: 639, name: "Waxing Gibbous",   hz: "639 Hz", meaning: "Connecting · Relationships · Growth",        color: "#A78BFA", emoji: "🌔" },
  "full-moon":       { freq: 432, name: "Full Moon",        hz: "432 Hz", meaning: "Universal Harmony · Illumination",           color: "#D4A843", emoji: "🌕" },
  "named-moon":      { freq: 432, name: "Sacred Full Moon", hz: "432 Hz", meaning: "Universal Harmony · Ancestral Connection",   color: "#D4A843", emoji: "🌕" },
  "waning-gibbous":  { freq: 528, name: "Waning Gibbous",   hz: "528 Hz", meaning: "Gratitude · Sharing · Healing",              color: "#A78BFA", emoji: "🌖" },
  "last-quarter":    { freq: 852, name: "Last Quarter",     hz: "852 Hz", meaning: "Awakening Intuition · Returning to Spirit",  color: "#8B5CF6", emoji: "🌗" },
  "waning-crescent": { freq: 963, name: "Waning Crescent",  hz: "963 Hz", meaning: "Return to Oneness · Divine Consciousness",  color: "#6D28D9", emoji: "🌘" },
};

function getPhaseSound(eventType: string): PhaseSound {
  return PHASE_SOUNDS[eventType] ?? PHASE_SOUNDS["full-moon"];
}

// ─── Web Audio Engine (runs in hidden WebView) ────────────────────────────────

const AUDIO_HTML = `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:transparent;}</style></head>
<body>
<script>
var audioCtx=null,masterGain=null,oscillators=[],lfo=null,lfoGain=null,isPlaying=false;

function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  masterGain=audioCtx.createGain();
  masterGain.gain.setValueAtTime(0,audioCtx.currentTime);
  masterGain.connect(audioCtx.destination);
}

function stopOscillators(){
  oscillators.forEach(function(o){try{o.stop();}catch(e){}});
  oscillators=[];
  if(lfo){try{lfo.stop();}catch(e){}lfo=null;}
  if(lfoGain){lfoGain=null;}
}

function startSound(freq,vol){
  initAudio();
  if(audioCtx.state==='suspended')audioCtx.resume();
  stopOscillators();
  isPlaying=true;
  var now=audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(0,now);
  masterGain.gain.linearRampToValueAtTime(vol*0.65,now+2.5);

  function makeOsc(f,type,gainVal){
    var o=audioCtx.createOscillator();
    var g=audioCtx.createGain();
    o.type=type;
    o.frequency.setValueAtTime(f,now);
    g.gain.setValueAtTime(gainVal,now);
    o.connect(g);g.connect(masterGain);o.start();
    oscillators.push(o);
  }

  makeOsc(freq,'sine',1.0);
  makeOsc(freq*1.5,'sine',0.25);
  if(freq>250)makeOsc(freq*0.5,'sine',0.15);
  makeOsc(freq+7,'sine',0.08);

  lfo=audioCtx.createOscillator();
  lfoGain=audioCtx.createGain();
  lfo.type='sine';
  lfo.frequency.setValueAtTime(0.083,now);
  lfoGain.gain.setValueAtTime(vol*0.12,now);
  lfo.connect(lfoGain);
  lfoGain.connect(masterGain.gain);
  lfo.start();
}

function stopSound(){
  if(!masterGain||!isPlaying)return;
  isPlaying=false;
  var now=audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value,now);
  masterGain.gain.linearRampToValueAtTime(0,now+1.8);
  setTimeout(stopOscillators,2200);
}

function setVolume(v){
  if(!masterGain||!isPlaying)return;
  var now=audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value,now);
  masterGain.gain.linearRampToValueAtTime(v*0.65,now+0.4);
  if(lfoGain)lfoGain.gain.setValueAtTime(v*0.12,now+0.4);
}

function handleMsg(data){
  try{
    var msg=JSON.parse(data);
    if(msg.type==='play')startSound(msg.freq,msg.volume||0.7);
    else if(msg.type==='stop')stopSound();
    else if(msg.type==='volume')setVolume(msg.volume);
  }catch(e){}
}

document.addEventListener('message',function(e){handleMsg(e.data);});
window.addEventListener('message',function(e){handleMsg(e.data);});
</script>
</body>
</html>`;

// ─── Breathing Circle ─────────────────────────────────────────────────────────

function BreathingCircle({ playing, color }: { playing: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (anim.current) { anim.current.stop(); anim.current = null; }
    if (playing) {
      anim.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.18, duration: 6000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.85, duration: 6000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 6000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.4, duration: 6000, useNativeDriver: true }),
          ]),
        ])
      );
      anim.current.start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]).start();
    }
    return () => { anim.current?.stop(); };
  }, [playing, color]);

  return (
    <View style={bc.container}>
      <Animated.View style={[bc.outerRing, { borderColor: color, transform: [{ scale }], opacity }]} />
      <Animated.View style={[bc.middleRing, { borderColor: color, transform: [{ scale }], opacity }]} />
      <View style={[bc.innerCircle, { backgroundColor: color + "33", borderColor: color + "88" }]} />
    </View>
  );
}

const bc = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", width: 200, height: 200 },
  outerRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
  },
  middleRing: {
    position: "absolute",
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 1,
  },
  innerCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 40 },
});

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) { setSeconds(0); return; }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ─── Volume bar ───────────────────────────────────────────────────────────────

const VOLUME_STEPS = [0.2, 0.4, 0.6, 0.8, 1.0];

function VolumeBar({
  volume,
  onChange,
  color,
}: {
  volume: number;
  onChange: (v: number) => void;
  color: string;
}) {
  return (
    <View style={vb.row}>
      <Feather name="volume" size={14} color={color + "88"} />
      {VOLUME_STEPS.map((v) => (
        <Pressable
          key={v}
          onPress={() => { Haptics.selectionAsync(); onChange(v); }}
          style={[vb.step, { backgroundColor: volume >= v ? color : color + "33" }]}
        />
      ))}
      <Feather name="volume-2" size={14} color={color + "88"} />
    </View>
  );
}

const vb = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  step: {
    width: 28,
    height: 6,
    borderRadius: 3,
  },
});

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MoonSoundBath({ visible, onClose }: Props) {
  const colors = useColors();
  const webviewRef = useRef<WebView>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const timer = useTimer(playing);

  const now = new Date();
  const moonData = getMoonPhaseData(now);
  const sound = getPhaseSound(moonData.eventType);

  // Sync volume changes to WebView
  const sendMessage = useCallback((msg: object) => {
    const js = `handleMsg(${JSON.stringify(JSON.stringify(msg))});true;`;
    webviewRef.current?.injectJavaScript(js);
  }, []);

  const handlePlay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (playing) {
      sendMessage({ type: "stop" });
      setPlaying(false);
    } else {
      sendMessage({ type: "play", freq: sound.freq, volume });
      setPlaying(true);
    }
  }, [playing, sound.freq, volume, sendMessage]);

  const handleVolume = useCallback((v: number) => {
    setVolume(v);
    if (playing) sendMessage({ type: "volume", volume: v });
  }, [playing, sendMessage]);

  const handleClose = useCallback(() => {
    if (playing) {
      sendMessage({ type: "stop" });
      setPlaying(false);
    }
    onClose();
  }, [playing, sendMessage, onClose]);

  // Stop when modal closes
  useEffect(() => {
    if (!visible && playing) {
      sendMessage({ type: "stop" });
      setPlaying(false);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[s.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.foreground }]}>Moon Sound Bath</Text>
            <Text style={[s.headerSub, { color: sound.color }]}>{sound.hz}</Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* Main content */}
        <View style={s.body}>
          {/* Phase name */}
          <Text style={[s.phaseName, { color: sound.color }]}>
            {sound.emoji}  {sound.name}
          </Text>
          <Text style={[s.phaseMeaning, { color: colors.mutedForeground }]}>
            {sound.meaning}
          </Text>

          {/* Breathing circle */}
          <View style={s.circleWrap}>
            <BreathingCircle playing={playing} color={sound.color} />
            <View style={s.circleOverlay}>
              <Text style={[s.freqBig, { color: sound.color }]}>{sound.freq}</Text>
              <Text style={[s.freqUnit, { color: sound.color + "AA" }]}>Hz</Text>
            </View>
          </View>

          {/* Timer */}
          <Text style={[s.timer, { color: playing ? sound.color : colors.mutedForeground }]}>
            {playing ? timer : "──:──"}
          </Text>

          {/* Play / Pause */}
          <Pressable
            onPress={handlePlay}
            style={[s.playBtn, { backgroundColor: playing ? sound.color + "22" : sound.color, borderColor: sound.color }]}
          >
            <Feather
              name={playing ? "pause" : "play"}
              size={28}
              color={playing ? sound.color : "#080714"}
            />
          </Pressable>

          {/* Breathing guide label */}
          {playing && (
            <Text style={[s.breathLabel, { color: colors.mutedForeground }]}>
              Follow the circle · breathe with the pulse
            </Text>
          )}

          {/* Volume */}
          <View style={s.volumeWrap}>
            <VolumeBar volume={volume} onChange={handleVolume} color={sound.color} />
          </View>

          {/* Frequency info */}
          <View style={[s.infoCard, { backgroundColor: sound.color + "0F", borderColor: sound.color + "33" }]}>
            <Text style={[s.infoTitle, { color: sound.color }]}>
              Solfeggio Frequency · {sound.hz}
            </Text>
            <Text style={[s.infoBody, { color: colors.mutedForeground }]}>
              {getFrequencyInfo(sound.freq)}
            </Text>
          </View>
        </View>

        {/* Hidden WebView audio engine */}
        <View style={{ height: 1, overflow: "hidden" }}>
          <WebView
            ref={webviewRef}
            source={{ html: AUDIO_HTML }}
            style={{ width: 1, height: 1 }}
            javaScriptEnabled
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback
            originWhitelist={["*"]}
            onError={() => {}}
          />
        </View>
      </View>
    </Modal>
  );
}

function getFrequencyInfo(freq: number): string {
  const map: Record<number, string> = {
    174: "The lowest Solfeggio frequency. Associated with pain relief, security, and a deep sense of grounded safety. Use it to anchor yourself to the present moment.",
    396: "Liberates you from fear and guilt. Helps transform grief into joy and security, clearing the root chakra and opening space for new beginnings.",
    417: "Breaks down crystallized emotional patterns, facilitating change and clearing the residue of past experiences. An undoing frequency.",
    528: "Known as the 'love frequency' or 'miracle tone.' Associated with DNA repair, transformation, and the opening of the heart. The frequency of creation.",
    639: "The heart chakra frequency of connection, love, and harmonious relationships. Use for healing interpersonal conflict and deepening empathy.",
    432: "Mathematically consistent with the patterns of the universe. Said to vibrate in sympathy with the Golden Ratio, producing calm, clarity, and harmonic resonance.",
    741: "Awakens intuition and cleans the cells from electromagnetic toxins. Opens the pineal gland. A frequency of awakening and problem-solving.",
    852: "Brings you back to your spiritual order, awakening inner strength and intuition. Use for returning to truth and reconnecting with higher self.",
    963: "The frequency of the crown chakra. Associated with enlightenment, the return to Oneness, and direct connection with divine consciousness.",
  };
  return map[freq] ?? "A sacred tone tuned to the current lunar cycle, supporting your spiritual practice.";
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 36 },
  closeTxt: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, fontWeight: "700", marginTop: 1, letterSpacing: 0.5 },
  headerRight: { width: 36 },
  body: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
  },
  phaseName: { fontSize: 20, fontWeight: "800", letterSpacing: 0.3, textAlign: "center" },
  phaseMeaning: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  circleWrap: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
  },
  circleOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  freqBig: { fontSize: 32, fontWeight: "800", letterSpacing: -1 },
  freqUnit: { fontSize: 13, fontWeight: "600", marginTop: -4 },
  timer: { fontSize: 22, fontWeight: "300", letterSpacing: 3, marginTop: -4 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  breathLabel: { fontSize: 12, letterSpacing: 0.3, textAlign: "center" },
  volumeWrap: { marginTop: 4 },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginTop: 4,
    width: "100%",
  },
  infoTitle: { fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  infoBody: { fontSize: 13, lineHeight: 21 },
});
