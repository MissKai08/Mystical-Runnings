import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Platform,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getMoonPhaseData } from "@/constants/spiritualData";

// ─── Phase → Frequency metadata ──────────────────────────────────────────────

interface PhaseSound {
  freq: number;
  name: string;
  hz: string;
  meaning: string;
  color: string;
  emoji: string;
  info: string;
}

const PHASE_SOUNDS: Record<string, PhaseSound> = {
  "dark-moon":       { freq: 174, name: "Dark Moon",        hz: "174 Hz", meaning: "Foundation · Grounding · Safety",           color: "#7C3AED", emoji: "🌑", info: "The lowest Solfeggio frequency. Associated with pain relief, security, and a deep sense of grounded safety. Use it to anchor yourself to the present moment." },
  "new-moon":        { freq: 396, name: "New Moon",         hz: "396 Hz", meaning: "Liberation · New Beginnings · Release Fear", color: "#7C3AED", emoji: "🌑", info: "Liberates you from fear and guilt. Helps transform grief into joy and security, clearing the root chakra and opening space for new beginnings." },
  "waxing-crescent": { freq: 417, name: "Waxing Crescent",  hz: "417 Hz", meaning: "Facilitating Change · Clearing",            color: "#8B5CF6", emoji: "🌒", info: "Breaks down crystallized emotional patterns, facilitating change and clearing the residue of past experiences. An undoing frequency." },
  "first-quarter":   { freq: 528, name: "First Quarter",    hz: "528 Hz", meaning: "Transformation · Heart · DNA Repair",        color: "#A78BFA", emoji: "🌓", info: "Known as the love frequency or miracle tone. Associated with DNA repair, transformation, and the opening of the heart. The frequency of creation." },
  "waxing-gibbous":  { freq: 639, name: "Waxing Gibbous",   hz: "639 Hz", meaning: "Connecting · Relationships · Growth",        color: "#C4B5FD", emoji: "🌔", info: "The heart chakra frequency of connection, love, and harmonious relationships. Use for healing interpersonal conflict and deepening empathy." },
  "full-moon":       { freq: 432, name: "Full Moon",        hz: "432 Hz", meaning: "Universal Harmony · Illumination",           color: "#D4A843", emoji: "🌕", info: "Mathematically consistent with the patterns of the universe. Said to vibrate in sympathy with the Golden Ratio, producing calm, clarity, and harmonic resonance." },
  "named-moon":      { freq: 432, name: "Sacred Full Moon", hz: "432 Hz", meaning: "Universal Harmony · Ancestral Connection",   color: "#D4A843", emoji: "🌕", info: "Mathematically consistent with the patterns of the universe. Said to vibrate in sympathy with the Golden Ratio, producing calm, clarity, and harmonic resonance." },
  "waning-gibbous":  { freq: 528, name: "Waning Gibbous",   hz: "528 Hz", meaning: "Gratitude · Sharing · Healing",              color: "#A78BFA", emoji: "🌖", info: "Known as the love frequency. In the waning cycle it supports gratitude, healing of past wounds, and generous sharing of what you have cultivated." },
  "last-quarter":    { freq: 852, name: "Last Quarter",     hz: "852 Hz", meaning: "Awakening Intuition · Returning to Spirit",  color: "#8B5CF6", emoji: "🌗", info: "Brings you back to your spiritual order, awakening inner strength and intuition. Use for returning to truth and reconnecting with higher self." },
  "waning-crescent": { freq: 963, name: "Waning Crescent",  hz: "963 Hz", meaning: "Return to Oneness · Divine Consciousness",  color: "#7C3AED", emoji: "🌘", info: "The frequency of the crown chakra. Associated with enlightenment, the return to Oneness, and direct connection with divine consciousness." },
};

function getPhaseSound(eventType: string): PhaseSound {
  return PHASE_SOUNDS[eventType] ?? PHASE_SOUNDS["full-moon"];
}

// ─── Web Audio Engine hook (browser / web platform) ──────────────────────────

function useWebAudioEngine() {
  const ctxRef = useRef<any>(null);
  const masterRef = useRef<any>(null);
  const oscsRef = useRef<any[]>([]);
  const lfoRef = useRef<any>(null);
  const lfoGRef = useRef<any>(null);

  const stopOscs = useCallback(() => {
    oscsRef.current.forEach((o) => { try { o.stop(); } catch (_) {} });
    oscsRef.current = [];
    if (lfoRef.current) { try { lfoRef.current.stop(); } catch (_) {} lfoRef.current = null; }
    lfoGRef.current = null;
  }, []);

  const start = useCallback((freq: number, vol: number) => {
    const AudioCtx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!ctxRef.current) ctxRef.current = new AudioCtx();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!masterRef.current) {
      masterRef.current = ctx.createGain();
      masterRef.current.gain.setValueAtTime(0, ctx.currentTime);
      masterRef.current.connect(ctx.destination);
    }

    stopOscs();
    const now = ctx.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(0, now);
    masterRef.current.gain.linearRampToValueAtTime(vol * 0.6, now + 2.5);

    const makeOsc = (f: number, type: string, g: number) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, now);
      gn.gain.setValueAtTime(g, now);
      o.connect(gn);
      gn.connect(masterRef.current);
      o.start();
      oscsRef.current.push(o);
    };

    makeOsc(freq, "sine", 1.0);
    makeOsc(freq * 1.5, "sine", 0.22);
    if (freq > 250) makeOsc(freq * 0.5, "sine", 0.14);
    makeOsc(freq + 7, "sine", 0.07);

    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.083, now);
    lfoG.gain.setValueAtTime(vol * 0.1, now);
    lfo.connect(lfoG);
    lfoG.connect(masterRef.current.gain);
    lfo.start();
    lfoRef.current = lfo;
    lfoGRef.current = lfoG;
  }, [stopOscs]);

  const stop = useCallback(() => {
    if (!masterRef.current || !ctxRef.current) return;
    const now = ctxRef.current.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(0, now + 1.8);
    setTimeout(stopOscs, 2200);
  }, [stopOscs]);

  const setVolume = useCallback((vol: number) => {
    if (!masterRef.current || !ctxRef.current) return;
    const now = ctxRef.current.currentTime;
    masterRef.current.gain.cancelScheduledValues(now);
    masterRef.current.gain.setValueAtTime(masterRef.current.gain.value, now);
    masterRef.current.gain.linearRampToValueAtTime(vol * 0.6, now + 0.3);
    if (lfoGRef.current) lfoGRef.current.gain.setValueAtTime(vol * 0.1, now + 0.3);
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  return { start, stop, setVolume };
}

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
}

// ─── Breathing Circle ─────────────────────────────────────────────────────────

function BreathingCircle({ playing, color }: { playing: boolean; color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;
  const loop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    loop.current?.stop();
    if (playing) {
      loop.current = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.18, duration: 6000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.8, duration: 6000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 6000, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.3, duration: 6000, useNativeDriver: true }),
          ]),
        ])
      );
      loop.current.start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ]).start();
    }
    return () => loop.current?.stop();
  }, [playing]);

  return (
    <View style={bc.wrap}>
      <Animated.View style={[bc.outer, { borderColor: color, transform: [{ scale }], opacity }]} />
      <Animated.View style={[bc.mid,   { borderColor: color, transform: [{ scale }], opacity }]} />
      <View style={[bc.inner, { backgroundColor: color + "26", borderColor: color + "80" }]} />
      <View style={bc.label}>
        <Text style={[bc.freqBig, { color }]}>{}</Text>
      </View>
    </View>
  );
}

const bc = StyleSheet.create({
  wrap: { width: 190, height: 190, alignItems: "center", justifyContent: "center" },
  outer: { position: "absolute", width: 190, height: 190, borderRadius: 95, borderWidth: 1 },
  mid:   { position: "absolute", width: 142, height: 142, borderRadius: 71, borderWidth: 1 },
  inner: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 1 },
  label: { position: "absolute", alignItems: "center" },
  freqBig: { fontSize: 30, fontWeight: "800" },
});

// ─── Volume Bar ───────────────────────────────────────────────────────────────

const VOL_STEPS = [0.2, 0.4, 0.6, 0.8, 1.0];

function VolumeBar({ volume, onChange, color }: { volume: number; onChange: (v: number) => void; color: string }) {
  return (
    <View style={vb.row}>
      <Feather name="volume" size={14} color={color + "88"} />
      {VOL_STEPS.map((v) => (
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
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  step: { width: 28, height: 6, borderRadius: 3 },
});

// ─── Web Platform UI (direct Web Audio API) ───────────────────────────────────

function WebSoundBath({ sound, onClose }: { sound: PhaseSound; onClose: () => void }) {
  const colors = useColors();
  const audio = useWebAudioEngine();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const timer = useTimer(playing);

  const handlePlay = () => {
    if (playing) {
      audio.stop();
      setPlaying(false);
    } else {
      audio.start(sound.freq, volume);
      setPlaying(true);
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    if (playing) audio.setVolume(v);
  };

  const handleClose = () => {
    if (playing) { audio.stop(); setPlaying(false); }
    onClose();
  };

  return (
    <View style={[ms.container, { backgroundColor: "#080714" }]}>
      <View style={[ms.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleClose} hitSlop={12} style={ms.closeBtn}>
          <Text style={[ms.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
        </Pressable>
        <View style={ms.headerCenter}>
          <Text style={ms.headerTitle}>Moon Sound Bath</Text>
          <Text style={[ms.headerSub, { color: sound.color }]}>{sound.hz}</Text>
        </View>
        <View style={ms.headerRight} />
      </View>

      <ScrollView contentContainerStyle={ms.body} showsVerticalScrollIndicator={false}>
        <Text style={[ms.emoji]}>{sound.emoji}</Text>
        <Text style={[ms.phaseName, { color: sound.color }]}>{sound.name}</Text>
        <Text style={[ms.phaseMeaning, { color: colors.mutedForeground }]}>{sound.meaning}</Text>

        <View style={ms.circleWrap}>
          <BreathingCircle playing={playing} color={sound.color} />
          <View style={ms.circleOverlay}>
            <Text style={[ms.freqBig, { color: sound.color }]}>{sound.freq}</Text>
            <Text style={[ms.freqUnit, { color: sound.color + "AA" }]}>Hz</Text>
          </View>
        </View>

        <Text style={[ms.timer, { color: playing ? sound.color : "#4B5563" }]}>
          {playing ? timer : "──:──"}
        </Text>

        <Pressable
          onPress={handlePlay}
          style={[
            ms.playBtn,
            { borderColor: sound.color },
            playing ? { backgroundColor: "transparent" } : { backgroundColor: sound.color },
          ]}
        >
          <Feather name={playing ? "pause" : "play"} size={28} color={playing ? sound.color : "#080714"} />
        </Pressable>

        {playing && (
          <Text style={[ms.breathLabel, { color: "#6B7280" }]}>
            Follow the circle · breathe with the pulse
          </Text>
        )}

        <VolumeBar volume={volume} onChange={handleVolume} color={sound.color} />

        <View style={[ms.infoCard, { backgroundColor: sound.color + "15", borderColor: sound.color + "40" }]}>
          <Text style={[ms.infoTitle, { color: sound.color }]}>SOLFEGGIO FREQUENCY · {sound.hz}</Text>
          <Text style={[ms.infoBody, { color: colors.mutedForeground }]}>{sound.info}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Native Platform UI (WebView with embedded HTML) ─────────────────────────

function NativeSoundBath({ sound, onClose }: { sound: PhaseSound; onClose: () => void }) {
  const colors = useColors();
  // Lazy import WebView only on native to avoid web bundle errors
  const [WebViewComponent, setWebViewComponent] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    import("react-native-webview").then((m) => {
      if (!cancelled) setWebViewComponent(() => m.WebView);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const col = sound.color;
  const html = buildNativeHtml(sound);

  return (
    <View style={[ms.container, { backgroundColor: "#080714" }]}>
      <View style={[ms.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} hitSlop={12} style={ms.closeBtn}>
          <Text style={[ms.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
        </Pressable>
        <View style={ms.headerCenter}>
          <Text style={ms.headerTitle}>Moon Sound Bath</Text>
          <Text style={[ms.headerSub, { color: col }]}>{sound.hz}</Text>
        </View>
        <View style={ms.headerRight} />
      </View>

      {WebViewComponent ? (
        <WebViewComponent
          source={{ html }}
          style={{ flex: 1, backgroundColor: "#080714" }}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          originWhitelist={["*"]}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          backgroundColor="#080714"
          onError={() => {}}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#6B7280" }}>Loading…</Text>
        </View>
      )}
    </View>
  );
}

// ─── Native HTML template ─────────────────────────────────────────────────────

function buildNativeHtml(s: PhaseSound): string {
  const col = s.color;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{width:100%;min-height:100%;background:#080714;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#fff;overscroll-behavior:none;}
body{display:flex;flex-direction:column;align-items:center;padding:20px 24px 32px;gap:14px;}
.emoji{font-size:34px;line-height:1.1;}
.phase-name{font-size:21px;font-weight:800;color:${col};text-align:center;}
.phase-meaning{font-size:13px;color:#9CA3AF;text-align:center;line-height:1.55;}
.circle-wrap{position:relative;width:190px;height:190px;display:flex;align-items:center;justify-content:center;margin:4px 0;}
.ring{position:absolute;border-radius:50%;border:1px solid ${col};left:50%;top:50%;transform:translate(-50%,-50%);}
.r1{width:190px;height:190px;opacity:0.25;}.r2{width:142px;height:142px;opacity:0.4;}.r3{width:100px;height:100px;background:${col}26;border-color:${col}80;}
@keyframes breathe{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.25;}50%{transform:translate(-50%,-50%) scale(1.18);opacity:0.75;}}
@keyframes breatheMid{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.4;}50%{transform:translate(-50%,-50%) scale(1.15);opacity:0.8;}}
@keyframes breatheInner{0%,100%{transform:translate(-50%,-50%) scale(1);}50%{transform:translate(-50%,-50%) scale(1.12);}}
.playing .r1{animation:breathe 12s ease-in-out infinite;}.playing .r2{animation:breatheMid 12s ease-in-out infinite 0.5s;}.playing .r3{animation:breatheInner 12s ease-in-out infinite 1s;}
.freq-label{position:absolute;display:flex;flex-direction:column;align-items:center;}
.freq-big{font-size:30px;font-weight:800;color:${col};letter-spacing:-1px;line-height:1.1;}.freq-unit{font-size:12px;font-weight:600;color:${col}B3;}
.timer{font-size:21px;font-weight:300;letter-spacing:3px;color:#4B5563;transition:color 0.6s;}.timer.on{color:${col};}
.play-btn{width:72px;height:72px;border-radius:50%;border:2px solid ${col};background:${col};color:#080714;font-size:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background 0.3s,color 0.3s;outline:none;}
.play-btn.on{background:transparent;color:${col};}
.breath-guide{font-size:12px;color:#6B7280;text-align:center;min-height:16px;}
.vol-row{display:flex;align-items:center;gap:7px;}.vol-icon{font-size:14px;color:#4B5563;}.vol-step{width:28px;height:6px;border-radius:3px;cursor:pointer;transition:background 0.2s;}
.info-card{border-radius:14px;border:1px solid ${col}40;background:${col}15;padding:16px;width:100%;display:flex;flex-direction:column;gap:8px;margin-top:4px;}
.info-title{font-size:10px;font-weight:800;letter-spacing:1px;color:${col};}.info-body{font-size:13px;line-height:1.65;color:#9CA3AF;}
</style></head><body>
<div class="emoji">${s.emoji}</div>
<div class="phase-name">${s.name}</div>
<div class="phase-meaning">${s.meaning}</div>
<div class="circle-wrap" id="cw"><div class="ring r1"></div><div class="ring r2"></div><div class="ring r3"></div><div class="freq-label"><span class="freq-big">${s.freq}</span><span class="freq-unit">Hz</span></div></div>
<div class="timer" id="tmr">──:──</div>
<button class="play-btn" id="pb" onclick="toggle()">▶</button>
<div class="breath-guide" id="bg"></div>
<div class="vol-row"><span class="vol-icon">🔈</span><div class="vol-step" id="v0" onclick="setVol(0.2)"></div><div class="vol-step" id="v1" onclick="setVol(0.4)"></div><div class="vol-step" id="v2" onclick="setVol(0.6)"></div><div class="vol-step" id="v3" onclick="setVol(0.8)"></div><div class="vol-step" id="v4" onclick="setVol(1.0)"></div><span class="vol-icon">🔊</span></div>
<div class="info-card"><div class="info-title">SOLFEGGIO FREQUENCY · ${s.hz}</div><div class="info-body">${s.info}</div></div>
<script>
var F=${s.freq},C='${col}',CD='${col}4D',playing=false,vol=0.7,secs=0,tid=null;
var ctx=null,mg=null,oscs=[],lfo=null,lfog=null;
var cw=document.getElementById('cw'),pb=document.getElementById('pb'),tmr=document.getElementById('tmr'),bg=document.getElementById('bg');
var vs=[0,1,2,3,4].map(function(i){return document.getElementById('v'+i);});
var vv=[0.2,0.4,0.6,0.8,1.0];
function rv(){vs.forEach(function(s,i){s.style.background=vv[i]<=vol?C:CD;});}rv();
function setVol(v){vol=v;rv();if(mg&&playing){var n=ctx.currentTime;mg.gain.cancelScheduledValues(n);mg.gain.setValueAtTime(mg.gain.value,n);mg.gain.linearRampToValueAtTime(v*0.6,n+0.3);if(lfog)lfog.gain.setValueAtTime(v*0.1,n+0.3);}}
function stopO(){oscs.forEach(function(o){try{o.stop();}catch(e){}});oscs=[];if(lfo){try{lfo.stop();}catch(e){}lfo=null;}lfog=null;}
function startA(){
  if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();}
  if(ctx.state==='suspended')ctx.resume();
  if(!mg){mg=ctx.createGain();mg.gain.setValueAtTime(0,ctx.currentTime);mg.connect(ctx.destination);}
  stopO();var n=ctx.currentTime;mg.gain.cancelScheduledValues(n);mg.gain.setValueAtTime(0,n);mg.gain.linearRampToValueAtTime(vol*0.6,n+2.5);
  function o(f,t,g){var os=ctx.createOscillator(),gn=ctx.createGain();os.type=t;os.frequency.setValueAtTime(f,n);gn.gain.setValueAtTime(g,n);os.connect(gn);gn.connect(mg);os.start();oscs.push(os);}
  o(F,'sine',1.0);o(F*1.5,'sine',0.22);if(F>250)o(F*0.5,'sine',0.14);o(F+7,'sine',0.07);
  lfo=ctx.createOscillator();lfog=ctx.createGain();lfo.type='sine';lfo.frequency.setValueAtTime(0.083,n);lfog.gain.setValueAtTime(vol*0.1,n);lfo.connect(lfog);lfog.connect(mg.gain);lfo.start();
}
function stopA(){if(!mg)return;var n=ctx.currentTime;mg.gain.cancelScheduledValues(n);mg.gain.setValueAtTime(mg.gain.value,n);mg.gain.linearRampToValueAtTime(0,n+1.8);setTimeout(stopO,2200);}
function startT(){secs=0;tid=setInterval(function(){secs++;var m=String(Math.floor(secs/60)).padStart(2,'0'),s=String(secs%60).padStart(2,'0');tmr.textContent=m+':'+s;},1000);tmr.className='timer on';}
function stopT(){clearInterval(tid);tmr.textContent='──:──';tmr.className='timer';}
function toggle(){
  if(playing){playing=false;stopA();stopT();cw.classList.remove('playing');pb.classList.remove('on');pb.textContent='▶';pb.style.background=C;pb.style.color='#080714';bg.textContent='';}
  else{playing=true;startA();startT();cw.classList.add('playing');pb.classList.add('on');pb.textContent='⏸';pb.style.background='transparent';pb.style.color=C;bg.textContent='Follow the circle · breathe with the pulse';}
}
</script></body></html>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MoonSoundBath({ visible, onClose }: Props) {
  const sound = getPhaseSound(getMoonPhaseData(new Date()).eventType);
  const isWeb = Platform.OS === "web";

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      {isWeb ? (
        <WebSoundBath sound={sound} onClose={handleClose} />
      ) : (
        <NativeSoundBath sound={sound} onClose={handleClose} />
      )}
    </Modal>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: { width: 36 },
  closeTxt: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, fontWeight: "700", marginTop: 1, letterSpacing: 0.5 },
  headerRight: { width: 36 },
  body: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 14,
  },
  emoji: { fontSize: 36 },
  phaseName: { fontSize: 21, fontWeight: "800", textAlign: "center", letterSpacing: 0.2 },
  phaseMeaning: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  circleWrap: { width: 190, height: 190, alignItems: "center", justifyContent: "center", marginVertical: 4 },
  circleOverlay: { position: "absolute", alignItems: "center" },
  freqBig: { fontSize: 30, fontWeight: "800", letterSpacing: -1 },
  freqUnit: { fontSize: 12, fontWeight: "600", marginTop: -2 },
  timer: { fontSize: 21, fontWeight: "300", letterSpacing: 3 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  breathLabel: { fontSize: 12, textAlign: "center" },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 8, width: "100%" },
  infoTitle: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  infoBody: { fontSize: 13, lineHeight: 21 },
});
