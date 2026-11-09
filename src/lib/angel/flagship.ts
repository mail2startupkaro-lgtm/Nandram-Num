/** Hand-written content for the most-searched angel numbers. Other numbers are generated from their digits. */
export interface Flagship {
  title: string; // short theme shown in hero
  summary: string;
  meaning: string[];
  spiritual: string;
  love: string;
  twin: string;
  career: string;
  hindi: string;
  faqs?: { q: string; a: string }[];
}

export const FLAGSHIP: Record<string, Flagship> = {
  '222': {
    title: 'Trust, balance and divine timing',
    summary: 'Angel number 222 means balance, trust and patience. It is a reassurance that things are coming together for you, in relationships, work or a decision you are waiting on, and it asks you to keep faith and cooperate rather than force results.',
    meaning: [
      '222 repeats the number 2 three times. Two is the number of the Moon in Indian numerology: emotion, intuition, partnership and harmony. Repeated three times, the message becomes stronger and calmer at the same time: stay balanced, stay kind, and trust that the seeds you have planted are growing.',
      'People usually notice 222 during a waiting period, after an application, while a relationship is still taking shape, or when a family situation needs patience. The number does not promise a specific outcome; it reminds you that steady, cooperative effort and a peaceful mind give you the best chance of a good one.',
    ],
    spiritual: 'Spiritually, 222 is a sign of faith. Many readers see it as a nudge from their guides to stop worrying about how things will work out and to keep doing their part with an open heart. It is a good time for prayer, gratitude and calm decisions.',
    love: 'In love, 222 points to harmony and commitment. If you are in a relationship, it asks for patience, honest conversation and compromise. If you are single, it suggests that the right partnership comes through being balanced in yourself first, and it is not a time to chase someone who does not meet you halfway.',
    twin: 'For twin flames, 222 is one of the best-known union numbers. It signals that both people are moving towards balance. If you are separated, it asks you to focus on your own healing instead of forcing contact.',
    career: 'At work, 222 favours teamwork, partnerships and diplomacy. Results may come slowly, but cooperation, good relations with seniors and patient follow-up will help. Financially it is a time to balance spending and saving rather than take big risks.',
    hindi: '222 एंजेल नंबर संतुलन, धैर्य और विश्वास का संदेश देता है। अंक 2 चंद्रमा का अंक है, जो भावना और साझेदारी से जुड़ा है। जब आप बार-बार 222 देखते हैं, तो इसका अर्थ है कि आपकी मेहनत और प्रार्थनाएँ धीरे-धीरे फल दे रही हैं – जल्दबाज़ी न करें, रिश्तों में मधुरता रखें और सही समय पर भरोसा रखें।',
    faqs: [{ q: 'Is 222 a good sign for marriage?', a: 'In numerology 222 is a supportive sign for partnership and marriage because it is the number of harmony and commitment. It is still wise to check both partners\' Moolank and Bhagyank compatibility before a big decision.' }],
  },
  '777': {
    title: 'Spiritual awakening and good fortune',
    summary: 'Angel number 777 means spiritual awakening, inner wisdom and good fortune. It is widely read as confirmation that you are on the right path, that your learning and inner work are paying off, and that luck and blessings are supporting you.',
    meaning: [
      '777 is the number 7 repeated three times. Seven is the number of inner wisdom, study, intuition and faith. In Indian numerology it is ruled by Ketu, the planet of detachment and spiritual insight. Tripled, it is one of the most positive numbers in angel-number tradition.',
      'People often see 777 after a period of learning, self-reflection or spiritual practice. It encourages you to keep trusting your intuition, keep studying and keep going, because the path you have chosen is sound.',
    ],
    spiritual: 'Spiritually, 777 is a strong sign of awakening. It suggests your intuition is sharp and your connection with the divine is growing. Meditation, scripture, mantra jaap or quiet time in nature can deepen what you are already feeling.',
    love: 'In love, 777 points to a deep, soulful bond rather than a casual one. Couples may feel closer through shared values or spiritual practice. Singles may first need time alone to understand what they truly want; the right person tends to arrive once you are clear within.',
    twin: 'For twin flames, 777 marks spiritual growth on both sides. It often appears when inner work is bringing the connection to a more mature stage.',
    career: 'For career, 777 favours research, analysis, teaching, healing, technology and any work that needs expertise. It is also read as a lucky sign for exams and for decisions based on careful study. Money tends to follow mastery here, not shortcuts.',
    hindi: '777 एंजेल नंबर आध्यात्मिक जागृति, आंतरिक ज्ञान और सौभाग्य का प्रतीक है। अंक 7 केतु का अंक है। जब 777 बार-बार दिखे, तो समझें कि आप सही मार्ग पर हैं – अपने अंतर्ज्ञान पर भरोसा रखें, ध्यान और अध्ययन जारी रखें, आशीर्वाद आपके साथ है।',
    faqs: [{ q: 'Is 777 a lucky number?', a: 'Yes. 777 is one of the most widely regarded lucky angel numbers. In the Bible, 7 is the number of completeness, and in numerology triple 7 stands for wisdom, luck and spiritual progress.' }],
  },
  '444': {
    title: 'Protection, stability and strong foundations',
    summary: 'Angel number 444 means protection, stability and hard work that is being supported. It is a sign that you are safe and guided, and that the foundation you are building, in career, home or health habits, is solid. Keep going with discipline.',
    meaning: [
      '444 is the number 4 repeated three times. Four is the number of foundations: order, discipline, patience and practical effort. Western angel-number writers link 444 especially with protection, the sense that your angels are surrounding you. In Indian numerology 4 is ruled by Rahu, which rewards structure and honest hard work.',
      'You may notice 444 when you are tired of putting in effort without visible results. The number says the effort is not wasted. It asks you to stay organised, keep your routine and trust that a strong base is forming.',
    ],
    spiritual: 'Spiritually, 444 is a number of reassurance and protection. Many people see it during difficult or uncertain times as a sign that they are not alone. Grounding practices such as a fixed daily prayer, walking barefoot on grass or a simple routine help you feel that support.',
    love: 'In love, 444 points to loyalty, security and commitment. It favours relationships built on trust and steady effort. Singles are encouraged to look for stability and reliability rather than excitement alone.',
    twin: 'For twin flames, 444 suggests building a stable, practical base. It is a sign to work on your own foundations, emotional and financial, so the connection can rest on solid ground.',
    career: 'For career and money, 444 is excellent for planning, property, engineering, finance and long-term projects. It favours discipline, budgeting and patient progress over quick gains or shortcuts.',
    hindi: '444 एंजेल नंबर सुरक्षा, स्थिरता और मेहनत का संदेश है। अंक 4 राहु का अंक है, जो अनुशासन और मज़बूत नींव से जुड़ा है। बार-बार 444 दिखने का अर्थ है कि आप सुरक्षित हैं और आपकी मेहनत बेकार नहीं जा रही – धैर्य से अपना काम करते रहें।',
  },
  '1111': {
    title: 'Manifestation and a powerful new beginning',
    summary: '1111 (or 11:11) means alignment, manifestation and new beginnings. It is one of the most famous angel numbers and is read as a sign that your thoughts are shaping your reality quickly, so focus them on what you truly want.',
    meaning: [
      '1111 repeats the number 1 four times and contains the master number 11 twice. One is the Sun: initiative, self-belief and fresh starts. Master number 11 adds intuition and spiritual insight. Together they create a strong "doorway" moment, which is why so many people make a wish when they see 11:11 on the clock.',
      '1111 often appears when you are about to start something new, a job, a relationship, a move, or a new way of thinking. It asks you to notice your thoughts, keep them positive and act on the opportunity in front of you.',
    ],
    spiritual: 'Spiritually, 1111 is linked with awakening and synchronicity. It suggests that your intuition and the universe are in sync. Many people use the moment to set an intention, say a short prayer or repeat a mantra.',
    love: 'In love, 1111 signals a new beginning. Singles may meet someone important or feel ready to love again. Couples may move to a new stage, such as engagement, marriage or a fresh start after a rough patch. Keep your intentions clear and kind.',
    twin: 'For twin flames, 1111 is famous as the "awakening" number, often seen around the first meeting or recognition of a deep connection.',
    career: 'For career, 1111 favours new projects, leadership roles and starting your own work. It is a good sign for launching ideas, but it also asks you to back your thoughts with action and planning.',
    hindi: '1111 एंजेल नंबर नई शुरुआत और मैनिफेस्टेशन का प्रतीक है। इसमें अंक 1 (सूर्य) और मास्टर नंबर 11 की ऊर्जा है। जब आप 11:11 या 1111 देखें, तो अपने विचार सकारात्मक रखें और अपनी इच्छा स्पष्ट रूप से मन में दोहराएँ – यह नए अवसर का संकेत है।',
    faqs: [{ q: 'What does it mean to see 11:11 on the clock?', a: 'Seeing 11:11 is the most common form of angel number 1111. It is traditionally read as a moment of alignment – a good time to pause, set a clear positive intention and take one step towards it.' }],
  },
  '333': {
    title: 'Growth, creativity and divine support',
    summary: 'Angel number 333 means growth, creativity and support from above. It is a sign that your guides are close, that you are encouraged to express yourself, and that your mind, body and spirit are coming into balance.',
    meaning: [
      '333 is the number 3 repeated three times. Three is ruled by Jupiter (Guru) in Indian numerology: wisdom, expansion, optimism and creativity. Angel-number writers often link 333 with the presence of ascended masters and teachers.',
      'People see 333 when they need encouragement to speak up, create or teach. It asks you to share your ideas, trust your talents and grow beyond your comfort zone.',
    ],
    spiritual: 'Spiritually, 333 is a sign of blessings and guidance. It is a good time to respect your teachers, study scripture, or start a regular spiritual practice. Thursday, Jupiter\'s day, is traditional for such beginnings.',
    love: 'In love, 333 brings warmth, joy and open communication. Couples are encouraged to talk honestly and have fun together. Singles may meet someone through learning, travel or creative activities.',
    twin: 'For twin flames, 333 points to growth through honest expression. It encourages both people to grow individually so the bond can grow too.',
    career: 'For career, 333 favours teaching, writing, media, design, consulting and anything creative. It is a sign that expansion and recognition are possible if you share your skills.',
    hindi: '333 एंजेल नंबर विकास, रचनात्मकता और ईश्वरीय सहायता का संकेत है। अंक 3 गुरु (बृहस्पति) का अंक है। 333 दिखने का अर्थ है कि आपके मार्गदर्शक आपके साथ हैं – अपनी प्रतिभा को व्यक्त करें, सीखते रहें और आगे बढ़ें।',
  },
  '555': {
    title: 'Big change and new freedom',
    summary: 'Angel number 555 means major change is coming. It is a sign to release what no longer fits and welcome transformation, in career, relationships or lifestyle, with an open, flexible mind.',
    meaning: [
      '555 is the number 5 repeated three times. Five is ruled by Mercury (Budh): movement, communication, travel, business and freedom. Tripled, it signals a significant shift rather than a small one.',
      'You may notice 555 before a job change, a move, a relationship transition or a change in beliefs. It does not say the change will be easy, but it suggests the change is needed and can work in your favour if you stay adaptable.',
    ],
    spiritual: 'Spiritually, 555 is about transformation. Old habits, fears or attachments may fall away. Trust the process and keep your daily practice steady while outer life moves.',
    love: 'In love, 555 can mean a new person, a new phase or a change in the way you relate. Couples may need more freedom, fun and honest communication. Singles may meet someone unexpected, often while travelling or trying something new.',
    twin: 'For twin flames, 555 often appears during movement in the connection: a shift after separation, or a change that brings both people closer to reunion.',
    career: 'For career, 555 favours business, sales, marketing, media and travel. A new opportunity may need a quick decision. Financially, stay flexible but avoid impulsive spending or risky speculation.',
    hindi: '555 एंजेल नंबर बड़े बदलाव का संकेत है। अंक 5 बुध का अंक है – स्वतंत्रता, यात्रा और व्यापार। 555 बार-बार दिखे तो पुरानी आदतों को छोड़ें और नए अवसरों के लिए तैयार रहें, लेकिन जल्दबाज़ी में बड़े फैसले न लें।',
  },
  '1212': {
    title: 'Step out of your comfort zone',
    summary: 'Angel number 1212 means trust yourself and step into a new phase. It combines new beginnings (1) with balance and faith (2), encouraging you to leave old habits behind and move forward with optimism.',
    meaning: [
      '1212 is a mirror pattern that alternates 1 and 2. One is the Sun: initiative and self-belief. Two is the Moon: trust and partnership. The repetition "1-2, 1-2" feels like walking forward step by step, which is exactly its message.',
      'It also contains 12, which reduces to 3, the number of growth, and the whole sequence adds up to 6, the number of home and love. So 1212 is often read as growth that improves your personal and family life.',
    ],
    spiritual: 'Spiritually, 1212 asks you to keep a positive outlook and trust your path, even if the next step feels unfamiliar. Your intuition is guiding you to grow.',
    love: 'In love, 1212 encourages balance between independence and togetherness. It is a good sign for moving a relationship forward, as long as both people are honest about what they want.',
    twin: 'For twin flames, 1212 is read as a sign that both people are progressing towards union by growing individually.',
    career: 'For career, 1212 favours learning new skills, accepting a new role or starting a side project. Leave your comfort zone step by step; partners and mentors can help.',
    hindi: '1212 एंजेल नंबर का अर्थ है – अपने आप पर विश्वास रखें और अगले कदम के लिए तैयार रहें। अंक 1 नई शुरुआत और अंक 2 विश्वास का प्रतीक है। यह संकेत है कि आप अपने कम्फर्ट ज़ोन से बाहर निकलकर आगे बढ़ें।',
  },
  '2222': {
    title: 'Harmony and things falling into place',
    summary: 'Angel number 2222 means harmony, faith and things falling into place. It is an even stronger form of 222 and contains master number 22, the master builder, so it promises that patient, cooperative effort is turning into something real.',
    meaning: [
      '2222 repeats the number 2 four times. Two is the Moon: emotion, partnership, trust and patience. It also contains master number 22 twice, the "master builder" that turns dreams into lasting results.',
      'People often see 2222 when a long-awaited situation is nearing resolution. The message is to stay calm, keep relationships peaceful and trust the timing.',
    ],
    spiritual: 'Spiritually, 2222 is a sign of deep faith and alignment. It encourages gratitude and a peaceful mind. What you have prayed for may already be on its way.',
    love: 'In love, 2222 is one of the most positive numbers. It points to harmony, reconciliation and commitment. Singles may find a balanced, supportive partner.',
    twin: 'For twin flames, 2222 is read as a strong union or reunion sign, built on mutual balance.',
    career: 'For career, 2222 supports partnerships, agreements and long-term projects. Contracts and collaborations are favoured when both sides benefit.',
    hindi: '2222 एंजेल नंबर सामंजस्य और विश्वास का प्रतीक है। इसमें मास्टर नंबर 22 भी है, जो सपनों को साकार करने की शक्ति देता है। इसका अर्थ है – धैर्य रखें, सब कुछ सही दिशा में बढ़ रहा है।',
  },
  '111': {
    title: 'Manifestation and new starts',
    summary: 'Angel number 111 means new beginnings and manifestation. It is a sign that your thoughts are powerful right now, so focus them on what you want, and take the first step towards a fresh start.',
    meaning: [
      '111 is the number 1 repeated three times. One is the number of the Sun in Indian numerology: confidence, leadership, independence and initiative. Tripled, it highlights the link between your thoughts and your results.',
      '111 often appears when you are thinking about starting something: a business, a course, a relationship or a new habit. It encourages self-belief and positive thinking, backed by action.',
    ],
    spiritual: 'Spiritually, 111 is an awakening number. It asks you to notice your thoughts and choose them consciously. Sunday morning Surya namaskar or offering water to the Sun is a traditional way to strengthen the energy of 1.',
    love: 'In love, 111 points to new beginnings and self-love. Singles may be ready to start fresh; couples may enter a new stage. Avoid ego clashes and lead with kindness.',
    twin: 'For twin flames, 111 often marks the first recognition or the start of a new phase in the connection.',
    career: 'For career, 111 is excellent for leadership, entrepreneurship and new projects. It favours bold but well-planned moves.',
    hindi: '111 एंजेल नंबर नई शुरुआत और मैनिफेस्टेशन का संकेत है। अंक 1 सूर्य का अंक है। 111 दिखे तो अपने विचारों पर ध्यान दें, सकारात्मक सोचें और नया काम शुरू करने का साहस रखें।',
  },
  '666': {
    title: 'Rebalance – not a bad omen',
    summary: 'Angel number 666 means rebalance your thoughts and priorities. In angel-number tradition it is not an evil sign; it asks you to shift focus from worry, especially about money and material things, towards care, family and inner peace.',
    meaning: [
      '666 is the number 6 repeated three times. Six is ruled by Venus (Shukra): love, home, beauty, comfort and responsibility. When 6 is tripled, the message is about balance between material life and the heart.',
      'Many people feel anxious seeing 666 because of its association with "the number of the beast" in the Book of Revelation (13:18). In angel-number interpretation it is read differently: as a gentle correction, asking you to release fear and look after yourself and your relationships.',
    ],
    spiritual: 'Spiritually, 666 asks you to realign: reduce worry, practise gratitude and reconnect with what really matters. It is a reminder, not a punishment.',
    love: 'In love, 666 highlights care and responsibility. It may point to imbalance, one person giving too much, or neglect of the relationship because of work or money stress. Restore balance with time and attention.',
    twin: 'For twin flames, 666 suggests healing old wounds and balancing give-and-take before the connection can move forward.',
    career: 'For career and money, 666 asks you not to let financial worry take over. Plan sensibly, avoid fear-based decisions and remember that your health and family are part of your wealth.',
    hindi: '666 एंजेल नंबर कोई अशुभ संकेत नहीं है। अंक 6 शुक्र का अंक है – प्रेम, परिवार और सुख। 666 दिखने का अर्थ है कि अपने विचारों और प्राथमिकताओं में संतुलन लाएँ, पैसों की चिंता कम करें और परिवार व स्वयं का ध्यान रखें।',
    faqs: [{ q: 'Is 666 a bad angel number?', a: 'No. In angel-number tradition 666 is a call to rebalance – to move from worry and material stress towards love, gratitude and self-care. Its biblical association is a different context and is not how numerologists read it.' }],
  },
  '1010': {
    title: 'Spiritual growth and a new chapter',
    summary: 'Angel number 1010 means spiritual growth and stepping into a new chapter. It combines the new-beginning energy of 1 with the infinite potential of 0, encouraging you to trust your path and stay positive.',
    meaning: [
      '1010 alternates 1 and 0. One is the Sun: initiative and self-belief. Zero is wholeness and divine connection, and it amplifies the 1. Together they say that a new beginning is supported from above.',
      'It is often seen as 10:10 on the clock. The digits add up to 2, adding a note of patience and trust to the fresh start.',
    ],
    spiritual: 'Spiritually, 1010 is an awakening number. It encourages meditation, self-reflection and listening to intuition as you move into a new phase.',
    love: 'In love, 1010 suggests a fresh start: either a new relationship or a renewed one. Keep your heart open and your expectations realistic.',
    twin: 'For twin flames, 1010 is read as spiritual growth that prepares both people for the next stage.',
    career: 'For career, 1010 favours new projects, self-employment and leadership, backed by a clear plan and faith in your abilities.',
    hindi: '1010 एंजेल नंबर आध्यात्मिक विकास और नए अध्याय का संकेत है। अंक 1 नई शुरुआत और अंक 0 ईश्वरीय शक्ति का प्रतीक है। इसका अर्थ है कि आप सही दिशा में हैं, सकारात्मक रहें।',
  },
  '888': {
    title: 'Abundance and rewards for effort',
    summary: 'Angel number 888 means abundance, prosperity and reward for honest effort. It is a strong money and success number, reminding you that what you give comes back to you through karma.',
    meaning: [
      '888 is the number 8 repeated three times. Eight is the number of abundance, authority and karma. In Indian numerology it is ruled by Saturn (Shani), the planet that rewards discipline and patience.',
      'You may see 888 when your hard work is about to pay off: a promotion, a business result, a financial improvement. It also reminds you to use success wisely and fairly.',
    ],
    spiritual: 'Spiritually, 888 is a karmic number. It encourages generosity and integrity. Saturday daan (donation) or serving others is a traditional way to honour the energy of 8.',
    love: 'In love, 888 points to mature, stable relationships and balance between giving and receiving. It is a good sign for commitment.',
    twin: 'For twin flames, 888 marks karmic balance: lessons learned and the connection moving to a healthier stage.',
    career: 'For career and money, 888 is excellent for finance, management, property and business growth. Keep your discipline and avoid shortcuts.',
    hindi: '888 एंजेल नंबर धन, समृद्धि और मेहनत के फल का संकेत है। अंक 8 शनि का अंक है, जो कर्म का फल देता है। 888 दिखे तो अपनी मेहनत और ईमानदारी जारी रखें – सफलता निकट है।',
  },
  '999': {
    title: 'Completion and a higher purpose',
    summary: 'Angel number 999 means completion. A chapter of your life is closing so a new, more meaningful one can begin. It asks you to let go with gratitude and to follow your higher purpose.',
    meaning: [
      '999 is the number 9 repeated three times. Nine is the last single digit, so it marks endings, wisdom and fulfilment. Ruled by Mars (Mangal) in Indian numerology, it also carries courage and the drive to serve.',
      'People see 999 when a job, relationship or phase is ending, or when they feel called to more meaningful work. It encourages closure, forgiveness and readiness for what is next.',
    ],
    spiritual: 'Spiritually, 999 is a call to service and compassion. It is a good time to finish pending karmic tasks, forgive, and give back.',
    love: 'In love, 999 may signal the end of a pattern or a relationship that has run its course, or the maturing of a bond into something deeper. Let go of what no longer serves you, with kindness.',
    twin: 'For twin flames, 999 suggests the completion of a karmic cycle before a new stage begins.',
    career: 'For career, 999 favours finishing projects, moving on to a new role or choosing work with a sense of purpose, such as healing, teaching or service.',
    hindi: '999 एंजेल नंबर पूर्णता का संकेत है। अंक 9 मंगल का अंक है। इसका अर्थ है कि जीवन का एक अध्याय समाप्त हो रहा है ताकि नया और बेहतर अध्याय शुरू हो सके – पुरानी बातों को छोड़ें और आगे बढ़ें।',
  },
  '000': {
    title: 'Infinite potential and a fresh start',
    summary: 'Angel number 000 means infinite potential and a completely fresh start. It is a sign of oneness with the divine and a reminder that you can begin again.',
    meaning: [
      '000 repeats zero, the circle with no beginning and no end. It represents wholeness, potential and the source of all numbers.',
      'Seeing 000 is a reminder that endings and beginnings are connected. It is a good time to pause, reflect and set a new direction.',
    ],
    spiritual: 'Spiritually, 000 is a strong sign of divine connection. Meditation and prayer are especially meaningful now.',
    love: 'In love, 000 suggests a clean slate: let go of old patterns and begin with honesty.',
    twin: 'For twin flames, 000 symbolises the oneness of the soul connection.',
    career: 'For career, 000 is a blank page. Plan carefully before you choose your next move; every option is open.',
    hindi: '000 एंजेल नंबर अनंत संभावना और नई शुरुआत का प्रतीक है। यह ईश्वर से जुड़ाव का संकेत है – रुककर सोचें और नई दिशा तय करें।',
  },
  '911': {
    title: 'A higher calling and an ending that leads to a beginning',
    summary: 'Angel number 911 means a chapter is closing (9) so a new beginning (1) can start. It is often read as a call to follow your purpose and to lead by example.',
    meaning: [
      '911 combines 9, the number of completion and service, with 11, the master number of intuition and spiritual insight. It is a strong number of transition.',
      'The digits add up to 11, reinforcing its spiritual message. It asks you to finish what is ending with grace and step into the new phase with confidence.',
    ],
    spiritual: 'Spiritually, 911 is a call to purpose. Your intuition is strong; use it to serve others as well as yourself.',
    love: 'In love, 911 may mean the end of an old pattern and the start of a more aligned relationship.',
    twin: 'For twin flames, 911 marks a turning point, often an ending that makes reunion possible.',
    career: 'For career, 911 favours leadership, purpose-driven work and new starts after a project or job ends.',
    hindi: '911 एंजेल नंबर का अर्थ है – एक अध्याय समाप्त होकर नई शुरुआत हो रही है। अंक 9 पूर्णता और 11 मास्टर नंबर है, जो अंतर्ज्ञान से जुड़ा है।',
  },
  '1234': {
    title: 'Step-by-step progress',
    summary: 'Angel number 1234 means progress step by step. It is a sign that you are moving in the right order, so keep it simple, keep going and trust the process.',
    meaning: [
      '1234 is a rising sequence: 1 (start), 2 (trust), 3 (growth), 4 (foundation). It reads like a staircase and encourages steady progress.',
      'Its digits add up to 10, which reduces to 1, so it ends where it began: a new beginning built on a solid plan.',
    ],
    spiritual: 'Spiritually, 1234 asks you to simplify. Focus on the next step rather than the whole journey.',
    love: 'In love, 1234 suggests a relationship growing naturally, step by step. Do not rush important milestones.',
    twin: 'For twin flames, 1234 points to gradual progress towards union.',
    career: 'For career, 1234 is excellent for planning, systems and steady growth. Break big goals into simple steps.',
    hindi: '1234 एंजेल नंबर क्रमिक प्रगति का संकेत है – एक-एक कदम आगे बढ़ें। यह बताता है कि आप सही क्रम में आगे बढ़ रहे हैं, धैर्य रखें।',
  },
};
