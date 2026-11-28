/**
 * Node.js server only: every 5 minutes, deliver purchased-service reports whose 3-hour mark has passed without the
 * numerologist's approval (English + Hindi, then SMS + email). Not used on Vercel (serverless) – there the cron
 * endpoint runs it. Turn it off with AUTO_DELIVERY_TIMER=off.
 */
const g = globalThis as typeof globalThis & { __mnDeliveryTimer?: ReturnType<typeof setInterval> };
if (!process.env.VERCEL && process.env.AUTO_DELIVERY_TIMER !== 'off' && process.env.DATABASE_URL && !g.__mnDeliveryTimer) {
  const tick = () => {
    import('@/lib/server/service-delivery-run')
      .then(({ runDueDeliveries }) => runDueDeliveries({ budgetMs: 280_000 }))
      .catch((e) => console.error('[delivery] timer:', e instanceof Error ? e.message : e));
  };
  g.__mnDeliveryTimer = setInterval(tick, 5 * 60_000);
  setTimeout(tick, 30_000); // first check shortly after start
}
export {};
