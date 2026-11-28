'use client';
/** A page crashed while rendering: tell the visitor kindly, offer a retry, and report it to Admin → Website Health. */
import * as React from 'react';
import { reportClientError } from '@/lib/client/error-reporter';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { reportClientError({ message: error.message || 'Page error', stack: error.stack, kind: 'react', digest: error.digest }); }, [error]);
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-semibold text-gold">Something went wrong on this page</h1>
      <p className="max-w-md text-muted-foreground">We have been notified and are looking into it. Please try again – your saved readings and reports are safe.</p>
      <p className="max-w-md text-sm text-muted-foreground">इस पेज पर कुछ गड़बड़ हुई। कृपया दोबारा प्रयास करें – आपकी रिपोर्ट सुरक्षित हैं।</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="rounded-md bg-gold px-4 py-2 font-semibold text-[hsl(250_45%_10%)]">Try again</button>
        <a href="/" className="rounded-md border border-gold/60 px-4 py-2 text-gold">Home</a>
      </div>
    </div>
  );
}
