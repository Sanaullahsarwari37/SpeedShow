/**
 * Sun and moon from orbital formulas, no API needed.
 *  - Sun: the NOAA / Wikipedia "sunrise equation" (accurate to about a minute
 *    outside the polar regions), solved for any sun elevation, so the same code
 *    gives sunrise, golden hour (+6°) and civil twilight (−6°).
 *  - Moon: Meeus' low-precision lunar longitude (main periodic terms), which
 *    puts new and full moon within a few minutes of the published times.
 */

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J2000 = 2451545;
const JD_UNIX = 2440587.5;
const OBLIQUITY = 23.4397 * RAD;

const sin = (deg: number) => Math.sin(deg * RAD);
const cos = (deg: number) => Math.cos(deg * RAD);
const wrap = (deg: number) => ((deg % 360) + 360) % 360;
const toJd = (ms: number) => ms / DAY_MS + JD_UNIX;
const fromJd = (jd: number) => (jd - JD_UNIX) * DAY_MS;

/* ------------------------------------------------------------------ */
/* Sun                                                                 */
/* ------------------------------------------------------------------ */

/** Elevation the sun's centre has at each event (standard refraction + disc for rise/set). */
export const SUN_ELEVATION = { riseSet: -0.833, golden: 6, civil: -6 } as const;

export interface SunDay {
  /** Solar noon, UTC ms. */
  noon: number;
  /** Highest elevation of the day, degrees. */
  peak: number;
  /** Time the sun is at `elevation` going up / going down, UTC ms; null when it never gets there. */
  at: (elevation: number) => { up: number; down: number } | null;
}

/**
 * Sun events for a calendar date at a place. `y-m-d` is the local date;
 * longitude east is positive.
 */
export function sunDay(lat: number, lon: number, y: number, m: number, d: number): SunDay {
  const n = Math.round(toJd(Date.UTC(y, m - 1, d, 12)) - J2000);
  const jStar = n - lon / 360;
  const M = wrap(357.5291 + 0.98560028 * jStar);
  const C = 1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M);
  const lambda = wrap(M + C + 180 + 102.9372);
  const transit = J2000 + jStar + 0.0053 * sin(M) - 0.0069 * sin(2 * lambda);
  const decl = Math.asin(Math.sin(lambda * RAD) * Math.sin(OBLIQUITY));
  const phi = lat * RAD;

  return {
    noon: fromJd(transit),
    peak: 90 - Math.abs(lat - decl / RAD),
    at(elevation) {
      const cosH = (Math.sin(elevation * RAD) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl));
      if (cosH < -1 || cosH > 1) return null;
      const h = Math.acos(cosH) / RAD / 360;
      return { up: fromJd(transit - h), down: fromJd(transit + h) };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Moon                                                                */
/* ------------------------------------------------------------------ */

/** Moon's elongation from the sun along the ecliptic, degrees 0..360 (0 = new, 180 = full). */
function elongation(ms: number): number {
  const d = toJd(ms) - J2000;
  const Ms = wrap(357.5291092 + 0.98560028 * d); // sun mean anomaly
  const sunLon = 280.46646 + 0.98564736 * d + 1.9146 * sin(Ms) + 0.0199 * sin(2 * Ms);
  const L = 218.3164477 + 13.17639648 * d; // moon mean longitude
  const D = wrap(297.8501921 + 12.19074912 * d); // mean elongation
  const Mm = wrap(134.9633964 + 13.06499295 * d); // moon mean anomaly
  const F = wrap(93.272095 + 13.22935024 * d); // argument of latitude
  const moonLon =
    L +
    6.289 * sin(Mm) +
    1.274 * sin(2 * D - Mm) +
    0.658 * sin(2 * D) +
    0.214 * sin(2 * Mm) -
    0.186 * sin(Ms) -
    0.114 * sin(2 * F) +
    0.059 * sin(2 * D - 2 * Mm) +
    0.057 * sin(2 * D - Ms - Mm) +
    0.053 * sin(2 * D + Mm) +
    0.046 * sin(2 * D - Ms) -
    0.041 * sin(Ms - Mm) -
    0.035 * sin(D) -
    0.031 * sin(Ms + Mm);
  return wrap(moonLon - sunLon);
}

/** Next moment after `from` when the elongation reaches `target` degrees. */
function nextElongation(from: number, target: number): number {
  const RATE = 12.190749; // mean degrees per day
  let t = from + (wrap(target - elongation(from)) / RATE) * DAY_MS;
  for (let i = 0; i < 4; i++) {
    const diff = ((elongation(t) - target + 540) % 360) - 180; // signed, −180..180
    t -= (diff / RATE) * DAY_MS;
  }
  return t < from ? nextElongation(from + DAY_MS, target) : t;
}

const PHASES = [
  "New moon",
  "Waxing crescent",
  "First quarter",
  "Waxing gibbous",
  "Full moon",
  "Waning gibbous",
  "Last quarter",
  "Waning crescent",
] as const;

/** Moon phase at a moment: fraction 0..1 (0 = new, 0.5 = full), lit share, name and next new / full moon (UTC ms). */
export function moonPhase(at: number) {
  const e = elongation(at);
  const fraction = e / 360;
  // The four principal phases are instants; name them within about a day either side.
  const nearest = Math.round(fraction * 4) % 4;
  const exact = Math.abs(fraction * 4 - Math.round(fraction * 4)) < 0.135; // ≈ ±1 day
  const name = exact ? PHASES[nearest * 2] : PHASES[Math.floor(fraction * 4) * 2 + 1];
  return {
    fraction,
    name,
    illumination: (1 - cos(e)) / 2,
    nextFull: nextElongation(at, 180),
    nextNew: nextElongation(at, 0),
  };
}

export type MoonPhase = ReturnType<typeof moonPhase>;
