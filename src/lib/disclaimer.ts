/**
 * Numerology disclaimer – one source for the website (/disclaimer, short notices) and the PDF report.
 * The English text is the binding version; Hindi is a convenience translation.
 */
export type DisclaimerPoint = { h: string; p: string };

export const DISCLAIMER = {
  en: {
    title: 'Numerology Disclaimer',
    heading: 'Important disclaimer',
    short: 'Numerology is traditional guidance, not a guaranteed prediction or a proven science. It is not a substitute for medical, legal, financial or other professional advice.',
    readMore: 'Read the full disclaimer',
    agree: 'By continuing you agree to our Terms of Service and Numerology Disclaimer.',
    points: [
      { h: 'Guidance, not certainty', p: 'Numerology is a traditional system that interprets the numbers in your name and date of birth. Our readings, reports, calculators and consultations describe tendencies and possibilities. They are not guaranteed predictions and are not scientifically proven.' },
      { h: 'Not professional advice', p: 'Nothing on this website or in any report is medical, mental-health, legal, financial, tax or investment advice. Do not start, change or stop any treatment, medicine, investment or legal step based only on numerology. Always consult a qualified professional.' },
      { h: 'Your decisions are your own', p: 'You remain fully responsible for the decisions you make, including about health, money, career, marriage, relationships, property and travel. Please use numerology as one input alongside your own judgement.' },
      { h: 'Name, number and date suggestions', p: 'Suggestions for name spellings, mobile or vehicle numbers, business names and dates are traditional recommendations. An official change of name or business name needs the proper legal process, and you should check practical, legal and trademark aspects yourself.' },
      { h: 'Remedies and gemstones', p: 'Remedies, colours, mantras and gemstones are traditional suggestions and their effects differ from person to person. Consult a qualified gemologist before buying or wearing any gemstone, and a doctor for any health concern.' },
      { h: 'How reports are prepared', p: 'Reports and calculator results are prepared with our numerology method from the details you provide. If a name, spelling or date of birth is wrong, the result will also be wrong, so please check your details before you submit them.' },
      { h: 'No guarantee of results', p: 'We do not promise or guarantee any particular outcome – for example in marriage, children, job, business, wealth, health, exams or legal matters. Our liability is limited as set out in our Terms of Service and Refund Policy.' },
      { h: 'Age and consent', p: 'Our services are for adults (18+). Reports or name suggestions for a child must be requested by a parent or legal guardian. Please only enter another person’s details with their permission.' },
    ] as DisclaimerPoint[],
  },
  hi: {
    title: 'अंक ज्योतिष अस्वीकरण',
    heading: 'महत्वपूर्ण अस्वीकरण',
    short: 'अंक ज्योतिष पारंपरिक मार्गदर्शन है, यह न तो निश्चित भविष्यवाणी है और न ही प्रमाणित विज्ञान। यह चिकित्सा, कानूनी, वित्तीय या अन्य पेशेवर सलाह का विकल्प नहीं है।',
    readMore: 'पूरा अस्वीकरण पढ़ें',
    agree: 'आगे बढ़कर आप हमारी सेवा की शर्तों और अंक ज्योतिष अस्वीकरण से सहमत होते हैं।',
    points: [
      { h: 'मार्गदर्शन, निश्चितता नहीं', p: 'अंक ज्योतिष एक पारंपरिक पद्धति है जो आपके नाम और जन्मतिथि के अंकों की व्याख्या करती है। हमारी रीडिंग, रिपोर्ट, कैलकुलेटर और परामर्श संभावनाओं और प्रवृत्तियों का वर्णन करते हैं। ये निश्चित भविष्यवाणी नहीं हैं और वैज्ञानिक रूप से प्रमाणित नहीं हैं।' },
      { h: 'पेशेवर सलाह नहीं', p: 'इस वेबसाइट या किसी रिपोर्ट की कोई भी बात चिकित्सा, मानसिक स्वास्थ्य, कानूनी, वित्तीय, कर या निवेश सलाह नहीं है। केवल अंक ज्योतिष के आधार पर कोई इलाज, दवा, निवेश या कानूनी कदम शुरू, बदलें या बंद न करें। हमेशा योग्य विशेषज्ञ से सलाह लें।' },
      { h: 'निर्णय आपके अपने हैं', p: 'स्वास्थ्य, धन, करियर, विवाह, संबंध, संपत्ति और यात्रा सहित अपने सभी निर्णयों की पूरी ज़िम्मेदारी आपकी है। कृपया अंक ज्योतिष को अपने विवेक के साथ एक सहायक जानकारी के रूप में उपयोग करें।' },
      { h: 'नाम, नंबर और तिथि सुझाव', p: 'नाम की वर्तनी, मोबाइल या वाहन नंबर, व्यवसाय के नाम और तिथियों के सुझाव पारंपरिक अनुशंसाएँ हैं। नाम या व्यवसाय के नाम में आधिकारिक बदलाव के लिए उचित कानूनी प्रक्रिया आवश्यक है, और व्यावहारिक, कानूनी व ट्रेडमार्क पहलुओं की जाँच आप स्वयं करें।' },
      { h: 'उपाय और रत्न', p: 'उपाय, रंग, मंत्र और रत्न पारंपरिक सुझाव हैं और इनका प्रभाव हर व्यक्ति पर अलग हो सकता है। कोई भी रत्न ख़रीदने या पहनने से पहले योग्य रत्न विशेषज्ञ से और किसी भी स्वास्थ्य समस्या के लिए डॉक्टर से सलाह लें।' },
      { h: 'रिपोर्ट कैसे तैयार होती है', p: 'रिपोर्ट और कैलकुलेटर परिणाम आपके दिए गए विवरण से हमारी अंक ज्योतिष पद्धति द्वारा तैयार किए जाते हैं। यदि नाम, वर्तनी या जन्मतिथि गलत है, तो परिणाम भी गलत होगा, इसलिए जमा करने से पहले अपना विवरण जाँच लें।' },
      { h: 'परिणाम की कोई गारंटी नहीं', p: 'हम किसी विशेष परिणाम का वादा या गारंटी नहीं देते – जैसे विवाह, संतान, नौकरी, व्यवसाय, धन, स्वास्थ्य, परीक्षा या कानूनी मामलों में। हमारी ज़िम्मेदारी हमारी सेवा की शर्तों और रिफ़ंड नीति के अनुसार सीमित है।' },
      { h: 'आयु और सहमति', p: 'हमारी सेवाएँ वयस्कों (18+) के लिए हैं। बच्चे के लिए रिपोर्ट या नाम सुझाव माता-पिता या कानूनी अभिभावक द्वारा ही माँगे जाएँ। किसी अन्य व्यक्ति का विवरण केवल उनकी अनुमति से दर्ज करें।' },
    ] as DisclaimerPoint[],
  },
};
