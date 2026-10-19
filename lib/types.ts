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
  /** Which provider answered (for transparency/debugging). */
  source: string;
  /** VPN / proxy screening result. `blocked` shows the security page. */
  risk: NetworkRisk;
}

/** Network details before VPN screening is applied. */
export type RawNetwork = Omit<NetworkInfo, "risk">;

export interface NetworkRisk {
  blocked: boolean;
  /** Human readable reasons, e.g. "VPN", "Proxy", "Tor exit node", "Hosting network". */
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
  windKmh: number;
  windDir: number; // degrees
  code: number; // WMO
  isDay: boolean;
  precip: number; // mm
  cloudCover: number; // %
  pressure: number; // hPa
  time: string;
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
  sunrise: string | null;
  sunset: string | null;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  timezone: string;
  current: WeatherCurrent;
  hourly: WeatherHour[];
  daily: WeatherDay[];
  updatedAt: string;
}

export interface SpeedResult {
  id: string;
  at: number; // epoch ms
  download: number; // Mbps
  upload: number; // Mbps
  server: string;
  /** Minimum RTT in ms. */
  latency?: number | null;
  /** Jitter (std-dev of RTTs) in ms. */
  jitter?: number | null;
  ip?: string;
  isp?: string;
}
