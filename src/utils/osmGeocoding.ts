import { PH_PHOTON_BBOX } from '../constants/map';

export interface GeocodeSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
  formattedAddress: string;
}

const USER_AGENT = 'AuroRide/1.0 (passenger tracker)';

function formatPhotonLabel(properties: Record<string, string | undefined>): string {
  const parts = [
    properties.name,
    properties.street,
    properties.city || properties.town || properties.village || properties.suburb,
    properties.state,
    properties.country,
  ].filter(Boolean);
  return parts.join(', ');
}

async function searchPhoton(query: string): Promise<GeocodeSuggestion[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '8');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('bbox', PH_PHOTON_BBOX);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Photon error ${res.status}`);

  const data = (await res.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: Record<string, string | undefined>;
    }>;
  };

  return (data.features ?? [])
    .map((feature) => {
      const coords = feature.geometry?.coordinates;
      if (!coords || coords.length < 2) return null;
      const [lng, lat] = coords;
      const props = feature.properties ?? {};
      const label = formatPhotonLabel(props) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const id =
        props.osm_type && props.osm_id
          ? `osm:${props.osm_type}:${props.osm_id}`
          : `photon:${lat},${lng}`;
      return {
        id,
        label,
        lat,
        lng,
        formattedAddress: label,
      };
    })
    .filter((item): item is GeocodeSuggestion => item !== null);
}

async function searchNominatim(query: string): Promise<GeocodeSuggestion[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '8');
  url.searchParams.set('countrycodes', 'ph');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

  const data = (await res.json()) as Array<{
    place_id?: number;
    lat?: string;
    lon?: string;
    display_name?: string;
  }>;

  return data
    .map((item) => {
      const lat = item.lat ? parseFloat(item.lat) : NaN;
      const lng = item.lon ? parseFloat(item.lon) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const label = item.display_name || `${lat}, ${lng}`;
      return {
        id: item.place_id != null ? `nominatim:${item.place_id}` : `nominatim:${lat},${lng}`,
        label,
        lat,
        lng,
        formattedAddress: label,
      };
    })
    .filter((item): item is GeocodeSuggestion => item !== null);
}

/** Photon first, Nominatim fallback — free address search for pickup */
export async function searchAddresses(query: string): Promise<GeocodeSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const photonResults = await searchPhoton(trimmed);
    if (photonResults.length > 0) return photonResults;
  } catch (err) {
    console.warn('Photon search failed, falling back to Nominatim:', err);
  }

  return searchNominatim(trimmed);
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '18');
  url.searchParams.set('addressdetails', '1');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': USER_AGENT,
    },
  });

  if (!res.ok) {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  const data = (await res.json()) as { display_name?: string };
  return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
