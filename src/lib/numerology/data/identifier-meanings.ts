/** Short meanings of a vehicle-number or house-number total (1–9), English and Hindi. */
type Row = { vehicle: string; house: string };
export const IDENTIFIER_MEANINGS: Record<'en' | 'hi', Record<number, Row>> = {
  en: {
    1: { vehicle: 'A leader\'s vehicle: confident, quick off the mark and good for people who drive for work or authority. Avoid ego on the road.', house: 'A home of independence and new beginnings. Suits leaders, entrepreneurs and people who want to stand on their own feet.' },
    2: { vehicle: 'A gentle, family vehicle: comfortable, safe and calm. Best for careful drivers; avoid rushing and moody driving.', house: 'A peaceful home for couples and partnerships. Supports affection and cooperation; keep it uncluttered to avoid mood swings.' },
    3: { vehicle: 'A fortunate, cheerful vehicle that supports travel for study, teaching, business and social life.', house: 'A lively, optimistic home that supports learning, creativity, children and respect in society.' },
    4: { vehicle: 'A hard-working, practical vehicle, but prone to sudden repairs and delays. Keep the service record and papers in perfect order.', house: 'A disciplined, hard-working home that builds stability slowly. Keep order and routine; avoid quarrels and clutter.' },
    5: { vehicle: 'A quick, lucky vehicle for business, sales and frequent travel. Avoid over-speeding and impulsive overtaking.', house: 'An active, social home full of movement and visitors. Good for business and communication; add routine for rest.' },
    6: { vehicle: 'A comfortable, attractive vehicle linked with luxury and family outings. Well suited to family use.', house: 'A loving, beautiful family home. Supports marriage, comfort, art and hospitality.' },
    7: { vehicle: 'A quiet vehicle for thoughtful people and long, calm journeys. Not ideal for a purely commercial vehicle.', house: 'A calm retreat for study, research and spiritual practice. Suits people who like privacy; make time for guests.' },
    8: { vehicle: 'A strong, heavy-duty vehicle that serves long and well when maintained with discipline. Drive patiently; avoid risk.', house: 'A home of ambition, authority and long-term wealth. Rewards discipline; keep finances and legal papers clean.' },
    9: { vehicle: 'An energetic, powerful vehicle. Good for sport, defence and active people; avoid anger and rash driving.', house: 'A warm, generous home full of energy and courage. Good for service and big-hearted families; avoid arguments.' },
  },
  hi: {
    1: { vehicle: 'नेतृत्व करने वालों का वाहन: आत्मविश्वासी, तेज़ और उन लोगों के लिए अच्छा जो काम या अधिकार के पद के लिए वाहन चलाते हैं। सड़क पर अहंकार से बचें।', house: 'स्वतंत्रता और नई शुरुआत का घर। नेतृत्व करने वालों, उद्यमियों और अपने पैरों पर खड़े होने वालों के लिए अनुकूल।' },
    2: { vehicle: 'सौम्य, पारिवारिक वाहन: आरामदायक, सुरक्षित और शांत। सावधान चालकों के लिए उत्तम; जल्दबाज़ी और मनोदशा में वाहन चलाने से बचें।', house: 'दंपतियों और साझेदारी के लिए शांत घर। स्नेह और सहयोग बढ़ाता है; मन के उतार-चढ़ाव से बचने के लिए इसे व्यवस्थित रखें।' },
    3: { vehicle: 'भाग्यशाली और प्रसन्न वाहन, जो पढ़ाई, शिक्षण, व्यवसाय और सामाजिक जीवन की यात्राओं में साथ देता है।', house: 'जीवंत और आशावादी घर, जो शिक्षा, रचनात्मकता, बच्चों और समाज में सम्मान को बढ़ाता है।' },
    4: { vehicle: 'मेहनती और व्यावहारिक वाहन, पर अचानक मरम्मत और देरी की संभावना। सर्विस रिकॉर्ड और काग़ज़ात पूरी तरह दुरुस्त रखें।', house: 'अनुशासित और मेहनती घर, जो धीरे-धीरे स्थिरता बनाता है। व्यवस्था और दिनचर्या रखें; झगड़ों और अव्यवस्था से बचें।' },
    5: { vehicle: 'व्यवसाय, सेल्स और बार-बार यात्रा के लिए तेज़ और शुभ वाहन। तेज़ रफ़्तार और आवेग में ओवरटेक करने से बचें।', house: 'सक्रिय और मिलनसार घर, जहाँ चहल-पहल और मेहमान रहते हैं। व्यवसाय और संवाद के लिए अच्छा; आराम के लिए दिनचर्या जोड़ें।' },
    6: { vehicle: 'आरामदायक और आकर्षक वाहन, जो सुख-सुविधा और पारिवारिक सैर से जुड़ा है। पारिवारिक उपयोग के लिए बहुत अनुकूल।', house: 'प्रेमपूर्ण और सुंदर पारिवारिक घर। विवाह, सुख-सुविधा, कला और आतिथ्य को बढ़ाता है।' },
    7: { vehicle: 'विचारशील लोगों और लंबी, शांत यात्राओं के लिए शांत वाहन। पूरी तरह व्यावसायिक वाहन के लिए आदर्श नहीं।', house: 'अध्ययन, शोध और साधना के लिए शांत आश्रय। एकांत पसंद लोगों के लिए अनुकूल; मेहमानों के लिए भी समय निकालें।' },
    8: { vehicle: 'मज़बूत और भारी काम का वाहन, जो अनुशासन से रखरखाव करने पर लंबे समय तक साथ देता है। धैर्य से चलाएँ; जोखिम से बचें।', house: 'महत्वाकांक्षा, अधिकार और दीर्घकालिक धन का घर। अनुशासन का फल देता है; वित्त और क़ानूनी काग़ज़ात साफ़ रखें।' },
    9: { vehicle: 'ऊर्जावान और शक्तिशाली वाहन। खेल, रक्षा सेवा और सक्रिय लोगों के लिए अच्छा; क्रोध और लापरवाही से वाहन चलाने से बचें।', house: 'ऊर्जा और साहस से भरा, स्नेही और उदार घर। सेवा और बड़े दिल वाले परिवारों के लिए अच्छा; बहस से बचें।' },
  },
};
