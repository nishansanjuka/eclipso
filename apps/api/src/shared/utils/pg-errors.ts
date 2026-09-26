/**
 * True when `error` (or a wrapped cause, as drizzle nests driver errors) is a
 * Postgres unique-violation, optionally on a specific constraint/index.
 */
export function isUniqueViolation(error: unknown, constraint?: string) {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    const e = current as {
      code?: string;
      constraint?: string;
      cause?: unknown;
    };
    if (e.code === '23505' && (!constraint || e.constraint === constraint)) {
      return true;
    }
    current = e.cause;
  }
  return false;
}
