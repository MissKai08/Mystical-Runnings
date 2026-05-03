import {
  NAMED_FULL_MOONS,
  DARK_MOONS,
  ECLIPSES,
  SABBATS,
  IFA_FESTIVALS,
  MERCURY_RETROGRADES,
  getDailyOdu,
} from "@/constants/spiritualData";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const SEASONAL_OPENING: Record<number, string> = {
  0:  "winter's deep silence holds the world in stillness",
  1:  "the first stirrings of returning light whisper beneath the frozen earth",
  2:  "the threshold between winter and spring trembles with expectant energy",
  3:  "the earth awakens from her sacred sleep, stretching into warmth and green",
  4:  "the world blooms in its fullest spring expression, alive with creative force",
  5:  "the sun reaches its throne at the peak of its yearly journey",
  6:  "summer pours its abundance over everything, ripe and generous",
  7:  "the harvest tide turns — the wheel begins its slow rotation toward the dark",
  8:  "autumn's first golden breath moves through the trees, carrying change",
  9:  "the veil between worlds grows thin and the ancestors draw very near",
  10: "winter's wisdom descends, calling you inward toward the sacred dark",
  11: "the longest night approaches, and with it, the promise of returning light",
};

const MONTHLY_INTENTION: Record<number, string> = {
  0:  "What are you willing to leave in the dark of winter so it cannot follow you into the light?",
  1:  "What new life are you tending in secret, waiting for the right moment to emerge?",
  2:  "What must you release at this threshold — to cross into spring unburdened and renewed?",
  3:  "What seed of intention, planted now in fertile spring soil, would bear the richest fruit?",
  4:  "Where in your life is full bloom possible right now — and what would it take to allow it?",
  5:  "At the height of your power and light, what truth can you no longer avoid seeing?",
  6:  "What abundance have you been given this season — and are you allowing yourself to receive it fully?",
  7:  "As the harvest turns, what have you grown this year that is ready to be gathered?",
  8:  "What are you releasing to the autumn winds — and what do you want to carry into the dark?",
  9:  "With the ancestors near, what message do you believe they most want you to hear right now?",
  10: "In this season of inward turning, what truth waits for you in the quiet?",
  11: "At the edge of the longest night, what light within you refuses to be extinguished?",
};

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function withinTwoDays(a: Date, b: Date): boolean {
  return Math.abs(a.getTime() - b.getTime()) < 2 * 24 * 60 * 60 * 1000;
}

export interface LunarLetterData {
  month: number;
  year: number;
  text: string;
  monthKey: string;
}

export function generateLunarLetter(year: number, month: number): LunarLetterData {
  const monthName = MONTH_NAMES[month];
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const fullMoons = NAMED_FULL_MOONS.filter(
    (m) => m.date.getFullYear() === year && m.date.getMonth() === month
  );
  const darkMoons = DARK_MOONS.filter(
    (m) => m.date.getFullYear() === year && m.date.getMonth() === month
  );
  const eclipses = ECLIPSES.filter(
    (e) => e.date.getFullYear() === year && e.date.getMonth() === month
  );
  const sabbats = SABBATS.filter(
    (s) => s.date.getFullYear() === year && s.date.getMonth() === month
  );
  const festivals = IFA_FESTIVALS.filter(
    (f) => f.date.getFullYear() === year && f.date.getMonth() === month
  );
  const retrogrades = MERCURY_RETROGRADES.filter(
    (r) => r.start <= monthEnd && r.end >= monthStart
  );

  // Up to 3 distinct Odu for start / middle / end of month
  const o1 = getDailyOdu(new Date(year, month, 1));
  const o2 = getDailyOdu(new Date(year, month, 15));
  const o3 = getDailyOdu(new Date(year, month + 1, 0));
  const odus = [o1];
  if (o2.name !== o1.name) odus.push(o2);
  if (o3.name !== o2.name && o3.name !== o1.name) odus.push(o3);

  const lines: string[] = [];

  lines.push(`SACRED LETTER — ${monthName.toUpperCase()} ${year}`);
  lines.push("");
  lines.push("Dear One,");
  lines.push("");

  lines.push(
    `As ${monthName} opens before you, ${SEASONAL_OPENING[month]}. ` +
    `The wheel turns, the sacred calendar advances, and the heavens arrange themselves with intention — ` +
    `reminding you, as always, that you are held within a living rhythm far older than memory.`
  );
  lines.push("");

  for (const fm of fullMoons) {
    const paired = eclipses.find((e) => withinTwoDays(e.date, fm.date));
    if (paired) {
      lines.push(
        `The ${fm.name} rises on ${fmt(fm.date)} in ${fm.sign ?? "the sky"} — and this is no ordinary fullness. ` +
        `A ${paired.name.toLowerCase()} crosses with it, opening a portal of accelerated change. ` +
        `What the eclipse illuminates will not return to shadow easily. ` +
        `Allow yourself to stand in that light, even if it reveals what you have long avoided.`
      );
    } else {
      lines.push(
        `The ${fm.name} rises on ${fmt(fm.date)} in ${fm.sign ?? "the sky"}, ` +
        `flooding your inner landscape with silver light. ` +
        `She asks you to witness what has grown since the last new moon — ` +
        `to receive the fullness of what you have been building, tending, and becoming. ` +
        `Let her light be a mirror, not a judgment.`
      );
    }
    lines.push("");
  }

  for (const dm of darkMoons) {
    const paired = eclipses.find((e) => withinTwoDays(e.date, dm.date));
    if (paired) {
      lines.push(
        `The Dark Moon arrives on ${fmt(dm.date)} in ${dm.sign ?? "the deep"}, accompanied by a ${paired.name.toLowerCase()} — ` +
        `a rare and potent gateway. The void speaks in double voice: ` +
        `what you release here releases with force; what you intend here carries extraordinary weight. ` +
        `Approach this threshold with honesty and ceremony.`
      );
    } else {
      lines.push(
        `The Dark Moon descends on ${fmt(dm.date)} in ${dm.sign ?? "the deep"}, ` +
        `calling you into the sacred void between one cycle and the next. ` +
        `In this stillness before the new moon rises, rest in the not-knowing. ` +
        `Surrender what the previous cycle asked you to carry. ` +
        `The dark is not an absence — it is the womb of every beginning.`
      );
    }
    lines.push("");
  }

  for (const sb of sabbats) {
    const shortName = sb.name.split(" —")[0];
    lines.push(
      `${shortName} falls on ${fmt(sb.date)} — ${sb.description} ` +
      `Honor the turning. Light a candle, step outside, place your bare feet on the earth if you can. ` +
      `The wheel of the year is one of the oldest spiritual technologies alive — ` +
      `letting it move through you is its own form of prayer.`
    );
    lines.push("");
  }

  for (const ret of retrogrades) {
    const starts = ret.start.getMonth() === month && ret.start.getFullYear() === year;
    lines.push(
      `${starts ? `Mercury stations retrograde in ${monthName}` : `Mercury remains retrograde through part of ${monthName}`} ` +
      `(${ret.label}), asking you to slow the machinery of forward motion. ` +
      `Review, revise, revisit — conversations left unfinished, decisions made too quickly, ` +
      `creative work set aside. These are the territories Mercury retrograde offers back to you for another look. ` +
      `Resist the urge to push; instead, refine.`
    );
    lines.push("");
  }

  for (const fv of festivals) {
    lines.push(
      `${fv.name} is honored this month — ${fv.description}. ` +
      `Take time to offer your prayers, your gratitude, and your presence to this sacred occasion. ` +
      `The Orisa are listening with particular attention when the community gathers in their name.`
    );
    lines.push("");
  }

  lines.push("The Odu cycling through this month carry these teachings:");
  lines.push("");
  for (const odu of odus) {
    lines.push(`✦ ${odu.name}  (${odu.element} · ${odu.orisha})`);
    lines.push(`   "${odu.guidance}"`);
    lines.push("");
  }

  lines.push(
    `As this month's sacred intention, I offer you this question — ` +
    `hold it like a candle, not a question to be answered, but a light to walk toward:`
  );
  lines.push("");
  lines.push(`"${MONTHLY_INTENTION[month]}"`);
  lines.push("");
  lines.push("Ashe. So it is written.");
  lines.push(`— Your Sacred Journal · ${monthName} ${year}`);

  return { month, year, text: lines.join("\n"), monthKey };
}
