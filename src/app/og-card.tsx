/** Shared design for Open Graph / social share images (1200×630). */
export const OG_SIZE = { width: 1200, height: 630 };

export function OgCard({ kicker, title, sub, big }: { kicker: string; title: string; sub: string; big?: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg,#2a0e1b 0%,#140f2b 55%,#24130a 100%)', color: '#fff', fontFamily: 'Georgia, serif', padding: 64, position: 'relative' }}>
      <div style={{ position: 'absolute', right: -120, top: -120, width: 520, height: 520, borderRadius: 9999, border: '3px dashed rgba(234,179,8,0.45)', display: 'flex' }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: big ? 680 : '100%' }}>
        <div style={{ display: 'flex', fontSize: 30, color: '#fbbf24', letterSpacing: 6, textTransform: 'uppercase' }}>{kicker}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: title.length > 40 ? 58 : 72, fontWeight: 700, lineHeight: 1.1, color: '#fde68a' }}>{title}</div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 20, color: '#e5dccb', lineHeight: 1.35 }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, color: '#e5dccb' }}>
          <div style={{ display: 'flex', width: 56, height: 56, borderRadius: 9999, border: '2px solid #fbbf24', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', marginRight: 16, fontSize: 24 }}>AN</div>
          Acharya Nandram · 15+ years · myNumerologist.com
        </div>
      </div>
      {big && <div style={{ display: 'flex', position: 'absolute', right: 70, top: 155, width: 320, height: 320, borderRadius: 9999, border: '4px solid #fbbf24', alignItems: 'center', justifyContent: 'center', fontSize: big.length > 3 ? 96 : 130, fontWeight: 700, color: '#fde68a', background: 'rgba(0,0,0,0.25)' }}>{big}</div>}
    </div>
  );
}
