'use client';
import * as React from 'react';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Twinkling starfield, shooting stars, drifting nebula, floating digits and a cursor glow – behind every page. */
export function CosmicBackground() {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const glow = React.useRef<HTMLDivElement>(null);
  const [floaters, setFloaters] = React.useState<{ n: number; left: number; size: number; dur: number; delay: number }[]>([]);

  React.useEffect(() => {
    const reduce = reducedMotion();
    if (!reduce) setFloaters(Array.from({ length: 14 }, (_, i) => ({ n: (i % 9) + 1, left: Math.random() * 100, size: 16 + Math.random() * 32, dur: 18 + Math.random() * 22, delay: -Math.random() * 30 })));

    const cv = canvas.current!; const cx = cv.getContext('2d')!;
    let W = 0, H = 0, raf = 0;
    let stars: { x: number; y: number; r: number; t: number; s: number; v: number }[] = [];
    let shoot: { x: number; y: number; l: number } | null = null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
      cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
      const n = Math.min(240, Math.floor((innerWidth * innerHeight) / 6000));
      stars = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.2, t: Math.random() * 6.28, s: Math.random() * 0.02 + 0.005, v: Math.random() * 0.15 }));
    };
    let last = 0;
    const FRAME_MS = 1000 / 30; // a gentle twinkle doesn't need 60–120 fps; halves the CPU/GPU cost on phones
    const draw = (now = 0) => {
      if (!reduce) raf = requestAnimationFrame(draw);
      if (now - last < FRAME_MS && now !== 0) return;
      last = now;
      cx.clearRect(0, 0, W, H);
      const dark = document.documentElement.classList.contains('dark');
      cx.fillStyle = dark ? 'rgb(255,240,200)' : 'rgb(176,125,28)';
      const k = dark ? 1 : 0.55;
      for (const s of stars) {
        s.t += s.s * 2; s.y -= s.v * 2; if (s.y < 0) s.y = H; // ×2: same visual speed at half the frame rate
        cx.globalAlpha = (0.35 + Math.sin(s.t) * 0.35) * k;
        cx.beginPath(); cx.arc(s.x, s.y, s.r * dpr, 0, 6.28); cx.fill();
      }
      cx.globalAlpha = 1;
      if (!shoot && Math.random() < 0.008) shoot = { x: Math.random() * W * 0.7, y: Math.random() * H * 0.3, l: 0 };
      if (shoot) {
        shoot.l += 28 * dpr;
        const x1 = shoot.x + shoot.l, y1 = shoot.y + shoot.l * 0.45;
        const g = cx.createLinearGradient(x1, y1, x1 - 140, y1 - 63);
        g.addColorStop(0, 'rgba(255,227,154,.9)'); g.addColorStop(1, 'rgba(255,227,154,0)');
        cx.strokeStyle = g; cx.lineWidth = 1.6 * dpr; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x1 - 140, y1 - 63); cx.stroke();
        if (shoot.l > W * 0.5) shoot = null;
      }
    };
    size(); draw();
    // Resizing (incl. the mobile URL bar showing/hiding) would rebuild every star on each event – debounce it.
    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(size, 150); };
    addEventListener('resize', onResize, { passive: true });
    // Cursor glow: one style write per frame at most.
    let px = 0, py = 0, pending = false;
    const move = (e: PointerEvent) => {
      px = e.clientX; py = e.clientY;
      if (pending) return; pending = true;
      requestAnimationFrame(() => { pending = false; if (glow.current) glow.current.style.transform = `translate3d(${px}px, ${py}px, 0) translate(-50%, -50%)`; });
    };
    if (!reduce && window.matchMedia('(pointer: fine)').matches) addEventListener('pointermove', move, { passive: true });
    return () => { cancelAnimationFrame(raf); clearTimeout(rt); removeEventListener('resize', onResize); removeEventListener('pointermove', move); };
  }, []);

  return (
    <div aria-hidden>
      <canvas ref={canvas} className="cz-stars" />
      <div className="cz-nebula" />
      <div ref={glow} className="cz-glow" />
      <div className="cz-floaters">
        {floaters.map((f, i) => <span key={i} style={{ left: `${f.left}%`, fontSize: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>{f.n}</span>)}
      </div>
    </div>
  );
}

/** Fades/slides children in when scrolled into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'span' }) {
  const ref = React.useRef<HTMLElement>(null);
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reducedMotion() || !('IntersectionObserver' in window)) { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const Comp = Tag as React.ElementType;
  return <Comp ref={ref} className={`cz-reveal ${shown ? 'cz-in' : ''} ${className}`} style={{ transitionDelay: `${delay}s` }}>{children}</Comp>;
}
