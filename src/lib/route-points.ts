export type RoutePoint = {
  name: string;
  latitude: number;
  longitude: number;
};

const LOCATION_DETAILS: Record<string, { name: string; coordinates: [number, number] }> = {
  kochi: { name: "Kochi", coordinates: [9.9312, 76.2673] },
  cochin: { name: "Kochi", coordinates: [9.9312, 76.2673] },
  munnar: { name: "Munnar", coordinates: [10.0889, 77.0595] },
  thekkady: { name: "Thekkady", coordinates: [9.6031, 77.1615] },
  alleppey: { name: "Alleppey", coordinates: [9.4981, 76.3388] },
  alappuzha: { name: "Alleppey", coordinates: [9.4981, 76.3388] },
  kumarakom: { name: "Kumarakom", coordinates: [9.6175, 76.4301] },
  marari: { name: "Marari", coordinates: [9.6006, 76.2987] },
  wayanad: { name: "Wayanad", coordinates: [11.6854, 76.132] },
  calicut: { name: "Calicut", coordinates: [11.2588, 75.7804] },
  kozhikode: { name: "Calicut", coordinates: [11.2588, 75.7804] },
  madurai: { name: "Madurai", coordinates: [9.9252, 78.1198] },
  rameswaram: { name: "Rameswaram", coordinates: [9.2876, 79.3129] },
  kanyakumari: { name: "Kanyakumari", coordinates: [8.0883, 77.5385] },
};

function normalizeDestination(destination: string) {
  return destination
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/houseboat|beach|arrival|departure|night|nights/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

export function resolveRoutePoints(destinations: string[]): RoutePoint[] {
  const seen = new Set<string>();
  const points: RoutePoint[] = [];

  for (const destination of destinations) {
    const normalized = normalizeDestination(destination);
    const key = Object.keys(LOCATION_DETAILS).find(
      (candidate) => normalized === candidate || normalized.includes(candidate)
    );
    if (!key) continue;
    const location = LOCATION_DETAILS[key];
    if (seen.has(location.name)) continue;
    seen.add(location.name);
    const [latitude, longitude] = location.coordinates;
    points.push({ name: location.name, latitude, longitude });
  }

  return points;
}
