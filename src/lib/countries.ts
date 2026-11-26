/**
 * Country list and helpers for international clients.
 */

export interface Country {
  name: string;
  code: string;
  dial: string;
}

export const POPULAR_COUNTRIES: Country[] = [
  { name: 'India', code: 'IN', dial: '+91' },
  { name: 'United States', code: 'US', dial: '+1' },
  { name: 'United Kingdom', code: 'GB', dial: '+44' },
  { name: 'Canada', code: 'CA', dial: '+1' },
  { name: 'Australia', code: 'AU', dial: '+61' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971' },
  { name: 'Singapore', code: 'SG', dial: '+65' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966' },
  { name: 'Qatar', code: 'QA', dial: '+974' },
  { name: 'Kuwait', code: 'KW', dial: '+965' },
  { name: 'Oman', code: 'OM', dial: '+968' },
  { name: 'Bahrain', code: 'BH', dial: '+973' },
  { name: 'Germany', code: 'DE', dial: '+49' },
  { name: 'France', code: 'FR', dial: '+33' },
  { name: 'Netherlands', code: 'NL', dial: '+31' },
  { name: 'Switzerland', code: 'CH', dial: '+41' },
  { name: 'Ireland', code: 'IE', dial: '+353' },
  { name: 'New Zealand', code: 'NZ', dial: '+64' },
  { name: 'Malaysia', code: 'MY', dial: '+60' },
  { name: 'Indonesia', code: 'ID', dial: '+62' },
  { name: 'South Africa', code: 'ZA', dial: '+27' },
  { name: 'Nepal', code: 'NP', dial: '+977' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94' },
  { name: 'Bangladesh', code: 'BD', dial: '+880' },
  { name: 'Mauritius', code: 'MU', dial: '+230' },
];

export const ALL_COUNTRIES: Country[] = [
  ...POPULAR_COUNTRIES,
  { name: 'Afghanistan', code: 'AF', dial: '+93' },
  { name: 'Albania', code: 'AL', dial: '+355' },
  { name: 'Algeria', code: 'DZ', dial: '+213' },
  { name: 'Argentina', code: 'AR', dial: '+54' },
  { name: 'Armenia', code: 'AM', dial: '+374' },
  { name: 'Austria', code: 'AT', dial: '+43' },
  { name: 'Azerbaijan', code: 'AZ', dial: '+994' },
  { name: 'Belgium', code: 'BE', dial: '+32' },
  { name: 'Bhutan', code: 'BT', dial: '+975' },
  { name: 'Brazil', code: 'BR', dial: '+55' },
  { name: 'Bulgaria', code: 'BG', dial: '+359' },
  { name: 'Chile', code: 'CL', dial: '+56' },
  { name: 'China', code: 'CN', dial: '+86' },
  { name: 'Colombia', code: 'CO', dial: '+57' },
  { name: 'Croatia', code: 'HR', dial: '+385' },
  { name: 'Cyprus', code: 'CY', dial: '+357' },
  { name: 'Czech Republic', code: 'CZ', dial: '+420' },
  { name: 'Denmark', code: 'DK', dial: '+45' },
  { name: 'Egypt', code: 'EG', dial: '+20' },
  { name: 'Estonia', code: 'EE', dial: '+372' },
  { name: 'Fiji', code: 'FJ', dial: '+679' },
  { name: 'Finland', code: 'FI', dial: '+358' },
  { name: 'Georgia', code: 'GE', dial: '+995' },
  { name: 'Ghana', code: 'GH', dial: '+233' },
  { name: 'Greece', code: 'GR', dial: '+30' },
  { name: 'Hong Kong', code: 'HK', dial: '+852' },
  { name: 'Hungary', code: 'HU', dial: '+36' },
  { name: 'Iceland', code: 'IS', dial: '+354' },
  { name: 'Iran', code: 'IR', dial: '+98' },
  { name: 'Israel', code: 'IL', dial: '+972' },
  { name: 'Italy', code: 'IT', dial: '+39' },
  { name: 'Japan', code: 'JP', dial: '+81' },
  { name: 'Jordan', code: 'JO', dial: '+962' },
  { name: 'Kazakhstan', code: 'KZ', dial: '+7' },
  { name: 'Kenya', code: 'KE', dial: '+254' },
  { name: 'Lebanon', code: 'LB', dial: '+961' },
  { name: 'Luxembourg', code: 'LU', dial: '+352' },
  { name: 'Maldives', code: 'MV', dial: '+960' },
  { name: 'Malta', code: 'MT', dial: '+356' },
  { name: 'Mexico', code: 'MX', dial: '+52' },
  { name: 'Morocco', code: 'MA', dial: '+212' },
  { name: 'Myanmar', code: 'MM', dial: '+95' },
  { name: 'Nigeria', code: 'NG', dial: '+234' },
  { name: 'Norway', code: 'NO', dial: '+47' },
  { name: 'Pakistan', code: 'PK', dial: '+92' },
  { name: 'Panama', code: 'PA', dial: '+507' },
  { name: 'Peru', code: 'PE', dial: '+51' },
  { name: 'Philippines', code: 'PH', dial: '+63' },
  { name: 'Poland', code: 'PL', dial: '+48' },
  { name: 'Portugal', code: 'PT', dial: '+351' },
  { name: 'Romania', code: 'RO', dial: '+40' },
  { name: 'Russia', code: 'RU', dial: '+7' },
  { name: 'Serbia', code: 'RS', dial: '+381' },
  { name: 'Slovakia', code: 'SK', dial: '+421' },
  { name: 'Slovenia', code: 'SI', dial: '+386' },
  { name: 'South Korea', code: 'KR', dial: '+82' },
  { name: 'Spain', code: 'ES', dial: '+34' },
  { name: 'Sweden', code: 'SE', dial: '+46' },
  { name: 'Taiwan', code: 'TW', dial: '+886' },
  { name: 'Tanzania', code: 'TZ', dial: '+255' },
  { name: 'Thailand', code: 'TH', dial: '+66' },
  { name: 'Trinidad and Tobago', code: 'TT', dial: '+1' },
  { name: 'Turkey', code: 'TR', dial: '+90' },
  { name: 'Uganda', code: 'UG', dial: '+256' },
  { name: 'Ukraine', code: 'UA', dial: '+380' },
  { name: 'Vietnam', code: 'VN', dial: '+84' },
  { name: 'Zambia', code: 'ZM', dial: '+260' },
  { name: 'Zimbabwe', code: 'ZW', dial: '+263' },
].filter((c, idx, arr) => arr.findIndex((x) => x.name === c.name) === idx);

export function isIndia(country?: string | null): boolean {
  if (!country) return true;
  const c = country.trim().toLowerCase();
  return c === 'india' || c === 'in' || c === 'bharat' || c === 'hindustan';
}

export function dialCodeFor(countryName?: string | null): string {
  if (!countryName) return '+91';
  const c = ALL_COUNTRIES.find((x) => x.name.toLowerCase() === countryName.trim().toLowerCase());
  return c?.dial || '+91';
}
