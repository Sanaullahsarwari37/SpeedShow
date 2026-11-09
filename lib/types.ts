export interface NetworkInfo {
  ip: string;
  version: 4 | 6 | null;
  isp: string | null;
  org: string | null;
  asn: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  /** Which provider answered. */
  source: string;
  /** VPN / proxy detection. Informational only: the test always runs. */
  vpn: VpnInfo;
}

/** Network details before VPN screening. */
export type RawNetwork = Omit<NetworkInfo, "vpn">;

export interface VpnInfo {
  detected: boolean;
  /** e.g. "VPN", "Proxy", "Hosting / data-centre network". */
  reasons: string[];
}

export interface GeoPlace {
  id: string;
  name: string;
  admin1: string | null;
  country: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export interface WeatherCurrent {
  temp: number; // °C
  feelsLike: number; // °C
  humidity: number; // %
  dewPoint: number | null; // °C
  windKmh: number;
  gustKmh: number | null;
  windDir: number; // degrees
  code: number; // WMO
  isDay: boolean;
  precip: number; // mm
  cloudCover: number; // %
  pressure: number; // hPa
  uv: number | null;
  visibilityM: number | null;
  time: string; // local ISO, e.g. 2026-11-09T17:45
}

export interface WeatherHour {
  time: string;
  temp: number;
  code: number;
  isDay: boolean;
  precipProb: number;
}

export interface WeatherDay {
  date: string;
  code: number;
  max: number;
  min: number;
  precipProb: number;
  precipSum: number;
  uvMax: number | null;
  sunrise: string | null;
  sunset: string | null;
}

export interface AirQuality {
  usAqi: number;
  pm25: number | null;
  pm10: number | null;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbr: string | null;
  utcOffsetSec: number;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  air: AirQuality | null;
  updatedAt: string;
}

export interface SpeedMetrics {
  /** Mbps */
  download: number | null;
  upload: number | null;
  /** Idle round-trip time, ms. */
  latency: number | null;
  jitter: number | null;
  /** Round-trip time while the line is busy (bufferbloat), ms. */
  loadedDown: number | null;
  loadedUp: number | null;
}

export interface SpeedResult extends SpeedMetrics {
  id: string;
  at: number; // epoch ms
  server: string;
  ip?: string;
  isp?: string;
}
