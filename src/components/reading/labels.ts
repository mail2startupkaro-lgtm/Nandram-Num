import type { FamilyRelation } from '@/lib/numerology/schemas';

export const RELATION_LABEL: Record<FamilyRelation, { en: string; hi: string }> = {
  self: { en: 'Myself', hi: 'स्वयं' }, spouse: { en: 'Spouse', hi: 'जीवनसाथी' }, son: { en: 'Son', hi: 'पुत्र' }, daughter: { en: 'Daughter', hi: 'पुत्री' },
  father: { en: 'Father', hi: 'पिता' }, mother: { en: 'Mother', hi: 'माता' }, brother: { en: 'Brother', hi: 'भाई' }, sister: { en: 'Sister', hi: 'बहन' },
  grandparent: { en: 'Grandparent', hi: 'दादा-दादी / नाना-नानी' }, relative: { en: 'Relative', hi: 'रिश्तेदार' }, friend: { en: 'Friend', hi: 'मित्र' }, other: { en: 'Other', hi: 'अन्य' },
};

export const FLOW = {
  en: {
    pickKicker: 'Get your reading', pickTitle: 'Which reading would you like?', pickSub: 'Choose a reading first. We will then ask only for the details that reading needs.',
    free: 'Free instant reading', freeShort: 'Moolank, Bhagyank, Lo Shu grid, name and mobile number check on screen in seconds – no payment needed.', freeCta: 'Start free reading', freeTag: 'Free',
    choose: 'Choose this reading', enquire: 'Ask for price', priceSoon: 'Price on request', off: 'OFF', needs: 'We will ask for', delivery: 'Delivery',
    steps: ['Reading', 'Details', 'Account', 'Payment'],
    back: 'Back', change: 'Change reading', next: 'Continue', forWho: 'Who is this reading for?', someoneNew: 'Someone new', relation: 'This reading is for',
    detailsTitle: 'Details for the reading', savedNote: 'These details are saved securely to your account, so you will not need to type them again for your next reading.',
    babyName: "Baby's name or nickname (to save in your family list)", partnerPick: 'Choose partner from your family list', partnerTyped: 'Type partner details',
    accountTitle: 'Create your account to continue', accountSub: 'Your details and reports stay in your account. Next time you just pick the person and pay.',
    signUp: 'Create account', signIn: 'I already have an account', name: 'Your full name', email: 'Email', mobile: 'Mobile number', password: 'Password (min. 8 characters)', confirm: 'Confirm password', identifier: 'Email or mobile number',
    createAndContinue: 'Create account & continue', signInAndContinue: 'Sign in & continue', signedInAs: 'Signed in as',
    payTitle: 'Review & pay', readingFor: 'Reading for', change2: 'Edit details',
    billName: 'Name on invoice', phone: 'Mobile number (for payment & updates)', state: 'State', select: 'Select…', outside: 'Outside India', gstin: 'GSTIN (optional)', total: 'Total', totalIntl: 'Total',
    pay: (a: string) => `Pay ${a} securely`, paying: 'Opening payment…', confirming: 'Confirming your payment with the bank…', failed: 'The payment did not complete. You have not been charged; please try again.',
    mock: 'Test mode – no real payment is taken.', simulate: 'Simulate successful payment',
    ok: 'Payment received – thank you!', okText: 'Acharya Nandram will start your reading. You will receive it by email and WhatsApp within the delivery time. You can follow the status under My account.',
    sigPhotos: 'Send signature photos on WhatsApp', account: 'My account', another: 'Get another reading', family: 'Add a family member',
    personErr: 'Could not save these details. Please write the name in English letters (A–Z) and check the date of birth.', personNotFound: 'That saved person was not found. Please choose again.', limit: 'You have reached the limit of saved people. Remove someone under My account → My family.',
    loading: 'Loading…', notFound: 'This reading is not available right now.', loginRequired: 'Please create an account or sign in first.',
  },
  hi: {
    pickKicker: 'अपनी रीडिंग पाएं', pickTitle: 'आप कौन-सी रीडिंग चाहते हैं?', pickSub: 'पहले रीडिंग चुनें। फिर हम केवल वही विवरण पूछेंगे जो उस रीडिंग के लिए ज़रूरी हैं।',
    free: 'मुफ़्त तुरंत रीडिंग', freeShort: 'मूलांक, भाग्यांक, लो शू ग्रिड, नाम और मोबाइल नंबर की जाँच – सेकंडों में स्क्रीन पर, बिना भुगतान।', freeCta: 'मुफ़्त रीडिंग शुरू करें', freeTag: 'मुफ़्त',
    choose: 'यह रीडिंग चुनें', enquire: 'मूल्य पूछें', priceSoon: 'मूल्य पूछताछ पर', off: 'छूट', needs: 'हम पूछेंगे', delivery: 'डिलीवरी',
    steps: ['रीडिंग', 'विवरण', 'खाता', 'भुगतान'],
    back: 'पीछे', change: 'रीडिंग बदलें', next: 'आगे बढ़ें', forWho: 'यह रीडिंग किसके लिए है?', someoneNew: 'कोई नया व्यक्ति', relation: 'यह रीडिंग है',
    detailsTitle: 'रीडिंग के लिए विवरण', savedNote: 'ये विवरण आपके खाते में सुरक्षित रूप से सहेजे जाते हैं, ताकि अगली रीडिंग के लिए आपको दोबारा न लिखना पड़े।',
    babyName: 'शिशु का नाम या उपनाम (परिवार सूची में सहेजने के लिए)', partnerPick: 'परिवार सूची से जीवनसाथी चुनें', partnerTyped: 'जीवनसाथी का विवरण लिखें',
    accountTitle: 'आगे बढ़ने के लिए अपना खाता बनाएं', accountSub: 'आपके विवरण और रिपोर्ट आपके खाते में रहते हैं। अगली बार बस व्यक्ति चुनें और भुगतान करें।',
    signUp: 'खाता बनाएं', signIn: 'मेरा खाता पहले से है', name: 'आपका पूरा नाम', email: 'ईमेल', mobile: 'मोबाइल नंबर', password: 'पासवर्ड (कम से कम 8 अक्षर)', confirm: 'पासवर्ड दोबारा', identifier: 'ईमेल या मोबाइल नंबर',
    createAndContinue: 'खाता बनाएं और आगे बढ़ें', signInAndContinue: 'साइन इन करें और आगे बढ़ें', signedInAs: 'साइन इन:',
    payTitle: 'जाँचें और भुगतान करें', readingFor: 'रीडिंग किसके लिए', change2: 'विवरण बदलें',
    billName: 'इनवॉइस पर नाम', phone: 'मोबाइल नंबर (भुगतान और अपडेट के लिए)', state: 'राज्य', select: 'चुनें…', outside: 'भारत के बाहर', gstin: 'GSTIN (वैकल्पिक)', total: 'कुल', totalIntl: 'कुल',
    pay: (a: string) => `${a} सुरक्षित भुगतान करें`, paying: 'भुगतान खुल रहा है…', confirming: 'बैंक से आपके भुगतान की पुष्टि हो रही है…', failed: 'भुगतान पूरा नहीं हुआ। आपसे कोई राशि नहीं ली गई; कृपया फिर प्रयास करें।',
    mock: 'टेस्ट मोड – कोई वास्तविक भुगतान नहीं।', simulate: 'सफल भुगतान का अनुकरण करें',
    ok: 'भुगतान प्राप्त हुआ – धन्यवाद!', okText: 'आचार्य नंदराम आपकी रीडिंग शुरू करेंगे। डिलीवरी समय के भीतर यह आपको ईमेल और WhatsApp पर मिलेगी। स्थिति "मेरा खाता" में देख सकते हैं।',
    sigPhotos: 'हस्ताक्षर की फ़ोटो WhatsApp पर भेजें', account: 'मेरा खाता', another: 'एक और रीडिंग लें', family: 'परिवार का सदस्य जोड़ें',
    personErr: 'ये विवरण सहेजे नहीं जा सके। कृपया नाम अंग्रेज़ी अक्षरों (A–Z) में लिखें और जन्म तिथि जाँचें।', personNotFound: 'वह सहेजा गया व्यक्ति नहीं मिला। कृपया फिर से चुनें।', limit: 'सहेजे गए व्यक्तियों की सीमा पूरी हो गई। मेरा खाता → मेरा परिवार में से किसी को हटाएं।',
    loading: 'लोड हो रहा है…', notFound: 'यह रीडिंग अभी उपलब्ध नहीं है।', loginRequired: 'कृपया पहले खाता बनाएं या साइन इन करें।',
  },
};

/** Labels for the booking boxes (same wording as the service pages). */
export const FIELD_LABEL = {
  en: {
    businessName: 'Business / brand names (current or proposed, up to 5 – one per line)', launchDate: 'Business opening date – done or planned (optional)', partners: 'Business partners – name and date of birth, one per line (optional)', brand: 'Brand colours, logo idea or tagline (optional)', mobileBiz: 'Business mobile number (optional)', bizType: 'Type of business (optional)', clientName: 'Full name (spelling you use)', dob: 'Date of birth', dobBaby: "Baby's date of birth", gender: 'Gender',
    maritalStatus: 'Marital Status',
    tob: 'Time of birth (optional)', pob: 'Place of birth (City, State / Country)', mobile: 'Mobile number to analyse (optional)', mobileMain: 'Current mobile number', currentName: 'Your name as you write it now', parents: "Father's and mother's names (optional)", letters: 'Preferred starting letters (optional)', partnerName: "Partner / Spouse's full name", partnerDob: "Partner / Spouse's date of birth", business: 'Business / brand names you are considering', businesses: 'Businesses or work you are considering (optional)',
    challenges: 'Problems & Challenges You Are Facing (Career, Marriage, Health, Wealth, Obstacles)',
    challengesHint: 'Please share your key concerns so Acharya Nandram can identify their root numerological cause and prescribe remedies.',
    questions: 'Your Specific Questions to Acharya Nandram (up to 3 questions)',
    bizQuestions: 'Capital you can invest, current work and your questions (optional)', signedAs: 'Name exactly as you sign it (e.g. R. Sharma)', sigQuestions: 'Profession, goals and questions (optional)', male: 'Male', female: 'Female'
  },
  hi: {
    businessName: 'व्यवसाय / ब्रांड के नाम (वर्तमान या प्रस्तावित, अधिकतम 5 – हर पंक्ति में एक)', launchDate: 'व्यवसाय शुरू होने की तिथि – हो चुकी या योजना (वैकल्पिक)', partners: 'व्यवसाय साझेदार – नाम और जन्म तिथि, हर पंक्ति में एक (वैकल्पिक)', brand: 'ब्रांड रंग, लोगो विचार या टैगलाइन (वैकल्पिक)', mobileBiz: 'व्यवसायिक मोबाइल नंबर (वैकल्पिक)', bizType: 'व्यवसाय का प्रकार (वैकल्पिक)', clientName: 'पूरा नाम (जिस वर्तनी में आप लिखते हैं)', dob: 'जन्म तिथि', dobBaby: 'शिशु की जन्म तिथि', gender: 'लिंग',
    maritalStatus: 'वैवाहिक स्थिति',
    tob: 'जन्म समय (वैकल्पिक)', pob: 'जन्म स्थान (शहर, राज्य / देश)', mobile: 'विश्लेषण हेतु मोबाइल नंबर (वैकल्पिक)', mobileMain: 'वर्तमान मोबाइल नंबर', currentName: 'आपका नाम, जैसे आप अभी लिखते हैं', parents: 'पिता और माता के नाम (वैकल्पिक)', letters: 'पसंदीदा आरंभिक अक्षर (वैकल्पिक)', partnerName: 'जीवनसाथी / पार्टनर का पूरा नाम', partnerDob: 'जीवनसाथी / पार्टनर की जन्म तिथि', business: 'व्यवसाय / ब्रांड के नाम जिन पर आप विचार कर रहे हैं', businesses: 'जिन व्यवसायों या कामों पर आप विचार कर रहे हैं (वैकल्पिक)',
    challenges: 'वर्तमान समस्याएँ व चुनौतियाँ (करियर, वैवाहिक जीवन, स्वास्थ्य, धन, बाधाएं)',
    challengesHint: 'कृपया अपनी प्रमुख समस्याओं को विस्तार से लिखें ताकि आचार्य नंदराम इनके मूल कारणों का विश्लेषण कर सटीक उपाय दे सकें।',
    questions: 'आचार्य नंदराम से पूछने हेतु आपके विशिष्ट प्रश्न (अधिकतम 3 प्रश्न)',
    bizQuestions: 'निवेश योग्य पूँजी, वर्तमान काम और आपके प्रश्न (वैकल्पिक)', signedAs: 'हस्ताक्षर में जैसे नाम लिखते हैं (जैसे R. Sharma)', sigQuestions: 'पेशा, लक्ष्य और प्रश्न (वैकल्पिक)', male: 'पुरुष', female: 'महिला'
  },
};
