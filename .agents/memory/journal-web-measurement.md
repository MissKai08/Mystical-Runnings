---
name: React Native Web measurement refs
description: Cross-platform guidance for measuring Journal date groups relative to a ScrollView content wrapper.
---

Use a mounted component ref directly as the relative target for `measureLayout` when running on React Native Web; `findNodeHandle` is unsupported there and produces a runtime error.

**Why:** The mobile app is verified through a web preview as well as native-oriented Expo code, so native node-handle helpers can break an otherwise valid interaction in the preview.

**How to apply:** For ScrollView-relative positioning, keep a dedicated content wrapper ref and pass that ref to `measureLayout`, with null guards for both refs.