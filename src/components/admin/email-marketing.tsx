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
  Users,
  Wand2,
  BookOpen,
  MessageCircle,
  Bot
} from 'lucide-react';
import {
  EMAIL_TEMPLATES,
  EMAIL_VARIABLES,
  populateTemplate,
  type EmailTemplate
} from '@/lib/email/marketing-templates';
import { type GeneratedEmailScript } from '@/lib/email/ai-writer';
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
  // Navigation: Curated templates vs AI Script Writer
  const [tabMode, setTabMode] = React.useState<'templates' | 'ai_writer'>(initialLead ? 'ai_writer' : 'templates');

  // Common language state
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');

  // -------------------------------------------------------------
  // 1. Curated Templates State
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 2. AI Custom Script Writer State
  // -------------------------------------------------------------
  const [aiProfile, setAiProfile] = React.useState({
    name: initialLead?.fullName || 'Rahul Sharma',
    dob: initialLead?.dob || '1992-10-16',
    moolank: initialLead?.moolank != null ? String(initialLead.moolank) : '7',
    bhagyank: initialLead?.bhagyank != null ? String(initialLead.bhagyank) : '1',
    profession: 'Software Consultant',
    lifeSituation: 'Facing unexpected career delays and seeking promotion guidance',
    email: initialLead?.email || '',
    phone: initialLead?.phone || '',
  });

  // Sync aiProfile when initialLead changes
  React.useEffect(() => {
    if (initialLead) {
      setAiProfile((prev) => ({
        ...prev,
        name: initialLead.fullName || prev.name,
        dob: initialLead.dob || prev.dob,
        moolank: initialLead.moolank != null ? String(initialLead.moolank) : prev.moolank,
        bhagyank: initialLead.bhagyank != null ? String(initialLead.bhagyank) : prev.bhagyank,
        email: initialLead.email || prev.email,
        phone: initialLead.phone || prev.phone,
      }));
    }
  }, [initialLead]);

  const [aiService, setAiService] = React.useState('Personal Numerology Report');
  const [aiGoal, setAiGoal] = React.useState<'lead_outreach' | 'ebook_nurture' | 'reading_followup' | 'discount_offer' | 're_engagement' | 'crisis_remedy'>('lead_outreach');
  const [aiTone, setAiTone] = React.useState<'warm_spiritual' | 'astrological_expert' | 'urgent_offer' | 'friendly_consultant'>('warm_spiritual');
  const [aiLanguage, setAiLanguage] = React.useState<'en' | 'hi' | 'hinglish'>('en');
  const [aiOffer, setAiOffer] = React.useState('₹500 OFF with code LUCKY500');
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiScript, setAiScript] = React.useState<GeneratedEmailScript | null>(null);
  const [aiSubjectIdx, setAiSubjectIdx] = React.useState(0);
  const [aiError, setAiError] = React.useState<string | null>(null);

  // Generate Custom AI Email Script
  const handleGenerateAi = async () => {
    if (!aiProfile.name.trim()) {
      setAiError('Please enter the client name.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api<{ ok: boolean; script: GeneratedEmailScript }>('/api/admin/email-marketing/ai-generate', {
        method: 'POST',
        json: {
          profile: aiProfile,
          targetService: aiService,
          goal: aiGoal,
          tone: aiTone,
          language: aiLanguage,
          specialOffer: aiOffer,
          consultUrl: 'https://www.mynumerologist.com/services',
          whatsappNumber: '918819999374',
        },
      });
      if (res.ok && res.script) {
        setAiScript(res.script);
        setAiSubjectIdx(0);
      }
    } catch (err) {
      setAiError(err instanceof ApiError ? (err.body.error || err.message) : 'AI generation error.');
    } finally {
      setAiLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Dispatch / Copy Handlers
  // -------------------------------------------------------------
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [recipientEmail, setRecipientEmail] = React.useState<string>(initialLead?.email || '');
  const [sending, setSending] = React.useState<boolean>(false);
  const [sendResult, setSendResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  // Determine active view content
  const isAiView = tabMode === 'ai_writer';
  const activeContent = lang === 'hi' ? selectedTemplate.hi : selectedTemplate.en;

  const currentSubject = isAiView
    ? (aiScript?.subjectLines[aiSubjectIdx] || aiScript?.subjectLines[0] || `Personalized Guidance for ${aiProfile.name}`)
    : populateTemplate(activeContent.subjectLines[subjectIdx] || activeContent.subjectLines[0], vars);

  const currentHtml = isAiView
    ? (aiScript?.htmlBody || '')
    : populateTemplate(activeContent.htmlBody, vars);

  const currentText = isAiView
    ? (aiScript?.plainText || '')
    : populateTemplate(activeContent.plainText, vars);

  const handleSendEmail = async () => {
    const targetEmail = (recipientEmail || aiProfile.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setSendResult({ ok: false, message: 'Please enter a valid recipient email address.' });
      return;
    }
    if (!currentHtml) {
      setSendResult({ ok: false, message: 'No email content available. Please generate or select a template.' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await api<{ ok: boolean; message: string }>('/api/admin/email-marketing/send', {
        method: 'POST',
        json: {
          to: targetEmail,
          subject: currentSubject,
          html: currentHtml,
          text: currentText,
          templateId: isAiView ? 'ai-custom-script' : selectedTemplate.id,
          leadId: initialLead?.id,
        },
      });
      setSendResult({ ok: true, message: res.message || `Successfully sent to ${targetEmail}!` });
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

  const SERVICE_OPTIONS = [
    'Personal Numerology Report',
    'Name Numerology & Correction',
    'Mobile Number Numerology',
    'Business & Brand Name Numerology',
    'Signature Analysis & Correction',
    'Couple & Marriage Compatibility',
    'Baby Name Numerology',
    'Lo Shu Grid & Missing Numbers',
    'Personal Year & Career Timing',
    'Complete Business & Corporate Report',
    'Destiny Matrix Karmic Analysis',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Mail className="h-6 w-6 text-gold" />
              Email Marketing & Lead Generation Studio
            </h2>
            <Badge tone="gold" className="text-xs">
              AI + Services Wise
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate customized AI marketing emails per client profile, or browse tested services templates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Toggle: AI Writer vs Standard Templates */}
          <div className="flex rounded-lg border border-border/70 bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setTabMode('ai_writer')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all',
                tabMode === 'ai_writer'
                  ? 'bg-gradient-to-r from-gold/20 to-amber-500/20 text-gold border border-gold/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Wand2 className="h-3.5 w-3.5 text-gold" />
              ✨ AI Custom Script Writer
            </button>
            <button
              type="button"
              onClick={() => setTabMode('templates')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all',
                tabMode === 'templates'
                  ? 'bg-card text-gold font-bold shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BookOpen className="h-3.5 w-3.5 text-gold" />
              Services Templates
            </button>
          </div>

          {initialLead && onCloseLeadModal && (
            <Button size="sm" variant="outline" onClick={onCloseLeadModal}>
              Close Lead Email
            </Button>
          )}
        </div>
      </div>

      {/* Lead Selected Banner */}
      {initialLead && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-400/40 bg-sky-500/10 p-3 text-sm text-sky-200">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" />
            <span>
              Targeting Lead: <strong>{initialLead.fullName || 'Lead'}</strong> ({initialLead.email || 'No email'}) • Moolank: <strong>{initialLead.moolank ?? '–'}</strong> • Bhagyank: <strong>{initialLead.bhagyank ?? '–'}</strong>
            </span>
          </div>
          <span className="text-xs text-sky-300">Profile data pre-loaded for AI generation</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: AI CUSTOM SCRIPT WRITER PER CLIENT PROFILE                        */}
      {/* ========================================================================= */}
      {tabMode === 'ai_writer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Client Profile & Campaign Setup (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="rounded-xl border border-gold/30 bg-card/60 p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <Bot className="h-4 w-4" />
                  1. Client Profile & Astrological Inputs
                </h3>
                <span className="text-[11px] text-muted-foreground">Gemini AI Model</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-foreground">Client Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Malhotra"
                    value={aiProfile.name}
                    onChange={(e) => setAiProfile({ ...aiProfile, name: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Date of Birth</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD or DD/MM/YYYY"
                    value={aiProfile.dob}
                    onChange={(e) => setAiProfile({ ...aiProfile, dob: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Moolank (Root)</label>
                  <input
                    type="text"
                    placeholder="e.g. 7"
                    value={aiProfile.moolank}
                    onChange={(e) => setAiProfile({ ...aiProfile, moolank: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Bhagyank (Destiny)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={aiProfile.bhagyank}
                    onChange={(e) => setAiProfile({ ...aiProfile, bhagyank: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Profession</label>
                  <input
                    type="text"
                    placeholder="e.g. Real Estate / IT"
                    value={aiProfile.profession}
                    onChange={(e) => setAiProfile({ ...aiProfile, profession: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[11px] font-semibold text-foreground">Life Situation / Pain Point / Inquiry *</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Facing delay in promotions, repeated partnership clashes, or downloaded free e-book last week..."
                    value={aiProfile.lifeSituation}
                    onChange={(e) => setAiProfile({ ...aiProfile, lifeSituation: e.target.value })}
                    className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Campaign Specifications Card */}
            <div className="rounded-xl border border-border/70 bg-card/60 p-4 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                2. Target Service & Campaign Goal
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-foreground">Target Service to Pitch</label>
                  <select
                    value={aiService}
                    onChange={(e) => setAiService(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs focus:border-gold focus:outline-none"
                  >
                    {SERVICE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Campaign Goal</label>
                    <select
                      value={aiGoal}
                      onChange={(e) => setAiGoal(e.target.value as any)}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="lead_outreach">Cold Outreach (New Lead)</option>
                      <option value="ebook_nurture">E-Book Reader Nurture</option>
                      <option value="reading_followup">Free Reading Follow-up</option>
                      <option value="discount_offer">Privilege Discount Offer</option>
                      <option value="crisis_remedy">Life Crisis / Astrological Remedy</option>
                      <option value="re_engagement">Past Lead Re-engagement</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Tone of Voice</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as any)}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="warm_spiritual">Warm & Spiritual (Blessings)</option>
                      <option value="astrological_expert">Authoritative Vedic Expert</option>
                      <option value="urgent_offer">Privilege / Time-Sensitive</option>
                      <option value="friendly_consultant">Direct & Empathetic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Language</label>
                    <select
                      value={aiLanguage}
                      onChange={(e) => setAiLanguage(e.target.value as any)}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <option value="en">English</option>
                      <option value="hi">हिंदी (Devanagari)</option>
                      <option value="hinglish">Hinglish</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Offer / Promo Code</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹500 OFF with LUCKY500"
                      value={aiOffer}
                      onChange={(e) => setAiOffer(e.target.value)}
                      className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {aiError && (
                <div className="rounded p-2 text-xs bg-danger/10 text-danger flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Generate Button */}
              <Button
                variant="gold"
                onClick={handleGenerateAi}
                disabled={aiLoading}
                className="w-full text-xs font-semibold py-2.5 shadow-md shadow-gold/15"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                    Analyzing Profile & Writing Custom Email...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-1.5" />
                    ✨ Generate Custom AI Email Script
                  </>
                )}
              </Button>
            </div>

            {/* Quick Dispatch / Send Box */}
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Dispatch Custom Script to Client
              </h4>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={recipientEmail || aiProfile.email}
                    onChange={(e) => {
                      setRecipientEmail(e.target.value);
                      setAiProfile({ ...aiProfile, email: e.target.value });
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-gold focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={sending || (!aiScript && !currentHtml)}
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

          {/* Right Column: AI Generated Output & Preview (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Subject Lines Selector (If generated) */}
            {aiScript && (
              <div className="rounded-xl border border-gold/40 bg-gold/5 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI Generated High-Open Subject Lines (Click to Select)
                  </label>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentSubject, 'ai_subj')}
                    className="text-xs text-muted-foreground hover:text-gold flex items-center gap-1"
                  >
                    {copiedKey === 'ai_subj' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Subject
                  </button>
                </div>

                <div className="space-y-1.5">
                  {aiScript.subjectLines.map((subj, idx) => (
                    <div
                      key={idx}
                      onClick={() => setAiSubjectIdx(idx)}
                      className={cn(
                        'cursor-pointer rounded-lg border p-2 text-xs transition-all flex items-start gap-2',
                        aiSubjectIdx === idx
                          ? 'border-gold bg-gold/15 font-semibold text-foreground'
                          : 'border-border/60 bg-background/60 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="text-gold font-bold">#{idx + 1}</span>
                      <span className="flex-1">{subj}</span>
                    </div>
                  ))}
                </div>

                {/* Astrological Hook Tag */}
                {aiScript.astrologicalHook && (
                  <div className="mt-2 rounded bg-background/80 border border-border/60 p-2 text-[11.5px] text-muted-foreground">
                    <strong className="text-gold">Astrological Angle:</strong> {aiScript.astrologicalHook}
                  </div>
                )}
              </div>
            )}

            {/* Preview Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-2.5">
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

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(currentHtml, 'ai_html')}
                  className="text-xs h-8"
                  disabled={!currentHtml}
                >
                  {copiedKey === 'ai_html' ? <Check className="h-3 w-3 text-success mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  Copy HTML
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(currentText, 'ai_txt')}
                  className="text-xs h-8"
                  disabled={!currentText}
                >
                  {copiedKey === 'ai_txt' ? <Check className="h-3 w-3 text-success mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  Copy Text
                </Button>
              </div>
            </div>

            {/* Email Visual Preview Window */}
            <div className="rounded-xl border border-border/80 bg-neutral-950 p-4 overflow-hidden flex justify-center min-h-[520px]">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
                  <RefreshCw className="h-8 w-8 text-gold animate-spin" />
                  <p className="text-sm font-semibold text-foreground">Acharya Nandram AI Writer is active...</p>
                  <p className="text-xs max-w-sm">Calculating planetary harmony for {aiProfile.name} and tailoring copy for {aiService}.</p>
                </div>
              ) : !aiScript && !currentHtml ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground space-y-3">
                  <Wand2 className="h-10 w-10 text-gold/50" />
                  <h4 className="text-sm font-semibold text-foreground">No Custom Script Generated Yet</h4>
                  <p className="text-xs max-w-sm">
                    Enter the client profile on the left and click <strong>"Generate Custom AI Email Script"</strong> to create a deeply personalized pitch.
                  </p>
                </div>
              ) : previewMode === 'render' ? (
                <div
                  className={cn(
                    'transition-all duration-300 w-full rounded-xl overflow-hidden shadow-2xl border border-border/40',
                    previewDevice === 'desktop' ? 'max-w-[620px]' : 'max-w-[380px]'
                  )}
                >
                  <iframe
                    title="AI Email Preview"
                    srcDoc={currentHtml}
                    className="w-full h-[600px] bg-[#0b0f19] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : previewMode === 'html' ? (
                <div className="w-full h-[600px] overflow-auto rounded-lg bg-neutral-900 p-4 font-mono text-xs text-emerald-300 leading-relaxed">
                  <pre>{currentHtml}</pre>
                </div>
              ) : (
                <div className="w-full h-[600px] overflow-auto rounded-lg bg-neutral-900 p-4 font-sans text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {currentText}
                </div>
              )}
            </div>

            {/* Bonus: WhatsApp 24-Hour Multi-Channel Followup Box */}
            {aiScript?.whatsappFollowup && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" />
                    Recommended 24-Hour WhatsApp Follow-up Script
                  </h4>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(aiScript.whatsappFollowup, 'wa_follow')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    {copiedKey === 'wa_follow' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy WhatsApp
                  </button>
                </div>
                <p className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded border border-border/60">
                  {aiScript.whatsappFollowup}
                </p>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: STANDARD CURATED SERVICES TEMPLATES                               */}
      {/* ========================================================================= */}
      {tabMode === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Template Selector & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Language Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language:</span>
              <div className="flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                    lang === 'en' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLang('hi')}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-semibold transition-all',
                    lang === 'hi' ? 'bg-card text-gold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

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
      )}

    </div>
  );
}
