---
name: Android APK validation boundary
description: Distinguishes successful GitHub Actions APK builds from on-device Android runtime verification.
---

The Replit workspace may be able to confirm the exact GitHub Actions build and preview the Expo screen, while still having no Android SDK, emulator, or connected device. GitHub Actions artifacts may also require GitHub authentication to download even when the repository and run page are public.

**Why:** A successful release build and a web/Expo preview do not prove that the release APK renders or animates correctly on Android.

**How to apply:** Report build and preview evidence separately from on-device evidence. Only claim APK installation, animation timing, or logcat results when an Android target was actually available.