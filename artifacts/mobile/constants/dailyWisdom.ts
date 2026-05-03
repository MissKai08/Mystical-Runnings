export interface WisdomEntry {
  text: string;
  source: string;
}

export const DAILY_WISDOM: WisdomEntry[] = [
  {
    text: "Iwa pele — gentle character — is the greatest offering you can bring to the world.",
    source: "Ifa Teaching",
  },
  {
    text: "The tree does not call the bird; the fruit does. Tend your inner life and all will come.",
    source: "Yoruba Proverb",
  },
  {
    text: "Ori is the divine guide within. Before any journey, honor the head that leads the way.",
    source: "Odu Ifa",
  },
  {
    text: "Character is what remains when all else has been stripped away. Guard yours with your life.",
    source: "Odu Ogunda Meji",
  },
  {
    text: "The moon does not fight. It waxes, it wanes, and it remains constant through all things.",
    source: "African Wisdom",
  },
  {
    text: "One who speaks truth has Ogun as their bodyguard.",
    source: "Yoruba Proverb",
  },
  {
    text: "What you send into the river will reach the ocean. Choose your offerings carefully.",
    source: "Yoruba Teaching",
  },
  {
    text: "A person who has goodness never truly goes hungry in this world.",
    source: "Odu Ifa",
  },
  {
    text: "Even the night bows to the coming dawn. Trust the cycle.",
    source: "Ifa Wisdom",
  },
  {
    text: "The elder who does not teach the young carries nothing into tomorrow.",
    source: "Yoruba Proverb",
  },
  {
    text: "A river does not forget where it began. Return often to your origin.",
    source: "Yoruba Wisdom",
  },
  {
    text: "Sango's thunder does not warn before it strikes. Act with the same conviction.",
    source: "Orisa Teaching",
  },
  {
    text: "Oshun blesses those who move with sweetness and purpose, not force.",
    source: "Odu Ifa",
  },
  {
    text: "The earth is patient. She receives all seeds, all tears, all footsteps equally.",
    source: "African Wisdom",
  },
  {
    text: "No condition is permanent. The moon herself proves this each night.",
    source: "Yoruba Proverb",
  },
  {
    text: "Obatala teaches: slow down, think clearly, act with purity. These three are the path.",
    source: "Orisa Teaching",
  },
  {
    text: "What you seek is also seeking you. Move toward it with gratitude.",
    source: "Ifa Teaching",
  },
  {
    text: "The masquerade does not reveal itself to everyone. Guard the sacred.",
    source: "Yoruba Proverb",
  },
  {
    text: "Rain does not fall on one roof alone. Share generously in the abundance around you.",
    source: "Yoruba Wisdom",
  },
  {
    text: "When the sun sets, it is not an ending — it is the moon's beginning.",
    source: "African Proverb",
  },
  {
    text: "Esu holds the crossroads. Every choice is a prayer — make yours deliberately.",
    source: "Odu Ifa",
  },
  {
    text: "The river that forgets its source will dry up. Remember what feeds you.",
    source: "Odu Ifa",
  },
  {
    text: "I carry my destiny in my own hands. I will not trade it for another's misfortune.",
    source: "Ifa Affirmation",
  },
  {
    text: "The stars do not compete with each other. They each shine in their own place and time.",
    source: "African Wisdom",
  },
  {
    text: "Your Ori, your inner self, is the closest divinity. Begin there every morning.",
    source: "Odu Ifa",
  },
  {
    text: "Patience is the mother of all virtues. She who waits knows exactly when to move.",
    source: "Yoruba Proverb",
  },
  {
    text: "Ogun clears the path, but you must walk it. Take the first step.",
    source: "Orisa Teaching",
  },
  {
    text: "The one who seeks wisdom at dawn finds gold before sunset.",
    source: "Yoruba Wisdom",
  },
  {
    text: "Darkness is not the enemy of light — it is the place where light is most needed.",
    source: "Ifa Teaching",
  },
  {
    text: "When you pray, pray as though it has already been granted. Faith precedes the miracle.",
    source: "Odu Ifa",
  },
  {
    text: "What the heart desires, the Ori coordinates. Align them both.",
    source: "Ifa Teaching",
  },
  {
    text: "Oya transforms what she touches. She teaches that destruction is just rearrangement.",
    source: "Orisa Teaching",
  },
  {
    text: "The hunter who returns without meat still brought knowledge of the forest.",
    source: "Yoruba Proverb",
  },
  {
    text: "You are not alone in your journey — your ancestors walk ahead of you and beside you.",
    source: "Egungun Teaching",
  },
  {
    text: "Speak life. The tongue is a diviner — what it calls forth has a way of appearing.",
    source: "Ifa Teaching",
  },
  {
    text: "Even the mightiest tree bows in the storm. Flexibility is strength, not weakness.",
    source: "African Proverb",
  },
  {
    text: "Gratitude is the most powerful offering. An open hand receives; a closed fist holds nothing.",
    source: "Odu Ifa",
  },
  {
    text: "A mind at peace is a mind that can hear the whisper of Ifa.",
    source: "Ifa Teaching",
  },
  {
    text: "The ocean does not apologize for its depth. Own who you are, fully and without apology.",
    source: "African Wisdom",
  },
  {
    text: "That which is done in love is never wasted — not even a single drop.",
    source: "Yoruba Wisdom",
  },
  {
    text: "Before asking the Orisa for more, be grateful for the breath in your chest right now.",
    source: "Ifa Teaching",
  },
  {
    text: "The child who is not embraced by the village will burn it down to feel its warmth.",
    source: "African Proverb",
  },
];

export function getDailyWisdom(date: Date): WisdomEntry {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];
}
