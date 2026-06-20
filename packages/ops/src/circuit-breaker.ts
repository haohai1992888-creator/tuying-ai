import { logger } from "./logger";

interface BreakerState {
  failures: number;
  openedAt?: number;
}

const states = new Map<string, BreakerState>();

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetMs?: number;
}

/**
 * Circuit breaker — e.g. GPT consecutive failures → open circuit → fallback provider.
 */
export function isCircuitOpen(key: string, options: CircuitBreakerOptions = {}): boolean {
  const threshold = options.failureThreshold ?? Number(process.env.CIRCUIT_FAILURE_THRESHOLD ?? 5);
  const resetMs = options.resetMs ?? Number(process.env.CIRCUIT_RESET_MS ?? 60_000);
  const state = states.get(key);
  if (!state?.openedAt) return false;

  if (Date.now() - state.openedAt >= resetMs) {
    states.set(key, { failures: 0 });
    logger.info("Circuit half-open", { key });
    return false;
  }

  return true;
}

export function recordSuccess(key: string): void {
  states.set(key, { failures: 0 });
}

export function recordFailure(key: string, options: CircuitBreakerOptions = {}): boolean {
  const threshold = options.failureThreshold ?? Number(process.env.CIRCUIT_FAILURE_THRESHOLD ?? 5);
  const state = states.get(key) ?? { failures: 0 };
  state.failures += 1;

  if (state.failures >= threshold) {
    state.openedAt = Date.now();
    logger.warn("Circuit opened", { key, failures: state.failures });
    states.set(key, state);
    return true;
  }

  states.set(key, state);
  return false;
}
