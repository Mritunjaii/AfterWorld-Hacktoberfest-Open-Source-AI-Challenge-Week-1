import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Scrub user IP or coordinates from telemetry
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
