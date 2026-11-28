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
  { id: 'enclosure', label: 'Enclosure / circle', options: [
    { id: 'open', label: 'Open (not enclosed)', meaning: 'Open to people, ideas and opportunities.', impact: 'neutral' },
    { id: 'circled', label: 'Enclosed in a circle or loop', meaning: 'Self-protective and guarded; traditionally believed to keep opportunities and support out.', impact: 'watch', fix: 'Do not draw a circle or loop around the signature – leave it open on all sides.' },
  ] },
  { id: 'curve', label: 'Shape of the line', options: [
    { id: 'even', label: 'Even all the way', meaning: 'Effort stays steady from the start of a task to its end.', impact: 'positive' },
    { id: 'arched', label: 'Rises, then falls (arch)', meaning: 'Starts with enthusiasm but energy or confidence may drop before the result comes; in Indian practice an arched signature is believed to bring early gains that do not last.', impact: 'watch', fix: 'Keep the line rising right to the last letter; do not let the second half bend down.' },
    { id: 'dip', label: 'Sinks, then recovers', meaning: 'Goes through a low phase in the middle of things but recovers and finishes well.', impact: 'neutral' },
    { id: 'dropEnd', label: 'Drops at the end', meaning: 'The last part falls away: tasks may lose support or be finished in a tired mood.', impact: 'watch', fix: 'Write the last letters on the same rising line as the rest of the name.' },
  ] },
  { id: 'zones', label: 'Upper and lower zones', options: [
    { id: 'balanced', label: 'Balanced', meaning: 'Ideas, daily life and practical needs are kept in good balance.', impact: 'positive' },
    { id: 'upper', label: 'Tall upper strokes', meaning: 'Strong ideals, plans and ambition; the mind is often on the bigger picture.', impact: 'neutral' },
    { id: 'lower', label: 'Long lower strokes', meaning: 'Practical, physical and money-minded; values comfort and security.', impact: 'neutral' },
  ] },
  { id: 'loops', label: 'Loops and curves', options: [
    { id: 'rounded', label: 'Many round loops', meaning: 'Warm, imaginative and emotional; relationships matter a lot.', impact: 'positive' },
    { id: 'balanced', label: 'Some loops', meaning: 'Feeling and reason are well balanced.', impact: 'neutral' },
    { id: 'angular', label: 'Few loops, angular', meaning: 'Practical, direct and decisive; may come across as strict.', impact: 'neutral' },
  ] },
  { id: 'progression', label: 'Letter size from start to end', options: [
    { id: 'even', label: 'Same size throughout', meaning: 'Consistent effort and a steady approach.', impact: 'positive' },
    { id: 'shrinking', label: 'Gets smaller towards the end', meaning: 'Tact and caution, but confidence or energy may fade before work is finished.', impact: 'watch', fix: 'Keep the last letters as tall as the middle ones.' },
    { id: 'growing', label: 'Gets larger towards the end', meaning: 'Frank and open; can become impatient as things go on.', impact: 'neutral' },
  ] },
  { id: 'fluency', label: 'Flow of writing', options: [
    { id: 'fluent', label: 'Fluent, few pen lifts', meaning: 'Quick thinking and confident action.', impact: 'positive' },
    { id: 'steady', label: 'A few pen lifts', meaning: 'Thinks before acting; careful and methodical.', impact: 'neutral' },
    { id: 'broken', label: 'Many pen lifts', meaning: 'Hesitation or extra caution before decisions; ideas may come in pieces.', impact: 'watch', fix: 'Practise writing the name in one or two smooth movements.' },
  ] },
  { id: 'ink', label: 'Ink colour', options: [
    { id: 'blue', label: 'Blue ink', meaning: 'Traditionally preferred for signatures: calm, trust and steady growth.', impact: 'positive' },
    { id: 'black', label: 'Black ink', meaning: 'Formal and firm; correct for official papers, though many practitioners prefer blue for growth.', impact: 'neutral' },
    { id: 'red', label: 'Red ink', meaning: 'Traditionally avoided for signatures: linked with conflict, debt and loss.', impact: 'watch', fix: 'Sign in blue (or black for official papers), never in red.' },
    { id: 'green', label: 'Green ink', meaning: 'Linked with Mercury: business and communication; unusual for official documents.', impact: 'neutral' },
    { id: 'other', label: 'Other colour', meaning: 'An unusual ink colour; it is better to keep to blue or black on documents.', impact: 'neutral' },
  ] },
];

/** How much each feature counts in the graphology score (signature-correction practice gives most weight to direction, first letter and cutting strokes). */
export const FEATURE_WEIGHT: Record<string, number> = { baseline: 1.4, first: 1.2, underline: 1.3, ending: 1.0, curve: 1.0, legibility: 0.9, slant: 0.9, dots: 0.8, enclosure: 0.8, size: 0.6, progression: 0.6, ink: 0.6, spacing: 0.5, pressure: 0.5, fluency: 0.5, zones: 0.4, loops: 0.3 };

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
