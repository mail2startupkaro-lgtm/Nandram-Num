/**
 * Businesses and professions with their supporting numbers (primary first), following the karaka of each
 * ruling planet in Indian numerology: 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus, 7 Ketu, 8 Saturn, 9 Mars.
 * Capital: 1 low, 2 medium, 3 high. Expert-editable.
 */
export type Kind = 'business' | 'profession';
export interface BizItem { id: string; label: string; sector: string; kind: Kind; numbers: number[]; capital: 1 | 2 | 3 }

export const SECTORS = ['Trade & Retail', 'Technology & Media', 'Lifestyle & Beauty', 'Food & Hospitality', 'Property & Industry', 'Finance & Legal', 'Education & Consulting', 'Health & Wellness', 'Agriculture & Logistics', 'Public Service & Defence'] as const;

const b = (id: string, label: string, sector: (typeof SECTORS)[number], numbers: number[], capital: 1 | 2 | 3): BizItem => ({ id, label, sector, kind: 'business', numbers, capital });
const p = (id: string, label: string, sector: (typeof SECTORS)[number], numbers: number[]): BizItem => ({ id, label, sector, kind: 'profession', numbers, capital: 1 });

export const ITEMS: BizItem[] = [
  b('retail', 'Retail shop / general store', 'Trade & Retail', [5, 6, 3], 2),
  b('trading', 'Wholesale & trading', 'Trade & Retail', [5, 8, 1], 2),
  b('import', 'Import / export', 'Trade & Retail', [4, 5, 7], 3),
  b('ecommerce', 'E-commerce / D2C brand', 'Trade & Retail', [5, 4, 3], 2),
  b('jewellery', 'Jewellery, gold & gems', 'Trade & Retail', [6, 1, 8], 3),
  b('it', 'IT services / software company', 'Technology & Media', [4, 5, 7], 2),
  b('startup', 'Tech startup / mobile app', 'Technology & Media', [4, 1, 5], 3),
  b('digital', 'Digital marketing / social media agency', 'Technology & Media', [5, 3, 4], 1),
  b('media', 'Media, film & entertainment', 'Technology & Media', [6, 3, 4], 3),
  b('electronics', 'Electronics, mobile & electricals', 'Technology & Media', [4, 5, 9], 2),
  b('printing', 'Printing, stationery & publishing', 'Technology & Media', [3, 5, 4], 1),
  b('fashion', 'Fashion, boutique & textiles', 'Lifestyle & Beauty', [6, 2, 5], 2),
  b('beauty', 'Beauty salon & cosmetics', 'Lifestyle & Beauty', [6, 2, 5], 1),
  b('events', 'Event management / wedding planning', 'Lifestyle & Beauty', [6, 3, 5], 1),
  b('food', 'Restaurant / café / cloud kitchen', 'Food & Hospitality', [6, 2, 3], 2),
  b('dairy', 'Dairy, beverages & water', 'Food & Hospitality', [2, 6, 7], 2),
  b('hotel', 'Hotel, travel & tourism', 'Food & Hospitality', [6, 5, 2], 3),
  b('realestate', 'Real estate & property dealing', 'Property & Industry', [8, 4, 9], 3),
  b('construction', 'Construction & infrastructure', 'Property & Industry', [8, 9, 4], 3),
  b('manufacturing', 'Manufacturing / factory', 'Property & Industry', [8, 4, 9], 3),
  b('auto', 'Automobile, machinery & spare parts', 'Property & Industry', [9, 8, 4], 2),
  b('chemicals', 'Chemicals, oil & petroleum products', 'Property & Industry', [8, 4, 7], 3),
  b('finance', 'Finance, investment & insurance agency', 'Finance & Legal', [8, 5, 3], 2),
  b('accounts', 'Accounting, tax & CA practice', 'Finance & Legal', [5, 8, 3], 1),
  b('legal', 'Legal services / law firm', 'Finance & Legal', [3, 8, 9], 1),
  b('coaching', 'Coaching institute / school', 'Education & Consulting', [3, 5, 1], 2),
  b('consulting', 'Management consulting & training', 'Education & Consulting', [3, 1, 5], 1),
  b('clinic', 'Clinic, hospital & diagnostics', 'Health & Wellness', [9, 1, 7], 3),
  b('pharmacy', 'Pharmacy / medical distribution', 'Health & Wellness', [1, 9, 5], 2),
  b('wellness', 'Yoga, wellness & alternative healing', 'Health & Wellness', [7, 2, 3], 1),
  b('spiritual', 'Astrology, spiritual & puja products', 'Health & Wellness', [7, 3, 9], 1),
  b('gym', 'Gym, sports & fitness', 'Health & Wellness', [9, 1, 5], 2),
  b('agri', 'Agriculture, organic & farm products', 'Agriculture & Logistics', [2, 4, 8], 2),
  b('logistics', 'Transport, logistics & courier', 'Agriculture & Logistics', [5, 4, 8], 3),
  b('security', 'Security services & defence supplies', 'Public Service & Defence', [9, 1, 8], 2),
  b('govtcontract', 'Government contracts & tenders', 'Public Service & Defence', [1, 8, 9], 3),
  b('ngo', 'Social enterprise / NGO', 'Public Service & Defence', [9, 6, 3], 1),
  p('job-govt', 'Government job / civil services', 'Public Service & Defence', [1, 9, 8]),
  p('job-defence', 'Army, police & defence services', 'Public Service & Defence', [9, 1, 8]),
  p('job-corporate', 'Corporate management', 'Finance & Legal', [1, 8, 5]),
  p('job-banking', 'Banking & finance professional', 'Finance & Legal', [8, 5, 6]),
  p('job-ca', 'Chartered accountant / auditor', 'Finance & Legal', [5, 8, 3]),
  p('job-lawyer', 'Lawyer / judiciary', 'Finance & Legal', [3, 8, 9]),
  p('job-doctor', 'Doctor / surgeon', 'Health & Wellness', [9, 1, 7]),
  p('job-nurse', 'Nursing, care & counselling', 'Health & Wellness', [2, 6, 7]),
  p('job-engineer', 'Engineer (civil / mechanical)', 'Property & Industry', [4, 8, 9]),
  p('job-software', 'Software developer / data scientist', 'Technology & Media', [4, 5, 7]),
  p('job-teacher', 'Teacher / professor', 'Education & Consulting', [3, 5, 2]),
  p('job-designer', 'Designer / artist / architect', 'Lifestyle & Beauty', [6, 3, 4]),
  p('job-journalist', 'Journalist / writer / anchor', 'Technology & Media', [5, 3, 1]),
  p('job-sales', 'Sales & marketing professional', 'Trade & Retail', [5, 3, 6]),
  p('job-aviation', 'Pilot / aviation / merchant navy', 'Agriculture & Logistics', [4, 9, 5]),
  p('job-research', 'Researcher / scientist', 'Education & Consulting', [7, 4, 3]),
  p('job-hospitality', 'Hotel & hospitality professional', 'Food & Hospitality', [6, 2, 5]),
  p('job-politics', 'Politics & public life', 'Public Service & Defence', [1, 3, 9]),
];

/** How favourable each personal year is for launching or expanding a business (0–100) and why. */
export const YEAR_TIMING: Record<number, { score: number; theme: string }> = {
  1: { score: 95, theme: 'Launch year – start new ventures, register the business, take the lead' },
  2: { score: 55, theme: 'Partnerships and patience – collaborate, avoid forcing growth' },
  3: { score: 75, theme: 'Marketing and networking – visibility, branding and communication' },
  4: { score: 60, theme: 'Build systems – hard work, processes, property and structure' },
  5: { score: 82, theme: 'Change and expansion – new markets, travel, product changes' },
  6: { score: 66, theme: 'Customer service and family business – loyalty, quality, home-based work' },
  7: { score: 40, theme: 'Research and planning – study the market, avoid big launches' },
  8: { score: 92, theme: 'Money and power – expansion, investment, recovery of dues' },
  9: { score: 35, theme: 'Completion – close or restructure what is not working, clear debts' },
};
