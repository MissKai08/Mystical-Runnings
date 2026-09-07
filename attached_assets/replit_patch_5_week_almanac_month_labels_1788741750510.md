Do NOT rebuild, restructure, or change anything not explicitly listed below. Do NOT change fonts, colors, navigation structure, or any existing feature behavior not called out here. All source files live under `artifacts/mobile/`.

---

## Add month abbreviation to Week and Almanac view date labels

**Background:** Schedule view already shows the month on every entry (e.g., "MON 7 / Sep"), which makes it easy to keep track of where you are when scrolling. Week and Almanac views only show weekday + day number (e.g., "TUE 8" or "Fri 4") with no month at all, which becomes confusing near month boundaries or when jumping around the calendar. Add the month abbreviation to both, matching Schedule's short-month style (`"Sep"`, `"Oct"`, etc.), inline after the day number.

**File 1: `components/WeekView.tsx`**

There are two separate occurrences of this exact line (one in the "no events" branch, one in the "has events" branch, both rendering each day's group header in the week's event list — NOT the small day-picker number circles at the top of the screen, which should be left untouched):

```typescript
{SHORT_DAYS[day.getDay()]} {day.getDate()}
```

Change BOTH occurrences to:

```typescript
{SHORT_DAYS[day.getDay()]} {day.getDate()} {day.toLocaleDateString("en-US", { month: "short" })}
```

**File 2: `components/AlmanacView.tsx`**

Find this block (inside the card header, rendering each entry's date):

```typescript
<Text style={[styles.cardDate, { color: entry.isToday ? "#D4A843" : colors.mutedForeground }, { fontSize: fs(10) }]}>
  {entry.isToday ? "Today · " : ""}
  {DAY_NAMES[entry.date.getDay()]}{" "}
  {entry.date.getDate()}
</Text>
```

Change to:

```typescript
<Text style={[styles.cardDate, { color: entry.isToday ? "#D4A843" : colors.mutedForeground }, { fontSize: fs(10) }]}>
  {entry.isToday ? "Today · " : ""}
  {DAY_NAMES[entry.date.getDay()]}{" "}
  {entry.date.getDate()}{" "}
  {entry.date.toLocaleDateString("en-US", { month: "short" })}
</Text>
```

Do not change the small day-picker circles at the top of Week view (the tiny number-in-a-circle strip showing Sun/Mon/Tue.../6/7/8...) — only the day-group headers within the scrollable event list below it. Do not change anything in Schedule view, which already has the correct format.

---

## VERIFICATION CHECKLIST

- [ ] Week view: each day's event group header now shows weekday, day number, AND month abbreviation (e.g., "TUE 8 Sep")
- [ ] Almanac view: each card's date now shows weekday, day number, AND month abbreviation (e.g., "Fri 4 Sep")
- [ ] Week view's top day-picker strip (the small number circles) is unchanged
- [ ] Schedule view is unchanged
- [ ] No fonts, colors, navigation, or unrelated feature behavior changed anywhere else in the app
