import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Strict privacy rule: Do not send precise user coordinates or sensitive story inputs
  beforeSend(event) {
    if (event.request?.data) {
      try {
        const data = typeof event.request.data === 'string' ? JSON.parse(event.request.data) : event.request.data;
        if (data.latitude || data.longitude) {
          delete data.latitude;
          delete data.longitude;
        }
        event.request.data = data;
      } catch {
        // Ignore JSON parse errors
      }
    }
    return event;
  },
});
