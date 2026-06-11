import { useState, useEffect } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SunCalc from "suncalc";

const LOCATION_KEY = "@mystical_cached_location_v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

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

function computeTimes(loc: CachedLocation, date: Date): SunMoonTimes {
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

      if (!cancelled) {
        setTimes(computeTimes(loc, date));
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
