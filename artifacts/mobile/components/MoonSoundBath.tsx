import React, { useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Modal } from "react-native";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
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

// ─── HTML builder ─────────────────────────────────────────────────────────────
// All UI lives inside the WebView so the play button tap is a genuine
// in-page user gesture — the only way Web Audio API will start on mobile.

function buildHtml(s: PhaseSound): string {
  // Hex alpha helpers (no CSS color-mix needed)
  const col = s.color;
  const col15 = col + "26"; // ~15% opacity
  const col30 = col + "4D"; // ~30%
  const col50 = col + "80"; // 50%
  const col70 = col + "B3"; // 70%

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{width:100%;min-height:100%;background:#080714;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:#fff;overscroll-behavior:none;}
body{display:flex;flex-direction:column;align-items:center;padding:20px 24px 32px;gap:14px;}

.emoji{font-size:34px;line-height:1.1;}
.phase-name{font-size:21px;font-weight:800;color:${col};text-align:center;letter-spacing:0.2px;}
.phase-meaning{font-size:13px;color:#9CA3AF;text-align:center;line-height:1.55;}

/* Breathing circle */
.circle-wrap{position:relative;width:190px;height:190px;display:flex;align-items:center;justify-content:center;margin:4px 0;}
.ring{position:absolute;border-radius:50%;border:1px solid ${col};left:50%;top:50%;transform:translate(-50%,-50%);}
.r1{width:190px;height:190px;opacity:0.25;}
.r2{width:142px;height:142px;opacity:0.4;}
.r3{width:100px;height:100px;background:${col15};border-color:${col50};}
@keyframes breathe{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.25;}50%{transform:translate(-50%,-50%) scale(1.18);opacity:0.75;}}
@keyframes breatheMid{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.4;}50%{transform:translate(-50%,-50%) scale(1.15);opacity:0.8;}}
@keyframes breatheInner{0%,100%{transform:translate(-50%,-50%) scale(1);}50%{transform:translate(-50%,-50%) scale(1.12);}}
.playing .r1{animation:breathe 12s ease-in-out infinite;}
.playing .r2{animation:breatheMid 12s ease-in-out infinite 0.5s;}
.playing .r3{animation:breatheInner 12s ease-in-out infinite 1s;}
.freq-label{position:absolute;display:flex;flex-direction:column;align-items:center;gap:0;}
.freq-big{font-size:30px;font-weight:800;color:${col};letter-spacing:-1px;line-height:1.1;}
.freq-unit{font-size:12px;font-weight:600;color:${col70};}

/* Timer */
.timer{font-size:21px;font-weight:300;letter-spacing:3px;color:#4B5563;transition:color 0.6s;}
.timer.on{color:${col};}

/* Play button */
.play-btn{
  width:72px;height:72px;border-radius:50%;
  border:2px solid ${col};
  background:${col};
  color:#080714;
  font-size:26px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:background 0.3s,color 0.3s;
  outline:none;
}
.play-btn.on{background:transparent;color:${col};}

/* Breath guide */
.breath-guide{font-size:12px;color:#6B7280;text-align:center;min-height:16px;}

/* Volume */
.vol-row{display:flex;align-items:center;gap:7px;}
.vol-icon{font-size:14px;color:#4B5563;}
.vol-step{width:28px;height:6px;border-radius:3px;cursor:pointer;transition:background 0.2s;}

/* Info card */
.info-card{border-radius:14px;border:1px solid ${col30};background:${col15};padding:16px;width:100%;display:flex;flex-direction:column;gap:8px;margin-top:4px;}
.info-title{font-size:10px;font-weight:800;letter-spacing:1px;color:${col};}
.info-body{font-size:13px;line-height:1.65;color:#9CA3AF;}
</style>
</head>
<body>
<div class="emoji">${s.emoji}</div>
<div class="phase-name">${s.name}</div>
<div class="phase-meaning">${s.meaning}</div>

<div class="circle-wrap" id="cw">
  <div class="ring r1"></div>
  <div class="ring r2"></div>
  <div class="ring r3"></div>
  <div class="freq-label">
    <span class="freq-big">${s.freq}</span>
    <span class="freq-unit">Hz</span>
  </div>
</div>

<div class="timer" id="tmr">──:──</div>

<button class="play-btn" id="playBtn" onclick="toggle()">▶</button>

<div class="breath-guide" id="bg"></div>

<div class="vol-row">
  <span class="vol-icon">🔈</span>
  <div class="vol-step" id="v0" onclick="setVol(0.2)"></div>
  <div class="vol-step" id="v1" onclick="setVol(0.4)"></div>
  <div class="vol-step" id="v2" onclick="setVol(0.6)"></div>
  <div class="vol-step" id="v3" onclick="setVol(0.8)"></div>
  <div class="vol-step" id="v4" onclick="setVol(1.0)"></div>
  <span class="vol-icon">🔊</span>
</div>

<div class="info-card">
  <div class="info-title">SOLFEGGIO FREQUENCY · ${s.hz}</div>
  <div class="info-body">${s.info}</div>
</div>

<script>
var FREQ=${s.freq},COL='${col}',COL_DIM='${col30}';
var playing=false,vol=0.7,secs=0,tmrId=null;
var ctx=null,masterGain=null,oscs=[],lfo=null,lfoG=null;

var cw=document.getElementById('cw');
var btn=document.getElementById('playBtn');
var tmrEl=document.getElementById('tmr');
var bgEl=document.getElementById('bg');
var vSteps=[document.getElementById('v0'),document.getElementById('v1'),document.getElementById('v2'),document.getElementById('v3'),document.getElementById('v4')];
var vVals=[0.2,0.4,0.6,0.8,1.0];

function renderVol(){vSteps.forEach(function(s,i){s.style.background=vVals[i]<=vol?COL:COL_DIM;});}
renderVol();

function setVol(v){
  vol=v;renderVol();
  if(masterGain&&playing){
    var now=ctx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value,now);
    masterGain.gain.linearRampToValueAtTime(vol*0.6,now+0.3);
    if(lfoG)lfoG.gain.setValueAtTime(vol*0.1,now+0.3);
  }
}

function stopOscs(){oscs.forEach(function(o){try{o.stop();}catch(e){}});oscs=[];if(lfo){try{lfo.stop();}catch(e){}lfo=null;}lfoG=null;}

function startAudio(){
  if(!ctx){ctx=new(window.AudioContext||window.webkitAudioContext)();}
  if(ctx.state==='suspended'){ctx.resume();}
  if(!masterGain){masterGain=ctx.createGain();masterGain.gain.setValueAtTime(0,ctx.currentTime);masterGain.connect(ctx.destination);}
  stopOscs();
  var now=ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(0,now);
  masterGain.gain.linearRampToValueAtTime(vol*0.6,now+2.5);

  function osc(f,type,g){
    var o=ctx.createOscillator(),gn=ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(f,now);
    gn.gain.setValueAtTime(g,now);
    o.connect(gn);gn.connect(masterGain);o.start();oscs.push(o);
  }
  osc(FREQ,'sine',1.0);
  osc(FREQ*1.5,'sine',0.22);
  if(FREQ>250)osc(FREQ*0.5,'sine',0.14);
  osc(FREQ+7,'sine',0.07);

  lfo=ctx.createOscillator();lfoG=ctx.createGain();
  lfo.type='sine';lfo.frequency.setValueAtTime(0.083,now);
  lfoG.gain.setValueAtTime(vol*0.1,now);
  lfo.connect(lfoG);lfoG.connect(masterGain.gain);lfo.start();
}

function stopAudio(){
  if(!masterGain)return;
  var now=ctx.currentTime;
  masterGain.gain.cancelScheduledValues(now);
  masterGain.gain.setValueAtTime(masterGain.gain.value,now);
  masterGain.gain.linearRampToValueAtTime(0,now+1.8);
  setTimeout(stopOscs,2200);
}

function startTimer(){
  secs=0;
  tmrId=setInterval(function(){
    secs++;
    var m=String(Math.floor(secs/60)).padStart(2,'0');
    var s=String(secs%60).padStart(2,'0');
    tmrEl.textContent=m+':'+s;
  },1000);
  tmrEl.className='timer on';
}
function stopTimer(){clearInterval(tmrId);tmrEl.textContent='──:──';tmrEl.className='timer';}

function toggle(){
  if(playing){
    playing=false;
    stopAudio();stopTimer();
    cw.classList.remove('playing');
    btn.classList.remove('on');
    btn.textContent='▶';
    btn.style.background=COL;btn.style.color='#080714';
    bgEl.textContent='';
  }else{
    playing=true;
    startAudio();startTimer();
    cw.classList.add('playing');
    btn.classList.add('on');
    btn.textContent='⏸';
    btn.style.background='transparent';btn.style.color=COL;
    bgEl.textContent='Follow the circle · breathe with the pulse';
  }
}
</script>
</body>
</html>`;
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function MoonSoundBath({ visible, onClose }: Props) {
  const colors = useColors();
  const sound = getPhaseSound(getMoonPhaseData(new Date()).eventType);
  const html = buildHtml(sound);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[s.container, { backgroundColor: "#080714" }]}>
        {/* Native header — keeps the close button accessible */}
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} hitSlop={12} style={s.closeBtn}>
            <Text style={[s.closeTxt, { color: colors.mutedForeground }]}>✕</Text>
          </Pressable>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Moon Sound Bath</Text>
            <Text style={[s.headerSub, { color: sound.color }]}>{sound.hz}</Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* WebView owns ALL audio controls — user taps happen in-page context */}
        <WebView
          source={{ html }}
          style={s.webview}
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          originWhitelist={["*"]}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          backgroundColor="#080714"
          onError={() => {}}
        />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
  webview: { flex: 1, backgroundColor: "#080714" },
});
