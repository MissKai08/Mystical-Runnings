Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

---

## Splash progress bar doesn't animate on native Android (but works on web) — missing Babel Worklets plugin

**File:** `babel.config.js`

The splash screen's progress bar (added via `react-native-reanimated`'s `useSharedValue`/`withTiming`/`useAnimatedStyle` in `AppSplashScreen.tsx`) renders correctly and animates on Expo web preview, but does not animate at all on a native Android build — confirmed on-device. This is the signature of the Reanimated/Worklets Babel plugin not actually being applied during the native build: web's implementation of Reanimated doesn't require the native worklets compilation step to visually animate, but Android does. Without that Babel transform, the animation's shared-value updates never reach the native UI thread, so the bar's width stays static.

Expo's documentation states this plugin is auto-configured by `babel-preset-expo` when `react-native-reanimated`/`react-native-worklets` are installed — but that auto-detection relies on resolving those packages from the module tree, and this project has already hit this exact class of failure once before (`babel-preset-expo` itself failing to resolve `expo` under pnpm's strict, non-hoisted `node_modules` structure, which required explicitly declaring it as a dependency rather than relying on auto-detection). The same is likely happening here with the Worklets plugin.

Current `babel.config.js`:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
```

Change to explicitly include the Worklets Babel plugin (this is the modern plugin name for Reanimated 4.x, which this project uses — do not use the older `react-native-reanimated/plugin` name):

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: ["react-native-worklets/plugin"],
  };
};
```

After this change, clear the Metro bundler cache before the next build (add `--reset-cache` to whatever start/build command runs Metro, or just note that the next CI build will naturally use a clean environment anyway so no action needed there).

---

## VERIFICATION CHECKLIST

- [ ] On a native Android build (not web preview), the splash screen's progress bar visibly and smoothly fills from empty to full over approximately 5.5 seconds
- [ ] Web preview splash progress bar still works as before (no regression)
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
