'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GridCellData { number: number; row: number; col: number; count: number; status: 'missing' | 'present' | 'repeated'; planetName?: string }

const statusClass = {
  missing: 'border-dashed border-muted-foreground/40 bg-transparent text-muted-foreground/50',
  present: 'border-gold/60 bg-gold/15',
  repeated: 'border-maroon/70 bg-maroon/20',
};

/** 3×3 grid. `highlight` outlines the numbers of a selected plane; `onSelect` makes cells interactive. */
export function NumberGrid({ cells, size = 'md', highlight = [], selected, onSelect, showPlanet = false, label }: {
  cells: GridCellData[]; size?: 'sm' | 'md'; highlight?: number[]; selected?: number | null; onSelect?: (n: number) => void; showPlanet?: boolean; label: string;
}) {
  const sorted = [...cells].sort((a, b) => a.row - b.row || a.col - b.col);
  return (
    <div role="grid" aria-label={label} className={cn('grid grid-cols-3 gap-1.5', size === 'sm' ? 'w-[132px]' : 'w-full max-w-[340px]')}>
      {sorted.map((c, i) => {
        const hl = highlight.includes(c.number);
        const Comp = onSelect ? motion.button : motion.div;
        return (
          <Comp key={c.number} role="gridcell" type={onSelect ? 'button' : undefined}
            onClick={onSelect ? () => onSelect(c.number) : undefined}
            aria-label={`${c.number}: ${c.status}${c.count > 1 ? ` ×${c.count}` : ''}`}
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
            className={cn(
              'relative grid aspect-square place-items-center rounded-md border-2 transition-shadow',
              statusClass[c.status],
              hl && 'ring-2 ring-gold ring-offset-2 ring-offset-background',
              selected === c.number && 'shadow-[0_0_0_3px_hsl(var(--primary))]',
              onSelect && 'cursor-pointer hover:brightness-110',
            )}>
            <span className={cn('num-badge font-semibold leading-none', size === 'sm' ? 'text-sm' : 'text-2xl sm:text-3xl')}>
              {c.count === 0 ? c.number : String(c.number).repeat(Math.min(c.count, 4))}
            </span>
            {size === 'md' && c.count > 1 && <span className="absolute right-1 top-1 rounded bg-maroon px-1 text-[10px] font-bold text-white">×{c.count}</span>}
            {showPlanet && size === 'md' && c.planetName && <span className="absolute bottom-1 text-[10px] text-muted-foreground">{c.planetName}</span>}
          </Comp>
        );
      })}
    </div>
  );
}

export function GridLegend({ labels }: { labels: { present: string; missing: string; repeated: string } }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-gold/60 bg-gold/15" />{labels.present}</span>
      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-maroon/70 bg-maroon/20" />{labels.repeated}</span>
      <span className="flex items-center gap-1"><i className="h-3 w-3 rounded-sm border-2 border-dashed border-muted-foreground/40" />{labels.missing}</span>
    </div>
  );
}
