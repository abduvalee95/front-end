/** Shared by Node, Edge and browser Sentry configurations; never import server secrets here. */
const AUTH_PATH = /^\/(?:api\/auth(?:\/|$)|login(?:\/|$)|register(?:\/|$)|verify-email(?:\/|$)|forgot-password(?:\/|$)|reset-password(?:\/|$)|accept-invitation(?:\/|$)|onboarding(?:\/|$))/i;
const SECRET_KEY = /authorization|cookie|password|secret|token|browserbinding|requestbody|postdata|querystring|^(?:code|state|body)$/i;
const OMITTED = '[redacted]';
type Values = Record<string, unknown>;

function record(value: unknown): Values | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Values : null;
}

export function isSensitiveAuthUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  try {
    const candidate = value.match(/https?:\/\/[^\s]+|\/[^\s]*/)?.[0];
    if (!candidate) return false;
    let pathname = new URL(candidate, 'https://telemetry.invalid').pathname;
    for (let i = 0; i < 3; i++) {
      const decoded = decodeURIComponent(pathname);
      if (decoded === pathname) break;
      pathname = decoded;
    }
    return AUTH_PATH.test(pathname.replace(/\\/g, '/'));
  } catch {
    // Malformed auth-like URLs must not bypass telemetry filtering.
    return /\/(?:api\/auth|verify-email|reset-password|accept-invitation)/i.test(value);
  }
}

function scrubString(value: string): string {
  return value.slice(0, 16_384)
    // Strip query/fragment data from URLs, including URLs embedded in messages.
    .replace(/https?:\/\/[^\s"'<>]+|\/(?:[^\s"'<>]*[?#][^\s"'<>]*)/g, url => url.split(/[?#]/, 1)[0])
    .replace(/#token=[^\s"'<>]+/gi, '#[redacted]')
    .replace(/\bBearer\s+[A-Za-z0-9._~-]+/gi, 'Bearer [redacted]');
}

/** Bounded cloning also removes sensitive fields in custom contexts and breadcrumb data. */
function scrub(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (typeof value === 'string') return scrubString(value);
  if (!value || typeof value !== 'object') return value;
  if (depth > 8 || seen.has(value)) return OMITTED;
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, 200).map(item => scrub(item, depth + 1, seen));
  const copy: Values = {};
  for (const [key, item] of Object.entries(value).slice(0, 200)) {
    if (SECRET_KEY.test(key.replace(/[_\-.]/g, ''))) copy[key] = OMITTED;
    else copy[key] = scrub(item, depth + 1, seen);
  }
  return copy;
}

function associatedUrls(value: Values): unknown[] {
  const request = record(value.request);
  const data = record(value.data);
  const trace = record(record(value.contexts)?.trace);
  const traceData = record(trace?.data);
  return [value.transaction, value.url, request?.url, data?.url, data?.from, data?.to,
    data?.['url.full'], data?.['http.url'], data?.['http.target'],
    traceData?.['url.full'], traceData?.['http.url'], traceData?.['http.target']];
}

export function filterAuthBreadcrumb<T extends object>(breadcrumb: T): T | null {
  const fields = breadcrumb as Values;
  if (associatedUrls(fields).some(isSensitiveAuthUrl) || isSensitiveAuthUrl(fields.message)) return null;
  return scrub(breadcrumb) as T;
}

/** Auth requests/pages contain single-use bearer links: omit their events and traces entirely. */
export function filterAuthTelemetry<T extends object>(event: T): T | null {
  const fields = event as Values;
  if (associatedUrls(fields).some(isSensitiveAuthUrl)) return null;
  const safe = scrub(event) as Values;
  const request = record(safe.request);
  if (request) {
    // Bodies and query strings may be strings with no field names to redact.
    delete request.data;
    delete request.query_string;
  }
  if (Array.isArray(fields.breadcrumbs)) {
    safe.breadcrumbs = fields.breadcrumbs.filter(item => record(item) !== null)
      .map(item => filterAuthBreadcrumb(item as object)).filter(item => item !== null);
  }
  if (Array.isArray(fields.spans)) {
    safe.spans = fields.spans.filter(item => {
      const span = record(item);
      return span && !associatedUrls(span).some(isSensitiveAuthUrl) && !isSensitiveAuthUrl(span.description);
    }).map(item => scrub(item));
  }
  return safe as T;
}
