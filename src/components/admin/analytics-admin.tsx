'use client';

import * as React from 'react';
import { Activity, CheckCircle2, ExternalLink, HelpCircle, RefreshCw, Save, Send, ShieldCheck, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { trackEvent } from '@/lib/client/analytics';
import type { AnalyticsSettings } from '@/lib/admin/settings';

export function AnalyticsAdmin() {
  const [settings, setSettings] = React.useState<AnalyticsSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [testStatus, setTestStatus] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ analytics: AnalyticsSettings }>('/api/admin/settings');
      setSettings(res.analytics);
    } catch {
      setMsg({ ok: false, text: 'Failed to load Google Analytics settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      await api('/api/admin/settings', {
        method: 'PUT',
        json: { key: 'analytics', value: settings },
      });
      setMsg({ ok: true, text: 'Google Analytics settings saved successfully!' });
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof ApiError ? (err.body.error || err.message) : 'Failed to save settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEvent = () => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      trackEvent('admin_test_event', {
        source: 'admin_panel',
        timestamp: new Date().toISOString(),
        measurement_id: settings?.measurementId,
      });
      setTestStatus('✅ Test event "admin_test_event" dispatched! Check GA4 Realtime view in ~10 seconds.');
    } else {
      setTestStatus('⚠️ window.gtag is not yet initialized in this browser session. Refresh the page or ensure Measurement ID is saved.');
    }
    setTimeout(() => setTestStatus(null), 8000);
  };

  if (loading) {
    return <div className="glass h-48 animate-pulse rounded-lg p-6" aria-busy="true" />;
  }

  const isConnected = !!(settings?.enabled && settings.measurementId?.trim());

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gradient-to-r from-purple-950/40 via-background to-gold/10 p-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-gold" />
            <h2 className="font-serif text-2xl font-bold">Google Analytics Add-on</h2>
            {isConnected ? (
              <Badge tone="good" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge tone="warn" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> Not Configured
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Manage your Google Analytics 4 (GA4) Measurement ID, Tag Manager container, and automated conversion tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <a
            href="https://analytics.google.com/analytics/web/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-[hsl(250_45%_10%)] transition hover:bg-gold/90"
          >
            Open GA4 Dashboard <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            msg.ok ? 'border-success/30 bg-success/10 text-success' : 'border-danger/30 bg-danger/10 text-danger'
          }`}
          role="status"
        >
          {msg.text}
        </div>
      )}

      {/* Main Settings Form */}
      {settings && (
        <form onSubmit={handleSave} className="glass space-y-6 rounded-xl border border-border/80 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Field
                label="Google Analytics 4 Measurement ID"
                hint="Format: G-XXXXXXXXXX (found in Google Analytics > Admin > Data Streams > Web)"
              >
                <Input
                  placeholder="e.g. G-ABC123XYZ0"
                  value={settings.measurementId}
                  onChange={(e) => setSettings({ ...settings, measurementId: e.target.value.trim() })}
                  className="font-mono text-sm"
                />
              </Field>
            </div>
            <div>
              <Field
                label="Google Tag Manager Container ID"
                hint="Format: GTM-XXXXXXX (found in Google Tag Manager overview)"
              >
                <Input
                  placeholder="e.g. GTM-NPNKXF4B"
                  value={settings.gtmId}
                  onChange={(e) => setSettings({ ...settings, gtmId: e.target.value.trim() })}
                  className="font-mono text-sm"
                />
              </Field>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <h3 className="mb-3 font-semibold text-foreground">Tracking Controls</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Master Analytics Toggle</span>
                  <p className="text-xs text-muted-foreground">Enable or pause all Google tracking across the site</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.trackPageViews}
                  onChange={(e) => setSettings({ ...settings, trackPageViews: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Page Views & Route Changes</span>
                  <p className="text-xs text-muted-foreground">Track dynamic single-page transitions and visits</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.trackReadings}
                  onChange={(e) => setSettings({ ...settings, trackReadings: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Numerology Calculations</span>
                  <p className="text-xs text-muted-foreground">Track generated readings (`reading_generated`)</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.trackPdfDownloads}
                  onChange={(e) => setSettings({ ...settings, trackPdfDownloads: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Report PDF Downloads</span>
                  <p className="text-xs text-muted-foreground">Track report downloads (`pdf_download`)</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.trackCheckouts}
                  onChange={(e) => setSettings({ ...settings, trackCheckouts: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Checkouts & Revenue</span>
                  <p className="text-xs text-muted-foreground">Track e-commerce `begin_checkout` and `purchase`</p>
                </div>
              </label>

              <label className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={settings.trackServices}
                  onChange={(e) => setSettings({ ...settings, trackServices: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
                />
                <div>
                  <span className="font-medium">Service Orders & Intake</span>
                  <p className="text-xs text-muted-foreground">Track consultation bookings (`service_inquiry`)</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/50 pt-4">
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button type="button" variant="outline" onClick={handleSendTestEvent}>
                <Send className="h-4 w-4" /> Send Test Event
              </Button>
            </div>
            {testStatus && <span className="text-xs font-medium text-gold">{testStatus}</span>}
          </div>
        </form>
      )}

      {/* Quick Launch Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a
          href="https://analytics.google.com/analytics/web/#/realtime"
          target="_blank"
          rel="noopener noreferrer"
          className="glass group rounded-xl border border-border/70 p-4 transition hover:border-gold/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">GA4 Realtime View</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">See live visitors, page hits, and recent events right now.</p>
        </a>

        <a
          href="https://analytics.google.com/analytics/web/#/reports/reportinghub"
          target="_blank"
          rel="noopener noreferrer"
          className="glass group rounded-xl border border-border/70 p-4 transition hover:border-gold/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Traffic Acquisition</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Discover where visitors originate (Search, Direct, Social).</p>
        </a>

        <a
          href="https://analytics.google.com/analytics/web/#/events"
          target="_blank"
          rel="noopener noreferrer"
          className="glass group rounded-xl border border-border/70 p-4 transition hover:border-gold/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Conversions & Events</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inspect readings, downloads, and consultation revenue.</p>
        </a>

        <a
          href="https://tagassistant.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="glass group rounded-xl border border-border/70 p-4 transition hover:border-gold/60"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Tag Assistant / Debug</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-gold" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Test tags and view event parameters in Google Tag Assistant.</p>
        </a>
      </div>

      {/* Tracked Events Reference */}
      <div className="glass space-y-3 rounded-xl border border-border/80 p-5">
        <h3 className="flex items-center gap-2 font-serif text-lg font-bold">
          <ShieldCheck className="h-5 w-5 text-gold" /> Automated Event Tracking Reference
        </h3>
        <p className="text-xs text-muted-foreground">
          The following standard events are wired directly into the application and transmitted to your GA4 property when enabled:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground">
                <th className="py-2">Event Name</th>
                <th>Trigger Condition</th>
                <th>Standard Parameters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              <tr>
                <td className="py-2.5 font-semibold text-gold">page_view</td>
                <td className="font-sans text-muted-foreground">Any page load or client-side route navigation</td>
                <td>page_path, page_title</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-gold">reading_generated</td>
                <td className="font-sans text-muted-foreground">Free or Pro numerology reading generated</td>
                <td>moolank, bhagyank, modules, language, tier</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-gold">pdf_download</td>
                <td className="font-sans text-muted-foreground">PDF report downloaded by user or client</td>
                <td>tier, page_count, filename</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-gold">begin_checkout</td>
                <td className="font-sans text-muted-foreground">User initiates checkout for a single report or Pro plan</td>
                <td>currency: 'INR', value, items</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-gold">purchase</td>
                <td className="font-sans text-muted-foreground">Successful Cashfree payment verified</td>
                <td>transaction_id, currency: 'INR', value</td>
              </tr>
              <tr>
                <td className="py-2.5 font-semibold text-gold">service_inquiry</td>
                <td className="font-sans text-muted-foreground">Client begins intake for personalized consultation</td>
                <td>service_code, value, currency: 'INR'</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
