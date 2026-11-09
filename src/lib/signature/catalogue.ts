/**
 * Signature-analysis knowledge: the visual features an expert (or the AI agent) observes,
 * what each option traditionally indicates, and profession ↔ number affinities.
 * Interpretations follow common graphology and Indian numerology practice; they are guidance, not diagnosis.
 */

export type Impact = 'positive' | 'neutral' | 'watch';
export interface FeatureOption { id: string; label: string; meaning: string; impact: Impact; fix?: string }
export interface Feature { id: string; label: string; options: FeatureOption[] }

export const FEATURES: Feature[] = [
  { id: 'baseline', label: 'Baseline direction', options: [
    { id: 'rising', label: 'Rising upward', meaning: 'Optimism, ambition and a forward-looking attitude; traditionally linked with growth and progress.', impact: 'positive' },
    { id: 'straight', label: 'Straight', meaning: 'Emotional steadiness, self-control and a practical approach.', impact: 'neutral' },
    { id: 'falling', label: 'Falling downward', meaning: 'Tiredness, discouragement or pressure; in Indian practice a falling signature is believed to pull results down.', impact: 'watch', fix: 'Practise signing so the line rises gently (about 10–20°) from left to right.' },
    { id: 'wavy', label: 'Wavy / uneven', meaning: 'Changeable moods and inconsistent energy; ideas may start well but lose momentum.', impact: 'watch', fix: 'Sign slowly on a ruled line until the baseline becomes steady and slightly rising.' },
  ] },
  { id: 'slant', label: 'Slant of letters', options: [
    { id: 'right', label: 'Right slant', meaning: 'Warm, outgoing and expressive; moves towards people and the future.', impact: 'positive' },
    { id: 'upright', label: 'Upright', meaning: 'Head rules heart: balanced, independent and composed.', impact: 'neutral' },
    { id: 'left', label: 'Left slant', meaning: 'Reserved and self-protective; may hold back feelings or dwell on the past.', impact: 'watch', fix: 'Allow a slight forward (right) slant to open up communication and opportunity.' },
    { id: 'mixed', label: 'Mixed slant', meaning: 'Versatile but sometimes conflicted or unpredictable in reactions.', impact: 'watch', fix: 'Choose one consistent slant, ideally slightly to the right.' },
  ] },
  { id: 'size', label: 'Size', options: [
    { id: 'large', label: 'Large', meaning: 'Confidence, visibility and a wish to be recognised.', impact: 'positive' },
    { id: 'medium', label: 'Medium', meaning: 'Balanced self-image and adaptability.', impact: 'neutral' },
    { id: 'small', label: 'Small / cramped', meaning: 'Modesty, concentration and attention to detail; can indicate holding back.', impact: 'watch', fix: 'Increase the size a little, especially of the first letter.' },
  ] },
  { id: 'first', label: 'First letter', options: [
    { id: 'bold', label: 'Bold and prominent', meaning: 'Strong self-esteem and initiative; in Indian practice a clear first letter strengthens the name number.', impact: 'positive' },
    { id: 'proportionate', label: 'Proportionate', meaning: 'Healthy, balanced self-image.', impact: 'neutral' },
    { id: 'small', label: 'Small or unclear', meaning: 'Under-valuing oneself; achievements may not get due credit.', impact: 'watch', fix: 'Make the first letter of the name larger and clearly readable.' },
  ] },
  { id: 'legibility', label: 'Legibility', options: [
    { id: 'clear', label: 'Clear and readable', meaning: 'Openness, transparency and straightforward communication.', impact: 'positive' },
    { id: 'partial', label: 'Partly readable', meaning: 'Shares selectively; keeps some privacy.', impact: 'neutral' },
    { id: 'illegible', label: 'Illegible scribble', meaning: 'Hurry, privacy or a gap between public image and inner self; others may misunderstand intentions.', impact: 'watch', fix: 'Keep at least the first name or initials readable.' },
  ] },
  { id: 'pressure', label: 'Pen pressure', options: [
    { id: 'heavy', label: 'Heavy', meaning: 'Strong will, energy and intensity; can also show stress.', impact: 'neutral' },
    { id: 'medium', label: 'Medium', meaning: 'Healthy energy and balanced reactions.', impact: 'positive' },
    { id: 'light', label: 'Light', meaning: 'Sensitivity and gentleness; energy may need support.', impact: 'neutral' },
  ] },
  { id: 'underline', label: 'Underline', options: [
    { id: 'none', label: 'No underline', meaning: 'Lets work speak for itself; no need for emphasis.', impact: 'neutral' },
    { id: 'single', label: 'Single clean underline', meaning: 'Self-confidence and a stable base of support.', impact: 'positive' },
    { id: 'double', label: 'Double or heavy underline', meaning: 'Strong need for recognition and security.', impact: 'neutral' },
    { id: 'through', label: 'Line cuts through the name', meaning: 'Traditionally considered unfavourable: self-criticism or blocking one’s own progress.', impact: 'watch', fix: 'Keep any underline below the name; never let a stroke cut through the letters.' },
  ] },
  { id: 'ending', label: 'Ending stroke', options: [
    { id: 'upward', label: 'Ends upward', meaning: 'Ambition and positive expectation for the future.', impact: 'positive' },
    { id: 'flat', label: 'Ends flat', meaning: 'Steady, completes tasks calmly.', impact: 'neutral' },
    { id: 'downward', label: 'Ends downward / hooks back', meaning: 'Pessimism or ending tasks with fatigue; Indian practice advises against a falling end.', impact: 'watch', fix: 'Finish the signature with a light upward stroke.' },
  ] },
  { id: 'dots', label: 'Dots and full stops', options: [
    { id: 'none', label: 'None', meaning: 'Flowing, open-ended nature.', impact: 'neutral' },
    { id: 'end', label: 'Full stop at the end', meaning: 'Caution and a tendency to close conversations; in Indian practice believed to stop flow.', impact: 'watch', fix: 'Avoid a full stop after the signature.' },
    { id: 'two', label: 'Two dots below', meaning: 'Commonly used as a positive support symbol in Indian signature correction.', impact: 'positive' },
  ] },
  { id: 'spacing', label: 'Connection between name parts', options: [
    { id: 'connected', label: 'Connected / flowing', meaning: 'Logical, continuous thinking and good follow-through.', impact: 'positive' },
    { id: 'gaps', label: 'Clear gaps between words', meaning: 'Independent thinking and clear boundaries.', impact: 'neutral' },
    { id: 'overlap', label: 'Overlapping / crowded', meaning: 'Over-commitment and difficulty separating roles.', impact: 'watch', fix: 'Leave a small, even space between first name and surname.' },
  ] },
];

export const featureLabel = (fid: string, oid: string) => {
  const f = FEATURES.find((x) => x.id === fid); const o = f?.options.find((x) => x.id === oid);
  return f && o ? { feature: f.label, ...o } : null;
};

/** Profession ↔ supportive numbers (by ruling planet's karaka in Indian numerology). */
export const PROFESSIONS: { id: string; label: string; numbers: number[] }[] = [
  { id: 'business', label: 'Business / Trading', numbers: [5, 1, 8] },
  { id: 'govt', label: 'Government service / Administration', numbers: [1, 9, 8] },
  { id: 'it', label: 'IT / Software / Engineering', numbers: [4, 5, 7] },
  { id: 'finance', label: 'Finance / Banking / CA', numbers: [8, 5, 6] },
  { id: 'law', label: 'Law / Judiciary', numbers: [3, 8, 9] },
  { id: 'medicine', label: 'Medicine / Healthcare', numbers: [9, 1, 7] },
  { id: 'teaching', label: 'Teaching / Education / Coaching', numbers: [3, 5, 2] },
  { id: 'media', label: 'Media / Marketing / Sales', numbers: [5, 3, 6] },
  { id: 'arts', label: 'Arts / Design / Fashion / Film', numbers: [6, 3, 2] },
  { id: 'realestate', label: 'Real Estate / Construction', numbers: [4, 8, 9] },
  { id: 'defence', label: 'Defence / Police / Sports', numbers: [9, 1, 8] },
  { id: 'spiritual', label: 'Spiritual / Healing / Research', numbers: [7, 3, 2] },
  { id: 'hospitality', label: 'Hospitality / Food / Beauty', numbers: [6, 2, 5] },
  { id: 'politics', label: 'Politics / Public life', numbers: [1, 3, 9] },
  { id: 'student', label: 'Student', numbers: [3, 5, 1] },
  { id: 'homemaker', label: 'Homemaker', numbers: [2, 6, 3] },
  { id: 'other', label: 'Other', numbers: [] },
];

export const GOALS = ['Career growth', 'Business expansion', 'Wealth & finance', 'Marriage & relationships', 'Confidence & leadership', 'Health & energy', 'Education & exams', 'Peace of mind', 'Fame & recognition', 'Foreign travel / settlement'];
