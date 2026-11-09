"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared, boundary-aligned tickers. Every component asking for the same
 * period shares one timer, and a component only re-renders as often as it
 * needs: clocks tick per second, the sun position per minute.
 * Returns null during server render / hydration.
 */
type Ticker = { now: number; listeners: Set<() => void>; timer?: ReturnType<typeof setTimeout> };
const tickers = new Map<number, Ticker>();

function ticker(period: number): Ticker {
  let t = tickers.get(period);
  if (!t) {
    t = { now: Date.now(), listeners: new Set() };
    tickers.set(period, t);
  }
  return t;
}

function schedule(period: number, t: Ticker) {
  const now = Date.now();
  t.timer = setTimeout(() => {
    t.now = Date.now();
    t.listeners.forEach((l) => l());
    schedule(period, t);
  }, period - (now % period) + 5);
}

const subscribers = new Map<number, (l: () => void) => () => void>();
function subscribeFor(period: number) {
  let sub = subscribers.get(period);
  if (!sub) {
    sub = (listener) => {
      const t = ticker(period);
      t.listeners.add(listener);
      if (!t.timer) {
        t.now = Date.now();
        schedule(period, t);
      }
      return () => {
        t.listeners.delete(listener);
        if (!t.listeners.size && t.timer) {
          clearTimeout(t.timer);
          t.timer = undefined;
        }
      };
    };
    subscribers.set(period, sub);
  }
  return sub;
}

const getServer = () => null;

export function useNow(period: 1000 | 60_000 = 1000): number | null {
  return useSyncExternalStore(subscribeFor(period), () => ticker(period).now, getServer);
}
