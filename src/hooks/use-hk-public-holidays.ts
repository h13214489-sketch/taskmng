import { useEffect, useMemo, useState } from "react";

import type { Language } from "@/types/models";

type HolidayMap = Record<string, string>;

function storageKey(language: Language) {
  return `taskmng:hk-holidays:${language}:v1`;
}

async function fetchHolidayMap(language: Language) {
  const fileName = language === "zh" ? "zh" : "en";
  const url = `${import.meta.env.BASE_URL}hk-public-holidays/${fileName}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to fetch holidays (${response.status})`);
  }
  const payload = (await response.json()) as { holidays?: HolidayMap };
  return payload.holidays ?? {};
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function useHongKongPublicHolidays(language: Language) {
  const [holidayByDate, setHolidayByDate] = useState<HolidayMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const key = useMemo(() => storageKey(language), [language]);

  useEffect(() => {
    let cancelled = false;

    function setIfActive(map: HolidayMap) {
      if (cancelled) {
        return;
      }
      setHolidayByDate(map);
    }

    async function load() {
      setIsLoading(true);
      try {
        const cachedRaw = window.localStorage.getItem(key);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as { fetchedAt: number; data: HolidayMap };
          if (cached?.data && typeof cached.fetchedAt === "number" && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
            setIfActive(cached.data);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        window.localStorage.removeItem(key);
      }

      try {
        const map = await fetchHolidayMap(language);
        try {
          window.localStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), data: map }));
        } catch {
          window.localStorage.removeItem(key);
        }
        setIfActive(map);
      } catch {
        setIfActive({});
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [key, language]);

  return { holidayByDate, isLoading };
}
