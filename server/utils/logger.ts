type LogContext = Record<string, unknown>;

/**
 * Structured, single-line server-side error log.
 *
 * On Vercel, anything written to stdout/stderr from a serverless/edge function
 * is captured in the project's Runtime Logs, so these calls are what surface
 * homepage/API breakages in the Vercel dashboard.
 */
export function logServerError(scope: string, error: unknown, context?: LogContext) {
  const payload = {
    level: "error",
    scope,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    at: new Date().toISOString(),
    ...context,
  };

  // eslint-disable-next-line no-console
  console.error(`[server:${scope}]`, JSON.stringify(payload));
}
