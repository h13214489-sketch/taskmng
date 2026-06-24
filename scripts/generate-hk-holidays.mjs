import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseIcsToHolidayMap(rawText) {
  const unfolded = rawText.replace(/\r?\n[ \t]/g, "");
  const result = {};
  const events = unfolded.split("BEGIN:VEVENT").slice(1);

  events.forEach((chunk) => {
    const endIndex = chunk.indexOf("END:VEVENT");
    if (endIndex === -1) {
      return;
    }

    const body = chunk.slice(0, endIndex);
    const dateMatch = body.match(/DTSTART[^:]*:(\d{8})/);
    const summaryMatch = body.match(/SUMMARY[^:]*:(.+)/);
    if (!dateMatch || !summaryMatch) {
      return;
    }

    const yyyymmdd = dateMatch[1];
    const storageDate = `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
    const summary = summaryMatch[1]
      .trim()
      .replace(/\\n/g, "\n")
      .replace(/\\,/g, ",")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");

    if (!result[storageDate]) {
      result[storageDate] = summary;
    }
  });

  return result;
}

async function fetchIcs(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to fetch ${url} (${response.status})`);
  }
  return response.text();
}

const targets = [
  { language: "en", url: "https://www.1823.gov.hk/common/ical/en.ics" },
  { language: "zh", url: "https://www.1823.gov.hk/common/ical/tc.ics" },
];

const outputDir = path.join(process.cwd(), "public", "hk-public-holidays");
await mkdir(outputDir, { recursive: true });

await Promise.all(
  targets.map(async ({ language, url }) => {
    const ics = await fetchIcs(url);
    const holidays = parseIcsToHolidayMap(ics);
    const payload = {
      generatedAt: new Date().toISOString(),
      sourceUrl: url,
      holidays,
    };
    const outPath = path.join(outputDir, `${language}.json`);
    await writeFile(outPath, JSON.stringify(payload), "utf8");
  }),
);

