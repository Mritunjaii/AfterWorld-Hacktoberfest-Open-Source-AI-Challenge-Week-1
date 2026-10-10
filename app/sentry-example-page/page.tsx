'use client';

import * as Sentry from '@sentry/nextjs';

export default function SentryExamplePage() {
  const triggerError = () => {
    try {
      throw new Error('Test Sentry verification error from AFTERWORLD portal');
    } catch (error) {
      Sentry.captureException(error);
      alert('Verification error captured and sent to Sentry!');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white border border-[#e8e5de] rounded-2xl text-center space-y-4 my-12">
      <h1 className="editorial-serif text-2xl text-[#1c1c1a]">Sentry Verification</h1>
      <p className="text-xs text-[#73716b]">
        Click the button below to send a sanitized test event to verify your Sentry configuration.
      </p>
      <button
        onClick={triggerError}
        className="px-4 py-2.5 bg-[#2e6059] text-white rounded-lg text-sm font-medium hover:bg-[#254f49] transition-colors"
      >
        Trigger Test Event
      </button>
    </div>
  );
}
