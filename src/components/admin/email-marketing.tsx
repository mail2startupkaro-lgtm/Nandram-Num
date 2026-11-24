'use client';

import * as React from 'react';
import {
  Mail,
  Copy,
  Check,
  Send,
  Eye,
  Code,
  FileText,
  Smartphone,
  Monitor,
  Sparkles,
  Flame,
  Search,
  ExternalLink,
  Tag,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  EMAIL_VARIABLES,
  populateTemplate,
  type EmailTemplate
} from '@/lib/email/marketing-templates';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Badge } from '@/components/ui/misc';
import { api, ApiError } from '@/lib/client/api';
import { cn } from '@/lib/utils';

export interface EmailMarketingAdminProps {
  initialLead?: {
    id?: string;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    dob?: string | null;
    moolank?: number | null;
    bhagyank?: number | null;
  } | null;
  onCloseLeadModal?: () => void;
}

export function EmailMarketingAdmin({ initialLead, onCloseLeadModal }: EmailMarketingAdminProps) {
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');
  const [category, setCategory] = React.useState<string>('all');
  const [search, setSearch] = React.useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplate>(EMAIL_TEMPLATES[0]);
  const [subjectIdx, setSubjectIdx] = React.useState<number>(0);
  const [previewDevice, setPreviewDevice] = React.useState<'desktop' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = React.useState<'render' | 'html' | 'text'>('render');

  // Personalization Variables Form
  const [vars, setVars] = React.useState<Record<string, string>>({
    name: initialLead?.fullName || 'Rahul Sharma',
    moolank: initialLead?.moolank != null ? String(initialLead.moolank) : '7',
    bhagyank: initialLead?.bhagyank != null ? String(initialLead.bhagyank) : '1',
    dob: initialLead?.dob || '16 Oct 1992',
    phone: initialLead?.phone || '+91 98765 43210',
    discountCode: 'LUCKY500',
    consultUrl: `https://www.mynumerologist.com/${EMAIL_TEMPLATES[0].serviceSlug}`,
    whatsappUrl: 'https://wa.me/918819999374?text=Hello%20Acharya%20Ji%2C%20I%20want%20to%20consult%20regarding%20numerology',
  });

  // Sync variables if initialLead is provided
  React.useEffect(() => {
    if (initialLead) {
      setVars((prev) => ({
        ...prev,
        name: initialLead.fullName || prev.name,
        moolank: initialLead.moolank != null ? String(initialLead.moolank) : prev.moolank,
        bhagyank: initialLead.bhagyank != null ? String(initialLead.bhagyank) : prev.bhagyank,
        dob: initialLead.dob || prev.dob,
        phone: initialLead.phone || prev.phone,
      }));
    }
  }, [initialLead]);

  // Update consultUrl when template changes
  React.useEffect(() => {
    setVars((prev) => ({
      ...prev,
      consultUrl: `https://www.mynumerologist.com/${selectedTemplate.serviceSlug}`,
      whatsappUrl: `https://wa.me/918819999374?text=${encodeURIComponent(
        `Hello Acharya Ji, I want to consult for ${selectedTemplate.serviceName.en} (Name: ${vars.name}, Moolank: ${vars.moolank}, Bhagyank: ${vars.bhagyank})`
      )}`,
    }));
    setSubjectIdx(0);
  }, [selectedTemplate]);

  // Copy Feedback state
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Test Email dispatch state
  const [recipientEmail, setRecipientEmail] = React.useState<string>(initialLead?.email || '');
  const [sending, setSending] = React.useState<boolean>(false);
  const [sendResult, setSendResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  const activeContent = lang === 'hi' ? selectedTemplate.hi : selectedTemplate.en;
  const currentSubject = populateTemplate(activeContent.subjectLines[subjectIdx] || activeContent.subjectLines[0], vars);
  const currentHtml = populateTemplate(activeContent.htmlBody, vars);
  const currentText = populateTemplate(activeContent.plainText, vars);

  // Send email function
  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendResult({ ok: false, message: 'Please enter a valid recipient email address.' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await api<{ ok: boolean; message: string }>('/api/admin/email-marketing/send', {
        method: 'POST',
        json: {
          to: recipientEmail,
          subject: currentSubject,
          html: currentHtml,
          text: currentText,
          templateId: selectedTemplate.id,
          leadId: initialLead?.id,
        },
      });
      setSendResult({ ok: true, message: res.message || `Successfully sent to ${recipientEmail}!` });
    } catch (err) {
      setSendResult({
        ok: false,
        message: err instanceof ApiError ? (err.body.error || err.message) : 'Failed to send email. Check credentials in env.',
      });
    } finally {
      setSending(false);
    }
  };

  // Filter templates
  const filteredTemplates = React.useMemo(() => {
    return EMAIL_TEMPLATES.filter((t) => {
      const matchesCat = category === 'all' || t.category.toLowerCase() === category.toLowerCase();
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        t.serviceName.en.toLowerCase().includes(q) ||
        t.serviceName.hi.toLowerCase().includes(q) ||
        t.targetAudience.en.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [category, search]);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'Personal', label: 'Personal Reports' },
    { id: 'Name & Identity', label: 'Name & Mobile' },
    { id: 'Business', label: 'Business & Brand' },
    { id: 'Relationship', label: 'Relationship' },
    { id: 'Lead Nurture', label: 'Lead Nurture Funnels' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-gold" />
              Email Marketing & Lead Generation Templates
            </h2>
            <Badge tone="gold" className="text-xs">
              Services Wise
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Professionally crafted, high-open-rate email campaigns for cold leads, e-book readers, and consultation inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Switcher */}
          <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                lang === 'en' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                lang === 'hi' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              हिंदी (Hindi)
            </button>
          </div>

          {initialLead && onCloseLeadModal && (
            <Button size="sm" variant="outline" onClick={onCloseLeadModal}>
              Close Lead Email
            </Button>
          )}
        </div>
      </div>

      {/* Lead Selected Banner if opened for specific lead */}
      {initialLead && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-400/40 bg-sky-500/10 p-3 text-sm text-sky-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" />
            <span>
              Targeting Lead: <strong>{initialLead.fullName || 'Lead'}</strong> ({initialLead.email || 'No email'}) • Moolank: <strong>{initialLead.moolank ?? '–'}</strong> • Bhagyank: <strong>{initialLead.bhagyank ?? '–'}</strong>
            </span>
          </div>
          <span className="text-xs text-sky-300">Variables auto-populated below</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Selector & Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-all',
                  category === c.id
                    ? 'bg-gold text-primary-foreground font-semibold shadow-sm'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search service templates..."
              className="w-full rounded-lg border border-border/60 bg-card/60 pl-9 pr-3 py-2 text-xs placeholder:text-muted-foreground focus:border-gold/50 focus:outline-none"
            />
          </div>

          {/* Templates List Cards */}
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredTemplates.map((t) => {
              const isSelected = selectedTemplate.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTemplate(t)}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 transition-all',
                    isSelected
                      ? 'border-gold bg-gold/5 shadow-md shadow-gold/5'
                      : 'border-border/60 bg-card/40 hover:border-border hover:bg-card/70'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-foreground">
                          {lang === 'hi' ? t.serviceName.hi : t.serviceName.en}
                        </span>
                        <Badge tone="default" className="text-[10px] py-0 px-1.5">
                          {t.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {lang === 'hi' ? t.targetAudience.hi : t.targetAudience.en}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-gold shrink-0 mt-1.5" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subject Line Picker */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Tested High-Open Subject Lines (Click to Select)
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(currentSubject, 'subject')}
                className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1"
              >
                {copiedKey === 'subject' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                Copy Subject
              </button>
            </div>

            <div className="space-y-2">
              {activeContent.subjectLines.map((subj, idx) => {
                const filledSubj = populateTemplate(subj, vars);
                const isCurrent = subjectIdx === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setSubjectIdx(idx)}
                    className={cn(
                      'cursor-pointer rounded-lg border p-2.5 text-xs transition-all flex items-start gap-2',
                      isCurrent
                        ? 'border-gold bg-gold/10 font-semibold text-foreground'
                        : 'border-border/50 bg-background/50 text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className="text-gold font-bold shrink-0">#{idx + 1}</span>
                    <span className="flex-1">{filledSubj}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merge Variables Form */}
          <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lead Personalization Variables (Live Preview)
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground">Name:</span>
                <input
                  type="text"
                  value={vars.name}
                  onChange={(e) => setVars({ ...vars, name: e.target.value })}
                  className="w-full rounded border border-border/60 bg-background px-2 py-1 text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">DOB:</span>
                <input
                  type="text"
                  value={vars.dob}
                  onChange={(e) => setVars({ ...vars, dob: e.target.value })}
                  className="w-full rounded border border-border/60 bg-background px-2 py-1 text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Moolank:</span>
                <input
                  type="text"
                  value={vars.moolank}
                  onChange={(e) => setVars({ ...vars, moolank: e.target.value })}
                  className="w-full rounded border border-border/60 bg-background px-2 py-1 text-xs"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground">Bhagyank:</span>
                <input
                  type="text"
                  value={vars.bhagyank}
                  onChange={(e) => setVars({ ...vars, bhagyank: e.target.value })}
                  className="w-full rounded border border-border/60 bg-background px-2 py-1 text-xs"
                />
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-muted-foreground">Promo Code:</span>
                <input
                  type="text"
                  value={vars.discountCode}
                  onChange={(e) => setVars({ ...vars, discountCode: e.target.value })}
                  className="w-full rounded border border-border/60 bg-background px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Quick Dispatch / Test Send Box */}
          <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Direct Email Dispatch / Test Sender
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-gold focus:outline-none"
                />
                <Button
                  size="sm"
                  variant="gold"
                  disabled={sending}
                  onClick={handleSendEmail}
                  className="text-xs shrink-0"
                >
                  {sending ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                  Send Now
                </Button>
              </div>

              {sendResult && (
                <div
                  className={cn(
                    'rounded-md p-2 text-xs flex items-start gap-1.5',
                    sendResult.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                  )}
                >
                  {sendResult.ok ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                  <span>{sendResult.message}</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Live Email Preview & Code Exporter (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Preview Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5">
            {/* View Mode Switcher */}
            <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewMode('render')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  previewMode === 'render' ? 'bg-card text-gold shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Eye className="h-3.5 w-3.5" /> Rendered
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('html')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  previewMode === 'html' ? 'bg-card text-gold shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Code className="h-3.5 w-3.5" /> HTML Code
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('text')}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  previewMode === 'text' ? 'bg-card text-gold shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="h-3.5 w-3.5" /> Plain Text
              </button>
            </div>

            {/* Device Switcher (Desktop / Mobile) */}
            {previewMode === 'render' && (
              <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={cn(
                    'rounded-md p-1.5 transition-all',
                    previewDevice === 'desktop' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Desktop Preview (600px)"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={cn(
                    'rounded-md p-1.5 transition-all',
                    previewDevice === 'mobile' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Mobile Preview (380px)"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Copy Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(currentHtml, 'html')}
                className="text-xs h-8"
              >
                {copiedKey === 'html' ? <Check className="h-3 w-3 text-success mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy HTML
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(currentText, 'text')}
                className="text-xs h-8"
              >
                {copiedKey === 'text' ? <Check className="h-3 w-3 text-success mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                Copy Plain Text
              </Button>
            </div>
          </div>

          {/* Email Subject & Preheader Preview Bar */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-3 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Subject:</span>
              <span className="text-sm font-semibold text-foreground">{currentSubject}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">Preheader:</span>
              <span className="text-xs text-muted-foreground">{activeContent.preheader}</span>
            </div>
          </div>

          {/* Main Visual Frame */}
          <div className="rounded-xl border border-border/80 bg-neutral-950 p-4 overflow-hidden flex justify-center min-h-[580px]">
            {previewMode === 'render' && (
              <div
                className={cn(
                  'transition-all duration-300 w-full rounded-xl overflow-hidden shadow-2xl border border-border/40',
                  previewDevice === 'desktop' ? 'max-w-[620px]' : 'max-w-[380px]'
                )}
              >
                <iframe
                  title="Email Preview"
                  srcDoc={currentHtml}
                  className="w-full h-[620px] bg-[#0b0f19] border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}

            {previewMode === 'html' && (
              <div className="w-full h-[620px] overflow-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-emerald-300 leading-relaxed">
                <pre>{currentHtml}</pre>
              </div>
            )}

            {previewMode === 'text' && (
              <div className="w-full h-[620px] overflow-auto rounded-lg bg-neutral-900 p-4 font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {currentText}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
