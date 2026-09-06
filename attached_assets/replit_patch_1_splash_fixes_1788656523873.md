Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`. Work through in order, then report status on each verification line at the end.

---

## 1. Native splash screen shows the wrong image (icon instead of splash art)

**File:** `app.json`

The native splash config (which Android briefly shows before the JS bundle loads, separate from the custom `AppSplashScreen.tsx` component that takes over after) is pointing at the wrong file. Find this block inside `"expo": { ... }`:

```json
"splash": {
  "image": "./assets/images/icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#080714"
}
```

Change `"./assets/images/icon.png"` to `"./assets/images/splash.png"`. Do not change `resizeMode` or `backgroundColor` — leave those exactly as they are. This is a one-line value change, nothing else in this file should be touched.

---

## 2. Custom splash screen progress bar doesn't animate smoothly (New Architecture)

**File:** `components/AppSplashScreen.tsx`

The progress bar fill currently animates by storing `progress` as raw numeric state and updating it every 100ms via `setInterval`, rendering the fill width as a percentage string (`width: \`${progress}%\``). Under React Native's New Architecture (newly enabled this session via `newArchEnabled: true` in `app.json`), this raw percentage-string state update does not render as a smooth animation — it visually collapses into a brief flash/jump instead of a steady 5.5-second fill. This has been confirmed on-device via screen recording: the bar does not visibly progress, it just briefly flashes.

Replace the manual `setInterval`-based percentage state with a `react-native-reanimated`-driven width animation, which is built to animate reliably under Fabric/New Architecture. `react-native-reanimated` is already a project dependency — no new package needed.

Current relevant code to replace:

```typescript
const [progress, setProgress] = useState(0);
const [timerDone, setTimerDone] = useState(false);

useEffect(() => {
  const progressTimer = setInterval(() => {
    setProgress((prev) => {
      if (prev >= 100) { clearInterval(progressTimer); return 100; }
      return prev + 2;
    });
  }, 100);
  const doneTimer = setTimeout(() => setTimerDone(true), 5500);
  return () => { clearInterval(progressTimer); clearTimeout(doneTimer); };
}, []);
```

And in the JSX:
```typescript
<View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
<View style={[styles.progressTip, { left: `${progress}%` as `${number}%`, marginLeft: -4 }]} />
```

Replace with a Reanimated shared value driven by `withTiming`, animating from 0 to 100 over 5500ms (matching the existing duration exactly, so the splash's minimum-display-time logic in `_layout.tsx` still lines up correctly with `timerDone`):

```typescript
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

// inside the component, replacing the progress/timerDone state and the setInterval effect:
const progress = useSharedValue(0);
const [timerDone, setTimerDone] = useState(false);

useEffect(() => {
  progress.value = withTiming(100, { duration: 5500, easing: Easing.linear });
  const doneTimer = setTimeout(() => setTimerDone(true), 5500);
  return () => clearTimeout(doneTimer);
}, []);

const fillStyle = useAnimatedStyle(() => ({
  width: `${progress.value}%`,
}));
const tipStyle = useAnimatedStyle(() => ({
  left: `${progress.value}%`,
  marginLeft: -4,
}));
```

And update the JSX to use `Animated.View` with the animated styles instead of the plain `View` + inline percentage style:
```typescript
<Animated.View style={[styles.progressFill, fillStyle]} />
<Animated.View style={[styles.progressTip, tipStyle]} />
```

Leave `progressTrack`, `progressSection`, the `ImageBackground`, `SplashScreen.hideAsync()` call, and the `timerDone && fontsLoaded` gating logic in the second `useEffect` completely unchanged — only the progress-value mechanism and the two `View`s it drives are being replaced.

---

## VERIFICATION CHECKLIST

- [ ] On fresh app launch, the very first splash flash (before the custom moon/title splash appears) shows the actual splash art, not the app icon
- [ ] The custom splash screen's progress bar visibly and smoothly fills from empty to full over approximately 5.5 seconds — confirm by watching it directly on-device, not just checking that code compiles
- [ ] Splash screen still transitions to the main app only after both the 5.5s timer and fonts have finished loading (no early or delayed transition)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
