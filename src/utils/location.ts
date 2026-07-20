export interface LatLng {
  lat: number;
  lng: number;
}

export function normalizeLatLng(value: unknown): LatLng | null {
  if (value == null) return null;

  let loc = value;
  if (typeof loc === 'string') {
    try {
      loc = JSON.parse(loc);
    } catch {
      return null;
    }
  }

  if (typeof loc !== 'object' || loc === null) return null;

  const raw = loc as Record<string, unknown>;
  const latRaw = raw.lat ?? raw.latitude;
  const lngRaw = raw.lng ?? raw.longitude ?? raw.lon;

  const lat =
    typeof latRaw === 'function'
      ? (latRaw as () => number)()
      : typeof latRaw === 'string'
        ? parseFloat(latRaw)
        : latRaw;
  const lng =
    typeof lngRaw === 'function'
      ? (lngRaw as () => number)()
      : typeof lngRaw === 'string'
        ? parseFloat(lngRaw)
        : lngRaw;

  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

export function isValidLatLng(value: LatLng | null | undefined): value is LatLng {
  if (!value) return false;
  return (
    Number.isFinite(value.lat) &&
    Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 &&
    Math.abs(value.lng) <= 180
  );
}
