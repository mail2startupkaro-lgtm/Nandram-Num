/** Site-wide SEO constants and helpers. The production URL comes from APP_URL (https://www.mynumerologist.com). */
export const SITE_URL = (process.env.APP_URL || 'https://www.mynumerologist.com').replace(/\/$/, '');
export const SITE_NAME = 'myNumerologist.com';
export const EXPERT = {
  name: 'Acharya Nandram',
  jobTitle: 'Numerologist',
  description: 'Indian numerologist with more than 15 years of experience in Vedic, Chaldean and Lo Shu grid numerology.',
  knowsAbout: ['Numerology', 'Vedic numerology', 'Chaldean numerology', 'Lo Shu grid', 'Name numerology', 'Mobile number numerology', 'Angel numbers', 'Signature analysis'],
};
export const DEFAULT_TITLE = 'Online Numerology Reading by Acharya Nandram – Best Numerologist in India';
export const DEFAULT_DESCRIPTION = 'Free numerology reading by date of birth and name. Moolank, Bhagyank, Lo Shu grid, name, mobile number, angel numbers and marriage compatibility with practical remedies by Acharya Nandram (15+ years).';

export const abs = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const URL_KEYS = new Set(['item', 'url', 'mainEntityOfPage', '@id', 'logo', 'image']);
/** Safe JSON-LD: site-relative URLs become absolute and "<" is escaped so content can never close the <script> tag. */
export const jsonLd = (data: unknown) =>
  JSON.stringify(data, (k, v) => (URL_KEYS.has(k) && typeof v === 'string' && v.startsWith('/') ? `${SITE_URL}${v}` : v)).replace(/</g, '\\u003c');

export const orgLd = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#org`, name: SITE_NAME, url: SITE_URL, logo: abs('/icon.svg'), founder: { '@id': `${SITE_URL}/#expert` } },
    { '@type': 'Person', '@id': `${SITE_URL}/#expert`, name: EXPERT.name, jobTitle: EXPERT.jobTitle, description: EXPERT.description, knowsAbout: EXPERT.knowsAbout, worksFor: { '@id': `${SITE_URL}/#org` }, url: SITE_URL },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: ['en-IN', 'hi-IN'], publisher: { '@id': `${SITE_URL}/#org` } },
  ],
});

/** Business details shown on the legal pages (set these in Vercel → Environment Variables). */
export const LEGAL = {
  name: process.env.SELLER_LEGAL_NAME || SITE_NAME,
  address: process.env.SELLER_ADDRESS || '',
  email: process.env.SELLER_EMAIL || '',
  phone: process.env.SELLER_PHONE || '',
  grievanceOfficer: process.env.GRIEVANCE_OFFICER || process.env.SELLER_LEGAL_NAME || EXPERT.name,
  city: process.env.LEGAL_CITY || process.env.SELLER_STATE || 'India',
  updated: '9 November 2026',
  updatedHi: '9 नवंबर 2026',
};
export const legalContact = () => [LEGAL.email && `Email: ${LEGAL.email}`, LEGAL.phone && `Phone: ${LEGAL.phone}`, LEGAL.address && `Address: ${LEGAL.address}`].filter(Boolean).join(' · ') || 'Use the contact details on your invoice or write to us from your account page.';

export const legalContactHi = () => [LEGAL.email && `ईमेल: ${LEGAL.email}`, LEGAL.phone && `फ़ोन: ${LEGAL.phone}`, LEGAL.address && `पता: ${LEGAL.address}`].filter(Boolean).join(' · ') || 'अपने इनवॉइस पर दिए संपर्क विवरण का उपयोग करें या अपने अकाउंट पेज से हमें लिखें।';
