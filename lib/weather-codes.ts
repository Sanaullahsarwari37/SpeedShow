export type WeatherKind = "clear" | "cloud" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export interface WeatherDescription {
  label: string;
  kind: WeatherKind;
}

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function describeWeather(code: number): WeatherDescription {
  switch (code) {
    case 0:
      return { label: "Clear sky", kind: "clear" };
    case 1:
      return { label: "Mainly clear", kind: "clear" };
    case 2:
      return { label: "Partly cloudy", kind: "cloud" };
    case 3:
      return { label: "Overcast", kind: "cloud" };
    case 45:
    case 48:
      return { label: "Fog", kind: "fog" };
    case 51:
    case 53:
    case 55:
      return { label: "Drizzle", kind: "drizzle" };
    case 56:
    case 57:
      return { label: "Freezing drizzle", kind: "drizzle" };
    case 61:
      return { label: "Light rain", kind: "rain" };
    case 63:
      return { label: "Rain", kind: "rain" };
    case 65:
      return { label: "Heavy rain", kind: "rain" };
    case 66:
    case 67:
      return { label: "Freezing rain", kind: "rain" };
    case 71:
      return { label: "Light snow", kind: "snow" };
    case 73:
      return { label: "Snow", kind: "snow" };
    case 75:
      return { label: "Heavy snow", kind: "snow" };
    case 77:
      return { label: "Snow grains", kind: "snow" };
    case 80:
    case 81:
    case 82:
      return { label: "Rain showers", kind: "rain" };
    case 85:
    case 86:
      return { label: "Snow showers", kind: "snow" };
    case 95:
      return { label: "Thunderstorm", kind: "storm" };
    case 96:
    case 99:
      return { label: "Thunderstorm with hail", kind: "storm" };
    default:
      return { label: "Unknown", kind: "cloud" };
  }
}
