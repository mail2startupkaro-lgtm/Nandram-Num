/** GST for INR prices that already include 18 % GST. Intra-state → CGST 9 % + SGST 9 %; inter-state → IGST 18 %. */
export const GST_RATE = 0.18;

export interface GstSplit { taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number; gstPaise: number }

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();

export function splitGstInclusive(totalPaise: number, buyerState?: string | null, sellerState?: string | null): GstSplit {
  const taxablePaise = Math.round(totalPaise / (1 + GST_RATE));
  const gstPaise = totalPaise - taxablePaise;
  if (norm(buyerState) && norm(buyerState) === norm(sellerState)) {
    const cgstPaise = Math.floor(gstPaise / 2);
    return { taxablePaise, cgstPaise, sgstPaise: gstPaise - cgstPaise, igstPaise: 0, gstPaise };
  }
  return { taxablePaise, cgstPaise: 0, sgstPaise: 0, igstPaise: gstPaise, gstPaise };
}

/** Indian financial year label (April–March) for a date, in IST. */
export function financialYear(d: Date = new Date()): string {
  const ist = new Date(d.getTime() + 330 * 60_000);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth() + 1;
  const start = m >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
