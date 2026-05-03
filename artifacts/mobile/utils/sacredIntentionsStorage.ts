import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@mystical_sacred_intentions_v1";

export interface CheckIn {
  id: string;
  text: string;
  createdAt: number;
}

export type IntentionStatus = "active" | "complete" | "released";

export interface SacredIntention {
  id: string;
  text: string;
  cycleKey: string;
  cycleName: string;
  status: IntentionStatus;
  checkIns: CheckIn[];
  createdAt: number;
}

async function load(): Promise<SacredIntention[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function save(intentions: SacredIntention[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(intentions));
}

export async function loadIntentions(): Promise<SacredIntention[]> {
  return load();
}

export async function addIntention(
  text: string,
  cycleKey: string,
  cycleName: string
): Promise<SacredIntention> {
  const intentions = await load();
  const intention: SacredIntention = {
    id: `intention-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    cycleKey,
    cycleName,
    status: "active",
    checkIns: [],
    createdAt: Date.now(),
  };
  intentions.unshift(intention);
  await save(intentions);
  return intention;
}

export async function addCheckIn(
  intentionId: string,
  text: string
): Promise<void> {
  const intentions = await load();
  const idx = intentions.findIndex((i) => i.id === intentionId);
  if (idx === -1) return;
  const checkIn: CheckIn = {
    id: `checkin-${Date.now()}`,
    text: text.trim(),
    createdAt: Date.now(),
  };
  intentions[idx].checkIns.push(checkIn);
  await save(intentions);
}

export async function updateStatus(
  intentionId: string,
  status: IntentionStatus
): Promise<void> {
  const intentions = await load();
  const idx = intentions.findIndex((i) => i.id === intentionId);
  if (idx === -1) return;
  intentions[idx].status = status;
  await save(intentions);
}

export async function deleteIntentionById(intentionId: string): Promise<void> {
  const intentions = await load();
  await save(intentions.filter((i) => i.id !== intentionId));
}
