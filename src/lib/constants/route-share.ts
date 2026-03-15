/**
 * Hardcoded route order for share message: Hyderabad Airport → Hyderabad → JBS → Metpally → Korutla
 */
export const ROUTE_ORDER = [
  "Hyderabad Airport",
  "Hyderabad",
  "JBS",
  "Metpally",
  "Korutla",
] as const;

/** Short / display names for share message. Plane built at runtime so it survives encoding. */
const ROUTE_SHORT_NAMES: Record<string, string> = {
  "hyderabad airport": "Airport",
  hyderabad: "Hyd",
  jbs: "JBS",
  metpally: "Metpally",
  korutla: "Korutla",
};

const PLANE = String.fromCodePoint(0x2708);

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

function shortName(city: string): string {
  const key = normalize(city);
  if (key === "hyderabad airport") return ROUTE_SHORT_NAMES[key] + " " + PLANE;
  return ROUTE_SHORT_NAMES[key] ?? city;
}

/**
 * Returns the index of the city in ROUTE_ORDER, or -1 if not on this route.
 */
function indexOnRoute(city: string): number {
  return ROUTE_ORDER.findIndex((c) => normalize(c) === normalize(city));
}

/**
 * Returns "From" and "To" parts for the share message (with short names).
 * e.g. Hyderabad Airport → Korutla => { fromPart: "Airport ✈️, Hyd, JBS", toPart: "Metpally, Korutla" }
 */
export function getRouteShareParts(
  fromCity: string,
  toCity: string
): { fromPart: string; toPart: string } {
  const fromIdx = indexOnRoute(fromCity);
  const toIdx = indexOnRoute(toCity);

  if (fromIdx < 0 || toIdx < 0 || fromIdx >= toIdx) {
    return { fromPart: fromCity, toPart: toCity };
  }

  const stops = ROUTE_ORDER.slice(fromIdx, toIdx + 1) as string[];
  const n = stops.length;

  if (n === 1) {
    return { fromPart: shortName(stops[0]), toPart: shortName(stops[0]) };
  }
  if (n === 2) {
    return { fromPart: shortName(stops[0]), toPart: shortName(stops[1]) };
  }

  const fromStops = stops.slice(0, n - 2).map(shortName).join(", ");
  const toStops = stops.slice(n - 2).map(shortName).join(", ");
  return { fromPart: fromStops, toPart: toStops };
}

/**
 * Builds the route text for WhatsApp share based on from/to selection.
 * - Hyderabad Airport → Korutla: "Hyderabad Airport, Hyderabad, JBS to Metpally, Korutla"
 * - JBS → Korutla: "JBS to Metpally, Korutla"
 * - Hyderabad → Metpally: "Hyderabad, JBS to Metpally"
 */
export function getRouteShareText(fromCity: string, toCity: string): string {
  const fromIdx = indexOnRoute(fromCity);
  const toIdx = indexOnRoute(toCity);

  if (fromIdx < 0 || toIdx < 0 || fromIdx >= toIdx) {
    return `${fromCity} to ${toCity}`;
  }

  const stops = ROUTE_ORDER.slice(fromIdx, toIdx + 1) as string[];
  const n = stops.length;

  if (n === 1) return stops[0];
  if (n === 2) return `${stops[0]} to ${stops[1]}`;

  const firstPart = stops.slice(0, n - 2).join(", ");
  const lastTwo = stops.slice(n - 2).join(", ");
  return `${firstPart} to ${lastTwo}`;
}
