'use client';
/** Last-resort error screen (the whole layout failed). Reports the error to Admin → Website Health. */
import * as React from 'react';
import { reportClientError } from '@/lib/client/error-reporter';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => { reportClientError({ message: error.message || 'Site error', stack: error.stack, kind: 'react', digest: error.digest }); }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Georgia, serif', background: '#140c1c', color: '#f5e9c8', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <h1 style={{ color: '#d4af37' }}>myNumerologist.com</h1>
          <p>Something went wrong. Please try again in a moment.</p>
          <p>कुछ गड़बड़ हुई। कृपया थोड़ी देर बाद दोबारा प्रयास करें।</p>
          <button type="button" onClick={() => reset()} style={{ marginTop: 12, padding: '10px 18px', background: '#d4af37', border: 0, borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
