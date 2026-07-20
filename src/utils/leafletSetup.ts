import L from 'leaflet';

export function ensureLeafletDefaultIcons(): void {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

export const userLocationIcon = new L.DivIcon({
  className: 'user-location-icon',
  html: '<div style="background:#EC4899;color:white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"><span style="transform:rotate(45deg);font-size:14px">📍</span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export const busIcon = new L.DivIcon({
  className: 'bus-map-icon',
  html: '<div style="background:#3B82F6;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)">🚌</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const startTerminalIcon = new L.DivIcon({
  className: 'start-terminal-icon',
  html: '<div style="background:#22C55E;color:white;border-radius:50%;width:24px;height:24px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const endTerminalIcon = new L.DivIcon({
  className: 'end-terminal-icon',
  html: '<div style="background:#EF4444;color:white;border-radius:50%;width:24px;height:24px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const routeTerminalIcon = new L.DivIcon({
  className: 'route-terminal-icon',
  html: '<div style="background:#9CA3AF;color:white;border-radius:50%;width:20px;height:20px;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.25)"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});
