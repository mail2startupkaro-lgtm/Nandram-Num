/**
 * Nicknames (calling names / pet names) for the Baby Name report.
 * A child hears the nickname many times a day, so it is checked like a name: its own number against the birth numbers,
 * plus harmony with the formal name. Suggestions come from two places: short forms made from the formal name
 * (Abhinav → Abhi, Aarav → Aaru) and a small list of common pet names.
 * g: b = boy, g = girl, u = either. en / hm = feel or meaning in English / Hindi. hi = Devanagari (Indian names only).
 */
import type { NameGender } from './names';

export interface PetName { n: string; g: NameGender; hi?: string; en: string; hm: string }
const P = (n: string, g: NameGender, hi: string | undefined, en: string, hm: string): PetName => ({ n, g, hi, en, hm });

/** Popular Indian pet names. */
export const INDIAN_PET_NAMES: PetName[] = [
  P('Golu', 'u', 'गोलू', 'Chubby and cute', 'गोल-मटोल, प्यारा'), P('Sonu', 'u', 'सोनू', 'Golden, precious', 'सोने जैसा, अनमोल'),
  P('Chiku', 'u', 'चीकू', 'Sweet like the chiku fruit', 'चीकू फल जैसा मीठा'), P('Laddu', 'u', 'लड्डू', 'Sweet and round, a little treat', 'लड्डू जैसा मीठा'),
  P('Kanha', 'b', 'कान्हा', 'Little Krishna', 'बाल कृष्ण'), P('Munna', 'b', 'मुन्ना', 'The little one', 'छोटा, लाड़ला'),
  P('Bittu', 'b', 'बिट्टू', 'Little one', 'नन्हा'), P('Chintu', 'b', 'चिंटू', 'Tiny and lively', 'नन्हा, चंचल'),
  P('Monu', 'b', 'मोनू', 'Dear one', 'प्यारा'), P('Rinku', 'b', 'रिंकू', 'Cheerful', 'हँसमुख'),
  P('Raja', 'b', 'राजा', 'King', 'राजा'), P('Bablu', 'b', 'बबलू', 'Darling boy', 'लाड़ला'),
  P('Guddu', 'b', 'गुड्डू', 'Sweet little boy', 'प्यारा बच्चा'), P('Kittu', 'u', 'किट्टू', 'Little and playful', 'नन्हा, खिलंदड़'),
  P('Pihu', 'g', 'पीहू', 'Sweet call of a bird', 'पक्षी की मीठी आवाज़'), P('Mishti', 'g', 'मिष्टी', 'Sweet', 'मीठी'),
  P('Pari', 'g', 'परी', 'Fairy, angel', 'परी'), P('Gudiya', 'g', 'गुड़िया', 'Doll', 'गुड़िया'),
  P('Titli', 'g', 'तितली', 'Butterfly', 'तितली'), P('Bulbul', 'g', 'बुलबुल', 'Songbird', 'गाने वाली चिड़िया'),
  P('Khushi', 'g', 'ख़ुशी', 'Happiness', 'प्रसन्नता'), P('Rani', 'g', 'रानी', 'Queen', 'रानी'),
  P('Minnie', 'g', 'मिनी', 'Little one', 'नन्ही'), P('Guddi', 'g', 'गुड्डी', 'Doll, darling', 'गुड़िया, लाड़ली'),
  P('Chhavi', 'g', 'छवि', 'Image, beauty', 'छवि, सुंदरता'), P('Anu', 'u', 'अनु', 'Atom; little', 'अणु, नन्हा'),
];

/** Common international short forms and pet names. */
export const WORLD_PET_NAMES: PetName[] = [
  P('Max', 'b', undefined, 'Greatest', 'महान'), P('Leo', 'b', undefined, 'Lion', 'शेर'), P('Sam', 'b', undefined, 'Heard by God', 'ईश्वर ने सुना'),
  P('Ben', 'b', undefined, 'Son', 'पुत्र'), P('Alex', 'u', undefined, 'Protector', 'रक्षक'), P('Jack', 'b', undefined, 'God is gracious', 'ईश्वर कृपालु है'),
  P('Theo', 'b', undefined, 'Gift of God', 'ईश्वर का उपहार'), P('Finn', 'b', undefined, 'Fair, bright', 'उजला'), P('Toby', 'b', undefined, 'God is good', 'ईश्वर अच्छा है'),
  P('Ollie', 'u', undefined, 'Olive tree, peace', 'जैतून, शांति'), P('Ellie', 'g', undefined, 'Light', 'प्रकाश'), P('Lily', 'g', undefined, 'Lily flower, purity', 'लिली फूल, पवित्रता'),
  P('Rosie', 'g', undefined, 'Rose', 'गुलाब'), P('Mia', 'g', undefined, 'Mine, beloved', 'प्रिय'), P('Ava', 'g', undefined, 'Life', 'जीवन'),
  P('Lucy', 'g', undefined, 'Light', 'प्रकाश'), P('Zoe', 'g', undefined, 'Life', 'जीवन'), P('Nora', 'g', undefined, 'Light, honour', 'प्रकाश, सम्मान'),
  P('Evie', 'g', undefined, 'Life', 'जीवन'), P('Bella', 'g', undefined, 'Beautiful', 'सुंदर'), P('Sunny', 'u', undefined, 'Bright and cheerful', 'उजला, हँसमुख'),
  P('Charlie', 'u', undefined, 'Free', 'स्वतंत्र'), P('Jojo', 'u', undefined, 'Playful', 'खिलंदड़'), P('Kiki', 'u', undefined, 'Cheerful', 'हँसमुख'),
];

const VOWEL_END = ['u', 'i', 'oo', 'ee'];

/**
 * Short forms made from a formal first name, the way Indian families shorten names:
 * first 2–4 letters + a soft ending (Aarav → Aaru, Abhinav → Abhi, Shaurya → Shau / Shauru).
 * Only readable results: 3–6 letters, ending in a vowel, no triple letters.
 */
export function shortForms(first: string): string[] {
  const w = first.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 4) return [];
  const out = new Set<string>();
  const DIGRAPH = /(sh|ch|th|bh|dh|kh|ph|gh|jh|ny|sv|sw)$/;
  for (let len = 2; len <= Math.min(4, w.length - 1); len++) {
    const stem = w.slice(0, len);
    if (!/[aeiou]/.test(stem)) continue;
    if (w[len] === 'h') continue; // "Ab|hinav" – the h belongs to the syllable (Abhi, not Abu)
    if (/[aeiou]$/.test(stem)) { if (stem.length >= 4 && /[iuo]$/.test(stem)) out.add(stem); continue; }
    if (/[^aeiou]{2}$/.test(stem) && !DIGRAPH.test(stem)) continue; // Rudr-u
    const lastVowel = (stem.match(/[aeiou](?=[^aeiou]*$)/) ?? [''])[0];
    for (const s of VOWEL_END) if (lastVowel !== (s === 'ee' ? 'i' : s === 'oo' ? 'u' : s)) out.add(stem + s); // no Isi / Rudu
  }
  return [...out]
    .filter((x) => x.length >= 3 && x.length <= 6 && /[aeiouy]$/.test(x) && !/(.)\1\1/.test(x) && !/hh|[^aeiou]{3}/.test(x) && x !== w)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1));
}

/** Same sound, different spelling (Aari / Aaree, Chiku / Chikoo) – used to avoid offering both. */
export const soundKey = (n: string) => n.toLowerCase().replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/(.)\1/g, '$1').replace(/y$/, 'i');
