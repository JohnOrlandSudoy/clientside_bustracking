export interface UserGeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type UserLocationSource = 'gps' | 'search' | 'manual' | 'approximate';

export interface RequestLocationOptions {
  /** Force a new GPS reading (no cached position). */
  fresh?: boolean;
  /** Prefer GPS hardware over Wi‑Fi/IP estimate. */
  highAccuracy?: boolean;
}

function readPosition(position: GeolocationPosition): UserGeoLocation {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function getCurrentPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
}

export function isSecureForGeolocation(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function geolocationErrorMessage(error: unknown): string {
  if (error instanceof GeolocationPositionError) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location blocked. Click the lock icon in the address bar → Site settings → Allow Location, then refresh.';
      case error.POSITION_UNAVAILABLE:
        return 'Location unavailable. Turn on Windows Location Services (Settings → Privacy → Location) or set your pickup by dragging the pin on the map.';
      case error.TIMEOUT:
        return 'Location request timed out. Drag the pink pin on the map to your exact pickup spot.';
      default:
        return 'Unable to get your location. Drag the pink pin on the map to correct it.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unable to get your location. Please try again.';
}

export function formatAccuracyMeters(accuracy?: number | null): string | null {
  if (accuracy == null || !Number.isFinite(accuracy)) return null;
  if (accuracy >= 1000) return `±${(accuracy / 1000).toFixed(1)} km`;
  return `±${Math.round(accuracy)} m`;
}

/** Check permission without triggering a location request. */
export async function queryGeolocationPermission(): Promise<PermissionState | 'unsupported'> {
  if (!navigator.permissions) return 'unsupported';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch {
    return 'unsupported';
  }
}

/**
 * One-shot location with a hard application timeout.
 * Default: high-accuracy fresh GPS first (best for pickup), then one low-accuracy fallback.
 */
export function requestUserLocation(options: RequestLocationOptions = {}): Promise<UserGeoLocation> {
  if (!isGeolocationSupported()) {
    return Promise.reject(new Error('Geolocation is not supported by this browser.'));
  }
  if (!isSecureForGeolocation()) {
    return Promise.reject(
      new Error('Location requires HTTPS or open the app at http://localhost:5175 (not a LAN IP like 192.168.x.x).')
    );
  }

  const fresh = options.fresh !== false;
  const preferHighAccuracy = options.highAccuracy !== false;
  const HARD_TIMEOUT_MS = preferHighAccuracy ? 22000 : 15000;

  const primary: PositionOptions = preferHighAccuracy
    ? { enableHighAccuracy: true, timeout: 15000, maximumAge: fresh ? 0 : 30000 }
    : { enableHighAccuracy: false, timeout: 10000, maximumAge: fresh ? 0 : 120000 };

  const fallback: PositionOptions = {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: fresh ? 30000 : 300000,
  };

  return new Promise<UserGeoLocation>((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(hardTimer);
      fn();
    };

    const hardTimer = window.setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            'GPS timed out. Drag the pink pin on the map to your exact pickup point, or tap the map to place it.'
          )
        )
      );
    }, HARD_TIMEOUT_MS);

    getCurrentPosition(primary)
      .then((position) => finish(() => resolve(readPosition(position))))
      .catch((firstError) => {
        if (firstError instanceof GeolocationPositionError && firstError.code === firstError.PERMISSION_DENIED) {
          finish(() => reject(firstError));
          return;
        }
        getCurrentPosition(fallback)
          .then((position) => finish(() => resolve(readPosition(position))))
          .catch((retryError) => finish(() => reject(retryError)));
      });
  });
}

export function watchUserLocation(
  onUpdate: (location: UserGeoLocation) => void,
  onError?: (error: GeolocationPositionError) => void
): number {
  return navigator.geolocation.watchPosition(
    (position) => onUpdate(readPosition(position)),
    (error) => onError?.(error),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

/** Fallback when device GPS is unavailable (e.g. Windows desktop without location services). */
export const APPROXIMATE_DEFAULT_LOCATION: UserGeoLocation = {
  lat: 14.5995,
  lng: 120.9842,
  accuracy: 5000,
};
