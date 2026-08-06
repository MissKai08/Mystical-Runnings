import { useState, useEffect } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SunCalc from "suncalc";

const LOCATION_KEY = "@mystical_cached_location_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const USNO_RSTT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedLocation {
  latitude: number;
  longitude: number;
  cityName: string | null;
  savedAt: number;
}

export interface SunMoonTimes {
  sunrise: Date | null;
  sunset: Date | null;
  moonrise: Date | null;
  moonset: Date | null;
  cityName: string | null;
}

type Status = "idle" | "loading" | "denied" | "ready";

interface UseSunMoonResult {
  times: SunMoonTimes | null;
  status: Status;
  retry: () => void;
}

async function loadCachedLocation(): Promise<CachedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLocation;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function saveLocation(loc: CachedLocation): Promise<void> {
  await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
}

async function fetchLocation(): Promise<CachedLocation | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return null;

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  let cityName: string | null = null;
  try {
    const geo = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    if (geo.length > 0) {
      cityName = geo[0].city ?? geo[0].subregion ?? geo[0].region ?? null;
    }
  } catch {
    // geocoding optional
  }

  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    cityName,
    savedAt: Date.now(),
  };
}

/** SunCalc fallback — always synchronous and works offline */
function computeTimesSunCalc(loc: CachedLocation, date: Date): SunMoonTimes {
  const sunTimes = SunCalc.getTimes(date, loc.latitude, loc.longitude);
  const moonTimes = SunCalc.getMoonTimes(date, loc.latitude, loc.longitude);

  return {
    sunrise: sunTimes.sunrise instanceof Date && isFinite(sunTimes.sunrise.getTime()) ? sunTimes.sunrise : null,
    sunset: sunTimes.sunset instanceof Date && isFinite(sunTimes.sunset.getTime()) ? sunTimes.sunset : null,
    moonrise: moonTimes.rise instanceof Date && isFinite(moonTimes.rise.getTime()) ? moonTimes.rise : null,
    moonset: moonTimes.set instanceof Date && isFinite(moonTimes.set.getTime()) ? moonTimes.set : null,
    cityName: loc.cityName,
  };
}

interface UsnoRsttData {
  sunrise: string | null;
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
}
interface UsnoRsttCache {
  data: UsnoRsttData;
  savedAt: number;
}

function parseUsnoTime(timeStr: string | null, date: Date): Date | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Fetch sun/moon rise-set times from USNO; returns null on any failure */
async function fetchUsnoTimes(loc: CachedLocation, date: Date): Promise<SunMoonTimes | null> {
  try {
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
    const tzOffset = -date.getTimezoneOffset() / 60;
    const cacheKey = `@usno_rstt_${dateStr}_${loc.latitude.toFixed(2)}_${loc.longitude.toFixed(2)}`;

    // Check AsyncStorage cache first
    const cachedRaw = await AsyncStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw) as UsnoRsttCache;
      if (Date.now() - cached.savedAt < USNO_RSTT_TTL_MS) {
        return {
          sunrise: parseUsnoTime(cached.data.sunrise, date),
          sunset: parseUsnoTime(cached.data.sunset, date),
          moonrise: parseUsnoTime(cached.data.moonrise, date),
          moonset: parseUsnoTime(cached.data.moonset, date),
          cityName: loc.cityName,
        };
      }
    }

    // Fetch from USNO API
    const url = `https://aa.usno.navy.mil/api/rstt/oneday?date=${dateStr}&coords=${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}&tz=${tzOffset}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const json = (await resp.json()) as {
      properties?: { data?: { sundata?: { phen: string; time: string }[]; moondata?: { phen: string; time: string }[] } };
    };

    const sundata = json?.properties?.data?.sundata ?? [];
    const moondata = json?.properties?.data?.moondata ?? [];

    const findTime = (arr: { phen: string; time: string }[], phen: string): string | null =>
      arr.find((e) => e.phen === phen)?.time ?? null;

    const data: UsnoRsttData = {
      sunrise: findTime(sundata, "Rise"),
      sunset: findTime(sundata, "Set"),
      moonrise: findTime(moondata, "Rise"),
      moonset: findTime(moondata, "Set"),
    };

    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, savedAt: Date.now() }));

    const result: SunMoonTimes = {
      sunrise: parseUsnoTime(data.sunrise, date),
      sunset: parseUsnoTime(data.sunset, date),
      moonrise: parseUsnoTime(data.moonrise, date),
      moonset: parseUsnoTime(data.moonset, date),
      cityName: loc.cityName,
    };

    // If all four times are null the response was malformed — fall back to SunCalc
    if (!result.sunrise && !result.sunset && !result.moonrise && !result.moonset) {
      return null;
    }

    return result;
  } catch {
    return null;
  }
}

export function useSunMoon(date: Date): UseSunMoonResult {
  const [times, setTimes] = useState<SunMoonTimes | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    (async () => {
      // Try cache first
      let loc = await loadCachedLocation();

      if (!loc) {
        loc = await fetchLocation();
        if (!loc) {
          if (!cancelled) setStatus("denied");
          return;
        }
        await saveLocation(loc);
      }

      if (cancelled) return;

      // Primary: USNO API (most accurate)
      const usnoResult = await fetchUsnoTimes(loc, date);
      if (!cancelled) {
        if (usnoResult) {
          setTimes(usnoResult);
        } else {
          // Fallback: SunCalc (works offline)
          setTimes(computeTimesSunCalc(loc, date));
        }
        setStatus("ready");
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date.toDateString(), tick]);

  return {
    times,
    status,
    retry: () => setTick((t) => t + 1),
  };
}
