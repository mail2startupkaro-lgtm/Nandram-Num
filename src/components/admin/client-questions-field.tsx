'use client';
/**
 * "Client's questions & problems" box for every admin report generator. Filled from the booking (questions +
 * problems / challenges); each question is answered from the client's numbers in a "Your Questions Answered"
 * section of the report.
 */
import { MessageCircleQuestion } from 'lucide-react';
import { api } from '@/lib/client/api';
import type { QA } from '@/lib/report/client-questions';

export const orderQuestions = (d: Record<string, string | undefined> | undefined) => [d?.questions, d?.challenges].map((x) => x?.trim()).filter(Boolean).join('\n');

export function ClientQuestionsField({ value, onChange, id = 'client-questions' }: { value: string; onChange: (v: string) => void; id?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium"><MessageCircleQuestion className="h-4 w-4 text-gold" />Client&apos;s questions &amp; problems <span className="font-normal text-muted-foreground">(each one is answered in the report)</span></label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} maxLength={3000} rows={3}
        placeholder={'One question per line, e.g.\nWhen will I get married?\nShould I change my job this year?'}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}

/** Answers for reports printed in the browser (Destiny Matrix, birth chart, Business reports). Never blocks printing. */
export async function fetchAnswers(b: { questions: string; name?: string; dob: string; gender?: string; lang: 'en' | 'hi' }): Promise<QA[]> {
  if (!b.questions.trim() || !b.dob) return [];
  try { return (await api<{ qa: QA[] }>('/api/admin/client-questions', { method: 'POST', json: b })).qa; } catch { return []; }
}
