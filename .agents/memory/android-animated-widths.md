---
name: Android animated widths
description: Native Android rendering constraint for Reanimated views whose layout width is animated.
---

For React Native Android views whose width is supplied by a Reanimated animated style, provide an explicit numeric initial width in the static style and keep the parent explicitly positioned when the view is absolutely positioned.

**Why:** Android can render the moving position indicator while omitting the fill layer when the fill starts without a measurable static width, even though the same code renders correctly in the web preview.

**How to apply:** Use a static width of `0` for the fill layer, then override it with the animated pixel width at runtime; keep position and stacking explicit for the track and fill.