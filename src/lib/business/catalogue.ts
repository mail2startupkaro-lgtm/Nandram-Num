/**
 * 1000+ businesses and professions with their supporting numbers (primary first), following the karaka of each
 * ruling planet in Indian numerology: 1 Sun, 2 Moon, 3 Jupiter, 4 Rahu, 5 Mercury, 6 Venus, 7 Ketu, 8 Saturn, 9 Mars.
 * Capital: 1 low, 2 medium, 3 high. Expert-editable.
 */
import { CATEGORIES } from './categories';

export type Kind = 'business' | 'profession';
export interface BizItem { id: string; label: string; sector: string; group: string; kind: Kind; numbers: number[]; capital: 1 | 2 | 3 }

export const SECTORS = ['Trade & Retail', 'Technology & Media', 'Lifestyle & Beauty', 'Food & Hospitality', 'Property & Industry', 'Finance & Legal', 'Education & Consulting', 'Health & Wellness', 'Agriculture & Logistics', 'Public Service & Defence'] as const;

const p = (id: string, label: string, sector: (typeof SECTORS)[number], numbers: number[]): BizItem => ({ id, label, sector, group: 'Jobs & professions', kind: 'profession', numbers, capital: 1 });

/** 1000+ business categories (see ./categories.ts) followed by jobs / professions. */
export const BUSINESSES: BizItem[] = CATEGORIES.map((c) => ({ ...c, kind: 'business' as const }));
export const PROFESSIONS: BizItem[] = [
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
  p('job-pharmacist', 'Pharmacist', 'Health & Wellness', [1, 9, 5]),
  p('job-chef', 'Chef / cook', 'Food & Hospitality', [6, 2, 9]),
  p('job-actor', 'Actor / performer', 'Technology & Media', [6, 3, 1]),
  p('job-musician', 'Musician / singer', 'Technology & Media', [6, 2, 3]),
  p('job-sportsperson', 'Professional sportsperson / coach', 'Health & Wellness', [9, 1, 5]),
  p('job-hr', 'HR professional', 'Education & Consulting', [5, 3, 6]),
  p('job-marketing', 'Marketing / brand manager', 'Technology & Media', [5, 6, 1]),
  p('job-psychologist', 'Psychologist / counsellor', 'Health & Wellness', [7, 2, 3]),
  p('job-astrologer', 'Astrologer / numerologist', 'Health & Wellness', [7, 3, 9]),
  p('job-agri-officer', 'Agriculture officer / scientist', 'Agriculture & Logistics', [2, 8, 7]),
  p('job-logistics', 'Supply-chain / logistics manager', 'Agriculture & Logistics', [5, 8, 4]),
  p('job-real-estate', 'Real-estate agent', 'Property & Industry', [8, 5, 4]),
  p('job-fashion', 'Fashion / interior stylist', 'Lifestyle & Beauty', [6, 5, 4]),
  p('job-beautician', 'Beautician / makeup artist', 'Lifestyle & Beauty', [6, 2, 5]),
  p('job-airline', 'Cabin crew / airline staff', 'Food & Hospitality', [4, 6, 5]),
];

export const ITEMS: BizItem[] = [...BUSINESSES, ...PROFESSIONS];
export const BUSINESS_COUNT = BUSINESSES.length;
export const ITEM_BY_ID = new Map(ITEMS.map((x) => [x.id, x]));

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
