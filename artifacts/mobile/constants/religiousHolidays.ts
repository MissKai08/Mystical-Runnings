export type HolidayRegion = "us" | "mexico" | "india" | "jewish";

export interface ReligiousHoliday {
  name: string;
  date: Date;
  region: HolidayRegion;
  description: string;
  emoji: string;
}

export const HOLIDAY_REGION_COLOR: Record<HolidayRegion, string> = {
  us: "#3B82F6",
  mexico: "#22C55E",
  india: "#F97316",
  jewish: "#60A5FA",
};

export const HOLIDAY_REGION_LABEL: Record<HolidayRegion, string> = {
  us: "U.S. HOLIDAY",
  mexico: "MEXICAN HOLIDAY",
  india: "INDIAN HOLIDAY",
  jewish: "JEWISH HOLIDAY",
};

export const HOLIDAY_REGION_FLAG: Record<HolidayRegion, string> = {
  us: "🇺🇸",
  mexico: "🇲🇽",
  india: "🇮🇳",
  jewish: "✡️",
};

// ─── U.S. Holidays ───────────────────────────────────────────────────────────
const US: ReligiousHoliday[] = [
  // 2025
  { name: "New Year's Day", date: new Date(2025, 0, 1), region: "us", emoji: "🎆", description: "The start of the Gregorian new year, celebrated with gatherings, fireworks, and new beginnings." },
  { name: "Martin Luther King Jr. Day", date: new Date(2025, 0, 20), region: "us", emoji: "✊", description: "A federal holiday honoring the life and legacy of Dr. Martin Luther King Jr., champion of civil rights and justice." },
  { name: "Presidents Day", date: new Date(2025, 1, 17), region: "us", emoji: "🏛️", description: "Celebrates the birthdays of George Washington and Abraham Lincoln, honoring the office of the presidency." },
  { name: "Good Friday", date: new Date(2025, 3, 18), region: "us", emoji: "✝️", description: "The Friday before Easter, commemorating the crucifixion of Jesus Christ. A day of prayer and fasting in many Christian traditions." },
  { name: "Easter", date: new Date(2025, 3, 20), region: "us", emoji: "🐣", description: "The Christian celebration of the resurrection of Jesus Christ — the central feast of the liturgical year." },
  { name: "Memorial Day", date: new Date(2025, 4, 26), region: "us", emoji: "🎖️", description: "Honors the men and women who died while serving in the United States military. Observed on the last Monday of May." },
  { name: "Independence Day", date: new Date(2025, 6, 4), region: "us", emoji: "🎆", description: "Celebrates the adoption of the Declaration of Independence on July 4, 1776, marking the birth of the United States." },
  { name: "Labor Day", date: new Date(2025, 8, 1), region: "us", emoji: "⚒️", description: "Honors the American labor movement and the contributions of workers to society. Observed on the first Monday of September." },
  { name: "Columbus Day", date: new Date(2025, 9, 13), region: "us", emoji: "⛵", description: "Commemorates Christopher Columbus's 1492 arrival in the Americas. Also observed as Indigenous Peoples Day in many communities." },
  { name: "Veterans Day", date: new Date(2025, 10, 11), region: "us", emoji: "🎖️", description: "Honors all who have served in the U.S. Armed Forces, living and deceased." },
  { name: "Thanksgiving", date: new Date(2025, 10, 27), region: "us", emoji: "🦃", description: "A national holiday of gratitude celebrating the harvest and blessings of the past year. Observed on the fourth Thursday of November." },
  { name: "Christmas", date: new Date(2025, 11, 25), region: "us", emoji: "⭐", description: "The Christian celebration of the birth of Jesus Christ, now widely observed as a cultural and religious holiday." },

  // 2026
  { name: "New Year's Day", date: new Date(2026, 0, 1), region: "us", emoji: "🎆", description: "The start of the Gregorian new year." },
  { name: "Martin Luther King Jr. Day", date: new Date(2026, 0, 19), region: "us", emoji: "✊", description: "Federal holiday honoring Dr. Martin Luther King Jr." },
  { name: "Presidents Day", date: new Date(2026, 1, 16), region: "us", emoji: "🏛️", description: "Celebrates the birthdays of Washington and Lincoln, honoring the presidency." },
  { name: "Good Friday", date: new Date(2026, 3, 3), region: "us", emoji: "✝️", description: "Commemorates the crucifixion of Jesus Christ. A day of prayer and fasting." },
  { name: "Easter", date: new Date(2026, 3, 5), region: "us", emoji: "🐣", description: "The Christian celebration of the resurrection of Jesus Christ." },
  { name: "Memorial Day", date: new Date(2026, 4, 25), region: "us", emoji: "🎖️", description: "Honors those who died serving in the U.S. military." },
  { name: "Independence Day", date: new Date(2026, 6, 4), region: "us", emoji: "🎆", description: "Celebrates the birth of the United States, July 4, 1776." },
  { name: "Labor Day", date: new Date(2026, 8, 7), region: "us", emoji: "⚒️", description: "Honors the contributions of American workers." },
  { name: "Columbus Day", date: new Date(2026, 9, 12), region: "us", emoji: "⛵", description: "Commemorates Columbus's 1492 arrival. Also Indigenous Peoples Day in many communities." },
  { name: "Veterans Day", date: new Date(2026, 10, 11), region: "us", emoji: "🎖️", description: "Honors all U.S. Armed Forces veterans." },
  { name: "Thanksgiving", date: new Date(2026, 10, 26), region: "us", emoji: "🦃", description: "National holiday of gratitude. Fourth Thursday of November." },
  { name: "Christmas", date: new Date(2026, 11, 25), region: "us", emoji: "⭐", description: "Christian celebration of the birth of Jesus Christ." },

  // 2027
  { name: "New Year's Day", date: new Date(2027, 0, 1), region: "us", emoji: "🎆", description: "The start of the Gregorian new year." },
  { name: "Martin Luther King Jr. Day", date: new Date(2027, 0, 18), region: "us", emoji: "✊", description: "Federal holiday honoring Dr. Martin Luther King Jr." },
  { name: "Presidents Day", date: new Date(2027, 1, 15), region: "us", emoji: "🏛️", description: "Honors the birthdays of Washington and Lincoln." },
  { name: "Good Friday", date: new Date(2027, 2, 26), region: "us", emoji: "✝️", description: "Commemorates the crucifixion of Jesus Christ." },
  { name: "Easter", date: new Date(2027, 2, 28), region: "us", emoji: "🐣", description: "The Christian celebration of the resurrection of Jesus Christ." },
  { name: "Memorial Day", date: new Date(2027, 4, 31), region: "us", emoji: "🎖️", description: "Honors those who died serving in the U.S. military." },
  { name: "Independence Day", date: new Date(2027, 6, 4), region: "us", emoji: "🎆", description: "Celebrates the birth of the United States." },
  { name: "Labor Day", date: new Date(2027, 8, 6), region: "us", emoji: "⚒️", description: "Honors the contributions of American workers." },
  { name: "Columbus Day", date: new Date(2027, 9, 11), region: "us", emoji: "⛵", description: "Commemorates Columbus's 1492 arrival. Also Indigenous Peoples Day in many communities." },
  { name: "Veterans Day", date: new Date(2027, 10, 11), region: "us", emoji: "🎖️", description: "Honors all U.S. Armed Forces veterans." },
  { name: "Thanksgiving", date: new Date(2027, 10, 25), region: "us", emoji: "🦃", description: "National holiday of gratitude. Fourth Thursday of November." },
  { name: "Christmas", date: new Date(2027, 11, 25), region: "us", emoji: "⭐", description: "Christian celebration of the birth of Jesus Christ." },
];

// ─── Mexican Holidays ────────────────────────────────────────────────────────
const MEXICO: ReligiousHoliday[] = [
  // 2025
  { name: "Año Nuevo", date: new Date(2025, 0, 1), region: "mexico", emoji: "🎆", description: "El primero del año nuevo — celebrado con familia, música, y esperanza para el ciclo que comienza." },
  { name: "Día de Reyes", date: new Date(2025, 0, 6), region: "mexico", emoji: "👑", description: "Epiphany — the Three Kings bring gifts to children. Families share the Rosca de Reyes bread and gather in celebration." },
  { name: "Día de la Candelaria", date: new Date(2025, 1, 2), region: "mexico", emoji: "🕯️", description: "Candlemas — 40 days after Christmas. Babies born on this day or during Christmas are traditionally presented at church." },
  { name: "Día de la Constitución", date: new Date(2025, 1, 3), region: "mexico", emoji: "📜", description: "Commemorates the promulgation of Mexico's constitutions of 1857 and 1917, foundational to the nation's rights and liberties." },
  { name: "Día de la Bandera", date: new Date(2025, 1, 24), region: "mexico", emoji: "🇲🇽", description: "Flag Day — Mexico honors its national flag, a symbol of unity, independence, and cultural identity." },
  { name: "Día de Benito Juárez", date: new Date(2025, 2, 17), region: "mexico", emoji: "⚖️", description: "Honors Benito Juárez, the indigenous Zapotec lawyer who became Mexico's reformist president and champion of justice." },
  { name: "Viernes Santo", date: new Date(2025, 3, 18), region: "mexico", emoji: "✝️", description: "Good Friday — commemorates the crucifixion of Jesus Christ. One of the most solemn days in Mexico's Catholic tradition." },
  { name: "Día del Niño", date: new Date(2025, 3, 30), region: "mexico", emoji: "🧒", description: "Children's Day — schools and families celebrate the joy, rights, and potential of children across Mexico." },
  { name: "Día del Trabajo", date: new Date(2025, 4, 1), region: "mexico", emoji: "⚒️", description: "International Workers' Day — honoring the labor movement and the dignity of working people." },
  { name: "Día de las Madres", date: new Date(2025, 4, 10), region: "mexico", emoji: "🌸", description: "Mother's Day — always May 10 in Mexico. One of the most important family celebrations of the year." },
  { name: "Día de la Independencia", date: new Date(2025, 8, 16), region: "mexico", emoji: "🇲🇽", description: "Independence Day — commemorates the Grito de Independencia in 1810, when Father Hidalgo called Mexico to rise." },
  { name: "Día de la Raza", date: new Date(2025, 9, 12), region: "mexico", emoji: "🌎", description: "Day of the Race — honors the cultural mixing of indigenous, Spanish, and African peoples that created the Mexican identity." },
  { name: "Día de Muertos — Ofrendas", date: new Date(2025, 10, 1), region: "mexico", emoji: "💀", description: "All Saints Day and the first night of Día de Muertos. Families build ofrendas (altars) to welcome the souls of the departed." },
  { name: "Día de Muertos", date: new Date(2025, 10, 2), region: "mexico", emoji: "🌼", description: "All Souls Day — the heart of Día de Muertos. Families gather at cemeteries to commune with deceased loved ones through flowers, food, and prayer." },
  { name: "Revolución Mexicana", date: new Date(2025, 10, 17), region: "mexico", emoji: "🐎", description: "Commemorates the beginning of the Mexican Revolution in 1910, led by Francisco Madero against the Díaz dictatorship." },
  { name: "Día de la Virgen de Guadalupe", date: new Date(2025, 11, 12), region: "mexico", emoji: "🌹", description: "Honors the apparition of Our Lady of Guadalupe to Juan Diego in 1531. Mexico's most beloved spiritual celebration, drawing millions to the Basilica." },
  { name: "Las Posadas", date: new Date(2025, 11, 16), region: "mexico", emoji: "⭐", description: "The 9-night reenactment of Mary and Joseph's search for shelter (Dec 16–24). Communities gather for prayer, song, and the piñata." },
  { name: "Navidad", date: new Date(2025, 11, 25), region: "mexico", emoji: "⭐", description: "Christmas — the celebration of the birth of Jesus Christ, marked with Midnight Mass (Misa de Gallo), family gatherings, and joy." },

  // 2026
  { name: "Año Nuevo", date: new Date(2026, 0, 1), region: "mexico", emoji: "🎆", description: "New Year's Day." },
  { name: "Día de Reyes", date: new Date(2026, 0, 6), region: "mexico", emoji: "👑", description: "Three Kings Day — the traditional gift-giving celebration of Epiphany." },
  { name: "Día de la Candelaria", date: new Date(2026, 1, 2), region: "mexico", emoji: "🕯️", description: "Candlemas — presentation of the Christ child. Babies are blessed at church." },
  { name: "Día de la Constitución", date: new Date(2026, 1, 2), region: "mexico", emoji: "📜", description: "Commemorates Mexico's constitutions of 1857 and 1917." },
  { name: "Día de la Bandera", date: new Date(2026, 1, 24), region: "mexico", emoji: "🇲🇽", description: "Flag Day — honoring Mexico's national flag and identity." },
  { name: "Día de Benito Juárez", date: new Date(2026, 2, 16), region: "mexico", emoji: "⚖️", description: "Honors Benito Juárez, champion of justice and reformist president." },
  { name: "Viernes Santo", date: new Date(2026, 3, 3), region: "mexico", emoji: "✝️", description: "Good Friday — the crucifixion of Jesus. A solemn day of prayer and procession." },
  { name: "Día del Niño", date: new Date(2026, 3, 30), region: "mexico", emoji: "🧒", description: "Children's Day — celebrating the rights and joy of children." },
  { name: "Día del Trabajo", date: new Date(2026, 4, 1), region: "mexico", emoji: "⚒️", description: "International Workers' Day." },
  { name: "Día de las Madres", date: new Date(2026, 4, 10), region: "mexico", emoji: "🌸", description: "Mother's Day — always May 10 in Mexico." },
  { name: "Día de la Independencia", date: new Date(2026, 8, 16), region: "mexico", emoji: "🇲🇽", description: "Independence Day — the Grito de Independencia." },
  { name: "Día de la Raza", date: new Date(2026, 9, 12), region: "mexico", emoji: "🌎", description: "Day of the Race — celebrating Mexico's multicultural heritage." },
  { name: "Día de Muertos — Ofrendas", date: new Date(2026, 10, 1), region: "mexico", emoji: "💀", description: "First night of Día de Muertos — ofrendas welcome returning souls." },
  { name: "Día de Muertos", date: new Date(2026, 10, 2), region: "mexico", emoji: "🌼", description: "Día de Muertos — communion with ancestors through flowers, food, and prayer." },
  { name: "Revolución Mexicana", date: new Date(2026, 10, 16), region: "mexico", emoji: "🐎", description: "Commemorates the Mexican Revolution of 1910." },
  { name: "Día de la Virgen de Guadalupe", date: new Date(2026, 11, 12), region: "mexico", emoji: "🌹", description: "Feast of Our Lady of Guadalupe — Mexico's most beloved spiritual celebration." },
  { name: "Las Posadas", date: new Date(2026, 11, 16), region: "mexico", emoji: "⭐", description: "9-night celebration of Mary and Joseph's search for shelter (Dec 16–24)." },
  { name: "Navidad", date: new Date(2026, 11, 25), region: "mexico", emoji: "⭐", description: "Christmas — birth of Jesus Christ." },

  // 2027
  { name: "Año Nuevo", date: new Date(2027, 0, 1), region: "mexico", emoji: "🎆", description: "New Year's Day." },
  { name: "Día de Reyes", date: new Date(2027, 0, 6), region: "mexico", emoji: "👑", description: "Three Kings Day — Epiphany." },
  { name: "Día de la Candelaria", date: new Date(2027, 1, 2), region: "mexico", emoji: "🕯️", description: "Candlemas — babies and corn presented at church." },
  { name: "Día de la Constitución", date: new Date(2027, 1, 1), region: "mexico", emoji: "📜", description: "Commemorates Mexico's foundational constitutions." },
  { name: "Día de la Bandera", date: new Date(2027, 1, 24), region: "mexico", emoji: "🇲🇽", description: "Flag Day — Mexico's national symbol of unity." },
  { name: "Día de Benito Juárez", date: new Date(2027, 2, 15), region: "mexico", emoji: "⚖️", description: "Honors Benito Juárez, Mexico's reformist president." },
  { name: "Viernes Santo", date: new Date(2027, 2, 26), region: "mexico", emoji: "✝️", description: "Good Friday — solemn commemoration of the crucifixion." },
  { name: "Día del Niño", date: new Date(2027, 3, 30), region: "mexico", emoji: "🧒", description: "Children's Day." },
  { name: "Día del Trabajo", date: new Date(2027, 4, 1), region: "mexico", emoji: "⚒️", description: "International Workers' Day." },
  { name: "Día de las Madres", date: new Date(2027, 4, 10), region: "mexico", emoji: "🌸", description: "Mother's Day — always May 10." },
  { name: "Día de la Independencia", date: new Date(2027, 8, 16), region: "mexico", emoji: "🇲🇽", description: "Independence Day." },
  { name: "Día de la Raza", date: new Date(2027, 9, 12), region: "mexico", emoji: "🌎", description: "Day of the Race — Mexico's multicultural identity." },
  { name: "Día de Muertos — Ofrendas", date: new Date(2027, 10, 1), region: "mexico", emoji: "💀", description: "First night of Día de Muertos." },
  { name: "Día de Muertos", date: new Date(2027, 10, 2), region: "mexico", emoji: "🌼", description: "Día de Muertos — communion with ancestors." },
  { name: "Revolución Mexicana", date: new Date(2027, 10, 15), region: "mexico", emoji: "🐎", description: "Commemorates the Mexican Revolution of 1910." },
  { name: "Día de la Virgen de Guadalupe", date: new Date(2027, 11, 12), region: "mexico", emoji: "🌹", description: "Feast of Our Lady of Guadalupe." },
  { name: "Las Posadas", date: new Date(2027, 11, 16), region: "mexico", emoji: "⭐", description: "9-night celebration (Dec 16–24)." },
  { name: "Navidad", date: new Date(2027, 11, 25), region: "mexico", emoji: "⭐", description: "Christmas." },
];

// ─── Indian Holidays ─────────────────────────────────────────────────────────
const INDIA: ReligiousHoliday[] = [
  // 2025
  { name: "Makar Sankranti / Pongal", date: new Date(2025, 0, 14), region: "india", emoji: "🌞", description: "The harvest festival of the sun's transition into Capricorn. Celebrated across India as Pongal (Tamil Nadu), Uttarayan (Gujarat), and Lohri (Punjab)." },
  { name: "Republic Day", date: new Date(2025, 0, 26), region: "india", emoji: "🇮🇳", description: "Celebrates the adoption of India's constitution on January 26, 1950. Marked by a grand parade on Kartavya Path in New Delhi." },
  { name: "Holi", date: new Date(2025, 2, 14), region: "india", emoji: "🎨", description: "The festival of colors and the arrival of spring. Celebrated on Phalgun Purnima with Holika Dahan (bonfire) the night before and a riot of colored powder the next morning." },
  { name: "Ram Navami", date: new Date(2025, 3, 6), region: "india", emoji: "🏹", description: "Celebrates the birth of Lord Rama, the seventh avatar of Vishnu and the hero of the Ramayana. A day of fasting, prayer, and devotional song." },
  { name: "Good Friday", date: new Date(2025, 3, 18), region: "india", emoji: "✝️", description: "Observed by India's Christian community — a national holiday commemorating the crucifixion of Jesus Christ." },
  { name: "Eid al-Fitr", date: new Date(2025, 2, 30), region: "india", emoji: "🌙", description: "Marks the end of Ramadan, the Islamic holy month of fasting. Celebrated with prayers, feasting, and gifts (Eid). Date subject to moon sighting." },
  { name: "Akshaya Tritiya", date: new Date(2025, 3, 29), region: "india", emoji: "✨", description: "An auspicious day in the Hindu calendar for new beginnings, investments, and purchases — especially gold. Believed to bring eternal prosperity." },
  { name: "Eid al-Adha", date: new Date(2025, 5, 7), region: "india", emoji: "🕌", description: "The Festival of Sacrifice — commemorates Ibrahim's willingness to sacrifice his son. Muslims offer prayers and sacrifice livestock, sharing meat with family and the poor." },
  { name: "Guru Purnima", date: new Date(2025, 6, 10), region: "india", emoji: "🙏", description: "Full moon day honoring spiritual teachers (gurus). Disciples offer gratitude and reverence. Also commemorates the birthday of sage Vyasa." },
  { name: "Raksha Bandhan", date: new Date(2025, 7, 9), region: "india", emoji: "🪢", description: "Sisters tie a rakhi (protective thread) on their brothers' wrists. Brothers vow to protect and care for their sisters. A bond of love across the nation." },
  { name: "Independence Day", date: new Date(2025, 7, 15), region: "india", emoji: "🇮🇳", description: "Celebrates India's independence from British rule on August 15, 1947. The Prime Minister hoists the national flag at the Red Fort in New Delhi." },
  { name: "Ganesh Chaturthi", date: new Date(2025, 7, 27), region: "india", emoji: "🐘", description: "Celebrates the birth of Lord Ganesha, remover of obstacles and deity of wisdom. Magnificent clay idols are installed and immersed 10 days later (Anant Chaturdashi)." },
  { name: "Gandhi Jayanti", date: new Date(2025, 9, 2), region: "india", emoji: "🕊️", description: "Mahatma Gandhi's birthday — a national holiday honoring the Father of the Nation. Observed with prayer, fasting, and remembrance of his philosophy of non-violence." },
  { name: "Navratri begins", date: new Date(2025, 9, 2), region: "india", emoji: "🪔", description: "Nine nights honoring the nine forms of Goddess Durga. Celebrated with fasting, prayer, Garba and Dandiya dance across India." },
  { name: "Dussehra (Vijayadashami)", date: new Date(2025, 9, 12), region: "india", emoji: "🔥", description: "Celebrates Lord Rama's victory over the demon king Ravana. Effigies of Ravana are burned across India, symbolizing the triumph of good over evil." },
  { name: "Diwali", date: new Date(2025, 9, 20), region: "india", emoji: "🪔", description: "The Festival of Lights — one of India's most beloved celebrations. Homes are lit with diyas (oil lamps), fireworks fill the sky, and Goddess Lakshmi is welcomed with prayer and sweets." },
  { name: "Bhai Dooj", date: new Date(2025, 9, 22), region: "india", emoji: "🪢", description: "Sisters pray for brothers' long life and well-being. Brothers offer gifts and vow to protect them — a sibling bond celebrated two days after Diwali." },
  { name: "Guru Nanak Jayanti", date: new Date(2025, 10, 5), region: "india", emoji: "☬", description: "Celebrates the birth of Guru Nanak Dev Ji, founder of Sikhism. Marked by Akhand Path (continuous scripture reading), processions (Nagar Kirtan), and langar (community meals)." },
  { name: "Christmas", date: new Date(2025, 11, 25), region: "india", emoji: "⭐", description: "Observed as a national holiday in India, celebrated by Christians and widely enjoyed across communities for its spirit of giving and goodwill." },

  // 2026
  { name: "Makar Sankranti / Pongal", date: new Date(2026, 0, 14), region: "india", emoji: "🌞", description: "Harvest festival of the sun's transition into Capricorn." },
  { name: "Republic Day", date: new Date(2026, 0, 26), region: "india", emoji: "🇮🇳", description: "Celebrates India's constitutional republic, established Jan 26, 1950." },
  { name: "Eid al-Fitr", date: new Date(2026, 2, 20), region: "india", emoji: "🌙", description: "End of Ramadan — prayers, feasting, and community celebration. Date subject to moon sighting." },
  { name: "Holi", date: new Date(2026, 2, 3), region: "india", emoji: "🎨", description: "Festival of colors marking the arrival of spring. Phalgun Purnima." },
  { name: "Good Friday", date: new Date(2026, 3, 3), region: "india", emoji: "✝️", description: "National holiday — Christian commemoration of the crucifixion." },
  { name: "Eid al-Adha", date: new Date(2026, 4, 27), region: "india", emoji: "🕌", description: "Festival of Sacrifice — Ibrahim's devotion honored with prayer and sharing." },
  { name: "Independence Day", date: new Date(2026, 7, 15), region: "india", emoji: "🇮🇳", description: "India's independence from Britain, August 15, 1947." },
  { name: "Raksha Bandhan", date: new Date(2026, 6, 29), region: "india", emoji: "🪢", description: "Sisters tie rakhi on brothers' wrists — a bond of love and protection." },
  { name: "Ganesh Chaturthi", date: new Date(2026, 7, 18), region: "india", emoji: "🐘", description: "Birth of Lord Ganesha, remover of obstacles. 10-day celebration." },
  { name: "Gandhi Jayanti", date: new Date(2026, 9, 2), region: "india", emoji: "🕊️", description: "Mahatma Gandhi's birthday — Father of the Nation." },
  { name: "Navratri begins", date: new Date(2026, 9, 22), region: "india", emoji: "🪔", description: "Nine nights honoring the nine forms of Goddess Durga." },
  { name: "Dussehra (Vijayadashami)", date: new Date(2026, 9, 31), region: "india", emoji: "🔥", description: "Victory of Rama over Ravana — good triumphs over evil." },
  { name: "Diwali", date: new Date(2026, 10, 8), region: "india", emoji: "🪔", description: "Festival of Lights — diyas, fireworks, Lakshmi Puja." },
  { name: "Christmas", date: new Date(2026, 11, 25), region: "india", emoji: "⭐", description: "National holiday — spirit of giving and goodwill." },

  // 2027
  { name: "Makar Sankranti / Pongal", date: new Date(2027, 0, 14), region: "india", emoji: "🌞", description: "Harvest festival of the sun." },
  { name: "Republic Day", date: new Date(2027, 0, 26), region: "india", emoji: "🇮🇳", description: "India's constitutional republic." },
  { name: "Holi", date: new Date(2027, 1, 21), region: "india", emoji: "🎨", description: "Festival of colors — spring celebration on Phalgun Purnima." },
  { name: "Eid al-Fitr", date: new Date(2027, 2, 9), region: "india", emoji: "🌙", description: "End of Ramadan. Date subject to moon sighting." },
  { name: "Good Friday", date: new Date(2027, 2, 26), region: "india", emoji: "✝️", description: "National holiday — crucifixion of Jesus Christ." },
  { name: "Eid al-Adha", date: new Date(2027, 4, 16), region: "india", emoji: "🕌", description: "Festival of Sacrifice." },
  { name: "Independence Day", date: new Date(2027, 7, 15), region: "india", emoji: "🇮🇳", description: "India's independence from Britain." },
  { name: "Ganesh Chaturthi", date: new Date(2027, 8, 5), region: "india", emoji: "🐘", description: "Birth of Lord Ganesha — 10-day celebration." },
  { name: "Gandhi Jayanti", date: new Date(2027, 9, 2), region: "india", emoji: "🕊️", description: "Mahatma Gandhi's birthday." },
  { name: "Navratri begins", date: new Date(2027, 9, 11), region: "india", emoji: "🪔", description: "Nine nights honoring Goddess Durga." },
  { name: "Dussehra (Vijayadashami)", date: new Date(2027, 9, 20), region: "india", emoji: "🔥", description: "Victory of Rama over Ravana." },
  { name: "Diwali", date: new Date(2027, 9, 29), region: "india", emoji: "🪔", description: "Festival of Lights." },
  { name: "Christmas", date: new Date(2027, 11, 25), region: "india", emoji: "⭐", description: "Christmas — national holiday." },
];

// ─── Jewish Holidays ─────────────────────────────────────────────────────────
const JEWISH: ReligiousHoliday[] = [
  // 5786 (2025–2026)
  { name: "Rosh Hashanah", date: new Date(2025, 8, 22), region: "jewish", emoji: "🍎", description: "The Jewish New Year (1–2 Tishri 5786). A time of reflection, prayer, and the sounding of the shofar. The Days of Awe begin — ten days of introspection before Yom Kippur." },
  { name: "Yom Kippur", date: new Date(2025, 9, 1), region: "jewish", emoji: "✡️", description: "The Day of Atonement (10 Tishri 5786) — the holiest day of the Jewish year. A full day of fasting, prayer, and repentance. The Gates of Repentance close at the sound of the final shofar blast." },
  { name: "Sukkot begins", date: new Date(2025, 9, 6), region: "jewish", emoji: "🌿", description: "The Feast of Tabernacles (15 Tishri 5786) — a seven-day harvest festival. Jews build and dwell in temporary huts (sukkot) as a reminder of the Israelites' wandering in the desert." },
  { name: "Shemini Atzeret / Simchat Torah", date: new Date(2025, 9, 13), region: "jewish", emoji: "📜", description: "Shemini Atzeret — the 'Eighth Day of Assembly' following Sukkot. Simchat Torah celebrates the completion and new beginning of the Torah reading cycle with dancing and joy." },
  { name: "Hanukkah", date: new Date(2025, 11, 14), region: "jewish", emoji: "🕎", description: "The Festival of Lights (25 Kislev 5786) — eight nights commemorating the miracle of oil in the Temple. Menorahs are lit, latkes and sufganiyot enjoyed, and dreidels spun." },
  { name: "Tu B'Shvat", date: new Date(2026, 0, 1), region: "jewish", emoji: "🌳", description: "The New Year of the Trees (15 Shvat 5786). A minor holiday celebrating the natural world and the land of Israel. Traditionally marked by eating fruits and nuts of the seven species." },
  { name: "Purim", date: new Date(2026, 2, 3), region: "jewish", emoji: "🎭", description: "The joyous holiday celebrating the salvation of the Jewish people from Haman's plot, as told in the Book of Esther. Marked by costumes, the Megillah reading, feasting, and gifts to the poor." },
  { name: "Passover (Pesach)", date: new Date(2026, 3, 1), region: "jewish", emoji: "🍷", description: "The Feast of Freedom (15 Nisan 5786) — eight days celebrating the Exodus from Egypt. The Passover Seder on the first two nights retells the story with symbolic foods, the four cups of wine, and the Haggadah." },
  { name: "Lag B'Omer", date: new Date(2026, 4, 6), region: "jewish", emoji: "🔥", description: "The 33rd day of the Omer count. A day of celebration between Passover and Shavuot. Bonfires are lit, and many mark it with weddings, haircuts, and outdoor festivities." },
  { name: "Shavuot", date: new Date(2026, 4, 21), region: "jewish", emoji: "📜", description: "The Feast of Weeks (6 Sivan 5786) — celebrates the giving of the Torah at Mount Sinai and the spring harvest. Jews stay up all night studying Torah (tikkun leil Shavuot) and eat dairy foods." },
  { name: "Tisha B'Av", date: new Date(2026, 7, 2), region: "jewish", emoji: "🕯️", description: "The ninth day of Av — a day of mourning for the destruction of both Temples in Jerusalem and other Jewish tragedies. A 25-hour fast with prayer, lamentation, and reflection." },

  // 5787 (2026–2027)
  { name: "Rosh Hashanah", date: new Date(2026, 8, 11), region: "jewish", emoji: "🍎", description: "The Jewish New Year (1 Tishri 5787). Shofar is sounded, honey and apple are eaten for a sweet new year. The Days of Awe begin." },
  { name: "Yom Kippur", date: new Date(2026, 8, 20), region: "jewish", emoji: "✡️", description: "Day of Atonement (10 Tishri 5787) — a 25-hour fast, the holiest day of the Jewish year. Final prayers and the closing of the Gates of Repentance." },
  { name: "Sukkot begins", date: new Date(2026, 8, 25), region: "jewish", emoji: "🌿", description: "Feast of Tabernacles (15 Tishri 5787) — seven days dwelling in sukkot, blessing the Four Species." },
  { name: "Simchat Torah", date: new Date(2026, 9, 2), region: "jewish", emoji: "📜", description: "Joy of the Torah — completing and restarting the annual Torah reading cycle with dancing and celebration." },
  { name: "Hanukkah", date: new Date(2026, 11, 4), region: "jewish", emoji: "🕎", description: "Festival of Lights (25 Kislev 5787) — eight nights of candle lighting, celebrating the miracle of Hanukkah." },
  { name: "Tu B'Shvat", date: new Date(2027, 0, 22), region: "jewish", emoji: "🌳", description: "New Year of the Trees (15 Shvat 5787) — celebrating the natural world and eating the seven species." },
  { name: "Purim", date: new Date(2027, 1, 20), region: "jewish", emoji: "🎭", description: "The joyous celebration of Esther's courage and the salvation of the Jewish people. Costumes, Megillah, feasting, and giving." },
  { name: "Passover (Pesach)", date: new Date(2027, 3, 20), region: "jewish", emoji: "🍷", description: "The Feast of Freedom (15 Nisan 5787) — the Exodus from Egypt celebrated over eight days. The Passover Seder retells the story of liberation." },
  { name: "Shavuot", date: new Date(2027, 5, 9), region: "jewish", emoji: "📜", description: "Feast of Weeks (6 Sivan 5787) — the giving of the Torah at Sinai. Torah study through the night, dairy foods, and first-fruits offerings." },
];

// ─── Exports ─────────────────────────────────────────────────────────────────
export const RELIGIOUS_HOLIDAYS: ReligiousHoliday[] = [
  ...US,
  ...MEXICO,
  ...INDIA,
  ...JEWISH,
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getHolidaysForDate(date: Date): ReligiousHoliday[] {
  return RELIGIOUS_HOLIDAYS.filter((h) => isSameDay(h.date, date));
}

export function getHolidaysInRange(
  start: Date,
  end: Date
): ReligiousHoliday[] {
  return RELIGIOUS_HOLIDAYS.filter(
    (h) => h.date >= start && h.date <= end
  ).sort((a, b) => a.date.getTime() - b.date.getTime());
}
