import { env } from "../config/env.js";

interface CachedBookings {
  timestamp: number;
  data: any[];
}

let bookingsCache: CachedBookings | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds TTL

export async function fetchCalcomBookings(): Promise<any[]> {
  if (!env.CALCOM_API_KEY) {
    return [];
  }

  const now = Date.now();
  if (bookingsCache && now - bookingsCache.timestamp < CACHE_TTL) {
    console.log(`[Cal.com] Returning cached bookings (age: ${now - bookingsCache.timestamp}ms)`);
    return bookingsCache.data;
  }

  console.log("[Cal.com] Cache miss or expired. Fetching from api.cal.com...");
  const response = await fetch(
    "https://api.cal.com/v2/bookings",
    {
      headers: {
        "Authorization": `Bearer ${env.CALCOM_API_KEY}`,
        "cal-api-version": "2024-08-13",
        "Content-Type": "application/json"
      }
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Cal.com] Failed to fetch live bookings. Status:", response.status, "Error:", errorText);
    
    // If external service fails, return stale cache as a fallback rather than failing the request
    if (bookingsCache) {
      console.warn("[Cal.com] Returning stale cache due to external API failure");
      return bookingsCache.data;
    }
    throw new Error(`Cal.com API returned status ${response.status}: ${errorText}`);
  }

  const json: any = await response.json();
  const dataObj = json.data;
  let bookingsList = [];

  if (Array.isArray(dataObj)) {
    bookingsList = dataObj;
  } else if (dataObj && Array.isArray(dataObj.bookings)) {
    bookingsList = dataObj.bookings;
  } else if (Array.isArray(json.bookings)) {
    bookingsList = json.bookings;
  }

  bookingsCache = {
    timestamp: now,
    data: bookingsList
  };

  return bookingsList;
}

export function invalidateCalcomCache(): void {
  bookingsCache = null;
}
