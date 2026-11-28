/**
 * Last-step clean-up for Hindi reports: English text that still reaches a Hindi page (the expert's name and title
 * from branding, English month names in dates, business sector and group names) is replaced with its Hindi form.
 * Used by the PDF engine (page text + running header/footer) and by the browser-printed reports.
 * Only exact phrases are replaced; client names and other data the client typed stay as written.
 */

/** Business sectors and groups (categories.ts) in Hindi. */
export const BUSINESS_HI: Record<string, string> = {
  'Trade & Retail': 'व्यापार और खुदरा', 'Technology & Media': 'तकनीक और मीडिया', 'Lifestyle & Beauty': 'जीवनशैली और सौंदर्य', 'Food & Hospitality': 'भोजन और आतिथ्य',
  'Property & Industry': 'संपत्ति और उद्योग', 'Finance & Legal': 'वित्त और क़ानून', 'Education & Consulting': 'शिक्षा और परामर्श', 'Health & Wellness': 'स्वास्थ्य और कल्याण',
  'Agriculture & Logistics': 'कृषि और लॉजिस्टिक्स', 'Public Service & Defence': 'जन सेवा और रक्षा',
  'Grocery & daily needs': 'किराना और रोज़मर्रा की ज़रूरतें', 'Footwear, bags & accessories': 'जूते, बैग और एक्सेसरीज़', 'Jewellery & precious metals': 'आभूषण और कीमती धातुएँ',
  'Home, furniture & decor': 'घर, फ़र्नीचर और सजावट', 'Electronics, mobiles & appliances': 'इलेक्ट्रॉनिक्स, मोबाइल और उपकरण', 'Hardware & building materials': 'हार्डवेयर और निर्माण सामग्री',
  'E-commerce & online selling': 'ई-कॉमर्स और ऑनलाइन बिक्री', 'Wholesale, trading & distribution': 'थोक, व्यापार और वितरण', 'Import & export': 'आयात और निर्यात',
  'Automobile sales & services': 'वाहन बिक्री और सर्विस', 'Pets & animals retail': 'पालतू पशु और पशु सामग्री', 'Textiles & handloom trade': 'कपड़ा और हथकरघा व्यापार',
  'Liquor, tobacco & lounges': 'शराब, तंबाकू और लाउंज', 'IT & software': 'आईटी और सॉफ़्टवेयर', 'Digital marketing & creative': 'डिजिटल मार्केटिंग और क्रिएटिव',
  'Media, film & entertainment': 'मीडिया, फ़िल्म और मनोरंजन', 'Telecom & networking': 'टेलीकॉम और नेटवर्किंग', 'Printing & publishing': 'छपाई और प्रकाशन',
  'Electronics & tech manufacturing': 'इलेक्ट्रॉनिक्स और तकनीकी निर्माण', 'Fashion design & garment making': 'फ़ैशन डिज़ाइन और वस्त्र निर्माण', 'Events, weddings & celebrations': 'इवेंट, शादी और समारोह',
  'Arts & crafts': 'कला और शिल्प', 'Kids, baby & family': 'बच्चे, शिशु और परिवार', 'Luxury & lifestyle': 'लग्ज़री और जीवनशैली',
  'Restaurants, cafés & eateries': 'रेस्टोरेंट, कैफ़े और भोजनालय', 'Food processing & packaged foods': 'खाद्य प्रसंस्करण और पैकेज्ड फ़ूड', 'Dairy & beverages': 'डेयरी और पेय पदार्थ',
  'Hotels, travel & tourism': 'होटल, यात्रा और पर्यटन', 'Real estate & property': 'रियल एस्टेट और संपत्ति', 'Construction & contracting': 'निर्माण और ठेकेदारी',
  'Manufacturing & factories': 'विनिर्माण और कारख़ाने', 'Metals, mining & heavy industry': 'धातु, खनन और भारी उद्योग', 'Chemicals, oil & energy': 'रसायन, तेल और ऊर्जा',
  'Machinery & engineering services': 'मशीनरी और इंजीनियरिंग सेवाएँ', 'Repairs & home services': 'मरम्मत और घरेलू सेवाएँ', 'Rental businesses': 'किराये के व्यवसाय',
  'Packaging & industrial supplies': 'पैकेजिंग और औद्योगिक सामग्री', 'Finance, banking & investment': 'वित्त, बैंकिंग और निवेश', 'Accounting, tax & compliance': 'लेखा, कर और अनुपालन',
  'Legal & documentation': 'क़ानूनी और दस्तावेज़ सेवाएँ', 'Schools, coaching & training': 'स्कूल, कोचिंग और प्रशिक्षण', 'Consulting & professional services': 'परामर्श और पेशेवर सेवाएँ',
  'Hospitals, clinics & diagnostics': 'अस्पताल, क्लिनिक और जाँच केंद्र', 'Pharmacy & medical supply': 'फ़ार्मेसी और चिकित्सा सामग्री', 'Wellness & alternative healing': 'कल्याण और वैकल्पिक चिकित्सा',
  'Spiritual & astrology': 'आध्यात्मिक और ज्योतिष', 'Sports & fitness': 'खेल और फ़िटनेस', 'Funeral & last-rites services': 'अंतिम संस्कार सेवाएँ',
  'Farming & agriculture': 'खेती और कृषि', 'Transport & logistics': 'परिवहन और लॉजिस्टिक्स', 'Waste, water & environment': 'कचरा, जल और पर्यावरण',
  'Marine, aviation & drones': 'समुद्री, विमानन और ड्रोन', 'Security & defence': 'सुरक्षा और रक्षा', 'Government, public & social': 'सरकारी, सार्वजनिक और सामाजिक',
};

/** Phrases replaced on Hindi pages (longest first when applied). */
export const HINDI_FIXES: Record<string, string> = {
  'Numerologist · Vedic, Chaldean & Lo Shu': 'अंक ज्योतिषी · वैदिक, कैल्डियन और लो शू',
  'Acharya Nandram': 'आचार्य नंदराम',
  ...BUSINESS_HI,
};

const MONTHS: Record<string, string> = { jan: 'जनवरी', feb: 'फ़रवरी', mar: 'मार्च', apr: 'अप्रैल', may: 'मई', jun: 'जून', jul: 'जुलाई', aug: 'अगस्त', sep: 'सितंबर', oct: 'अक्टूबर', nov: 'नवंबर', dec: 'दिसंबर' };
/** English month after a day number ("28 Aug 2026", "5 September") → Hindi. */
export const MONTH_RE = /(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?(?=[\s,–-]|$)/g;

const KEYS = Object.keys(HINDI_FIXES).sort((a, b) => b.length - a.length);
/** Applies the Hindi fixes to a plain string (used for PDF header and footer templates). */
export function hindiPolish(s: string): string {
  let out = s;
  for (const k of KEYS) if (out.includes(k)) out = out.split(k).join(HINDI_FIXES[k]);
  return out.replace(MONTH_RE, (m, d: string, mo: string) => `${d} ${MONTHS[mo.toLowerCase()] ?? mo}`);
}

/** Browser part: runs on every text node of a page whose <html lang> is "hi". */
export const HINDI_POLISH_SCRIPT = `(function (doc) {
  if ((doc.documentElement.getAttribute('lang') || '').slice(0, 2) !== 'hi') return 0;
  var FIX = ${JSON.stringify(HINDI_FIXES)}, MONTHS = ${JSON.stringify(MONTHS)};
  var keys = Object.keys(FIX).sort(function (a, b) { return b.length - a.length; });
  var re = new RegExp(${JSON.stringify(MONTH_RE.source)}, 'g');
  var w = doc.createTreeWalker(doc.body, 4), n, changed = 0;
  while ((n = w.nextNode())) {
    var p = n.parentElement; if (p && p.closest('script,style')) continue;
    var s = n.data, o = s;
    for (var i = 0; i < keys.length; i++) if (s.indexOf(keys[i]) >= 0) s = s.split(keys[i]).join(FIX[keys[i]]);
    s = s.replace(re, function (m, d, mo) { return d + ' ' + (MONTHS[mo.toLowerCase()] || mo); });
    if (s !== o) { n.data = s; changed++; }
  }
  return changed;
})(document)`;
