'use client';
/** Finger / mouse signature pad (white paper, blue ink). */
import * as React from 'react';
import { Brush, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DrawPad({ onDone, label = 'Use this drawing', clearLabel = 'Clear' }: { onDone: (dataUrl: string) => void; label?: string; clearLabel?: string }) {
  const ref = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const [dirty, setDirty] = React.useState(false);
  const clear = React.useCallback(() => { const c = ref.current!; const x = c.getContext('2d')!; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); setDirty(false); }, []);
  React.useEffect(() => { clear(); }, [clear]);
  const pos = (e: React.PointerEvent) => { const r = ref.current!.getBoundingClientRect(); return [(e.clientX - r.left) * (ref.current!.width / r.width), (e.clientY - r.top) * (ref.current!.height / r.height)]; };
  const down = (e: React.PointerEvent) => { drawing.current = true; ref.current!.setPointerCapture(e.pointerId); const [x, y] = pos(e); const c = ref.current!.getContext('2d')!; c.beginPath(); c.moveTo(x, y); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const [x, y] = pos(e); const c = ref.current!.getContext('2d')!; c.lineWidth = 3.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#1a237e'; c.lineTo(x, y); c.stroke(); setDirty(true); };
  return (
    <div className="space-y-2">
      <canvas ref={ref} width={1000} height={340} onPointerDown={down} onPointerMove={move} onPointerUp={() => (drawing.current = false)} onPointerLeave={() => (drawing.current = false)}
        className="h-40 w-full touch-none rounded-lg border border-gold/40 bg-white sm:h-52" aria-label="Signature drawing pad" />
      <div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={clear}><Eraser className="mr-1 h-4 w-4" />{clearLabel}</Button>
        <Button type="button" size="sm" disabled={!dirty} onClick={() => { onDone(ref.current!.toDataURL('image/png')); clear(); }}><Brush className="mr-1 h-4 w-4" />{label}</Button></div>
    </div>
  );
}

