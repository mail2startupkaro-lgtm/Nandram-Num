/** Indian cities covered by the "Best Numerologist in <city>" blog series. Tier labels follow common usage (metro / Tier 2 / Tier 3), not an official list. */
export type Tier = 1 | 2 | 3;
export type Region = 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East';
export interface City { slug: string; name: string; state: string; tier: Tier; region: Region; alias?: string }
export interface StateInfo { region: Region; langs: string; festivals: string[]; t1?: string; t2?: string; t3?: string }

export const STATES: Record<string, StateInfo> = {
  Maharashtra: { region: 'West', langs: 'Marathi and Hindi', festivals: ['Gudi Padwa', 'Ganesh Chaturthi', 'Dussehra'],
    t1: 'Mumbai, Pune', t2: 'Nagpur, Nashik, Thane, Navi Mumbai, Chhatrapati Sambhajinagar, Solapur, Kolhapur, Amravati, Pimpri-Chinchwad, Kalyan-Dombivli, Vasai-Virar, Mira-Bhayandar',
    t3: 'Sangli, Jalgaon, Akola, Latur, Dhule, Ahilyanagar, Chandrapur, Parbhani, Jalna, Bhiwandi, Nanded, Satara, Beed, Yavatmal, Gondia, Wardha, Ratnagiri, Dharashiv, Bhusawal, Panvel, Ulhasnagar, Ambernath, Malegaon, Baramati, Ichalkaranji, Udgir, Buldhana, Hingoli, Washim, Nandurbar, Lonavala, Karad, Pandharpur, Shirdi' },
  'Uttar Pradesh': { region: 'North', langs: 'Hindi', festivals: ['Diwali', 'Holi', 'Navratri'],
    t2: 'Lucknow, Kanpur, Varanasi, Agra, Prayagraj, Meerut, Ghaziabad, Noida, Bareilly, Aligarh, Moradabad, Gorakhpur, Saharanpur, Mathura',
    t3: 'Firozabad, Jhansi, Muzaffarnagar, Ayodhya, Mirzapur, Etawah, Rampur, Shahjahanpur, Sultanpur, Hapur, Orai, Bahraich, Lakhimpur Kheri, Hardoi, Sitapur, Unnao, Rae Bareli, Budaun, Mainpuri, Farrukhabad, Basti, Deoria, Ballia, Azamgarh, Jaunpur, Banda, Fatehpur, Pilibhit, Sambhal, Amroha, Bulandshahr, Greater Noida, Mau, Ghazipur, Gonda, Lalitpur, Modinagar, Khurja, Vrindavan, Kasganj, Etah, Hathras, Chitrakoot, Barabanki, Kushinagar, Deoband, Najibabad' },
  Gujarat: { region: 'West', langs: 'Gujarati and Hindi', festivals: ['Navratri', 'Uttarayan', 'Diwali'],
    t1: 'Ahmedabad', t2: 'Surat, Vadodara, Rajkot, Gandhinagar, Bhavnagar, Jamnagar, Junagadh',
    t3: 'Anand, Nadiad, Morbi, Mehsana, Bharuch, Navsari, Valsad, Vapi, Porbandar, Surendranagar, Gandhidham, Bhuj, Palanpur, Patan, Godhra, Dahod, Amreli, Veraval, Botad, Ankleshwar, Himmatnagar, Kalol, Bardoli, Dwarka, Modasa' },
  Rajasthan: { region: 'North', langs: 'Hindi and Rajasthani', festivals: ['Gangaur', 'Teej', 'Diwali'],
    t2: 'Jaipur, Jodhpur, Udaipur, Kota, Ajmer, Bikaner',
    t3: 'Bhilwara, Alwar, Sikar, Bharatpur, Pali, Sri Ganganagar, Hanumangarh, Tonk, Chittorgarh, Beawar, Jhunjhunu, Barmer, Dausa, Banswara, Bundi, Churu, Sawai Madhopur, Jaisalmer, Nagaur, Hindaun, Pushkar, Dholpur, Karauli, Mount Abu, Kishangarh, Baran' },
  'Madhya Pradesh': { region: 'Central', langs: 'Hindi', festivals: ['Diwali', 'Navratri', 'Makar Sankranti'],
    t2: 'Indore, Bhopal, Jabalpur, Gwalior, Ujjain',
    t3: 'Sagar, Dewas, Satna, Ratlam, Rewa, Katni, Singrauli, Burhanpur, Khandwa, Bhind, Chhindwara, Guna, Shivpuri, Vidisha, Chhatarpur, Damoh, Mandsaur, Khargone, Neemuch, Pithampur, Narmadapuram, Itarsi, Sehore, Betul, Seoni, Datia, Nagda, Dhar, Morena, Balaghat, Mandla' },
  Karnataka: { region: 'South', langs: 'Kannada', festivals: ['Ugadi', 'Dasara', 'Diwali'],
    t1: 'Bengaluru', t2: 'Mysuru, Hubballi-Dharwad, Mangaluru, Belagavi, Kalaburagi',
    t3: 'Davanagere, Ballari, Vijayapura, Shivamogga, Tumakuru, Raichur, Bidar, Hassan, Udupi, Gadag, Chitradurga, Mandya, Chikkamagaluru, Hospet, Karwar, Bagalkot, Kolar, Ramanagara, Chikkaballapur, Madikeri, Koppal, Haveri' },
  'Tamil Nadu': { region: 'South', langs: 'Tamil', festivals: ['Pongal', 'Tamil New Year', 'Navaratri'],
    t1: 'Chennai', t2: 'Coimbatore, Madurai, Tiruchirappalli, Salem, Tiruppur, Erode, Tirunelveli',
    t3: 'Vellore, Thoothukudi, Dindigul, Thanjavur, Nagercoil, Karur, Hosur, Kanchipuram, Cuddalore, Kumbakonam, Tiruvannamalai, Pollachi, Rajapalayam, Sivakasi, Pudukkottai, Namakkal, Ooty, Krishnagiri, Karaikudi, Virudhunagar, Ambur, Nagapattinam, Mayiladuthurai, Tambaram, Avadi, Dharmapuri, Perambalur, Ariyalur, Theni, Kanyakumari, Tiruvallur' },
  Kerala: { region: 'South', langs: 'Malayalam', festivals: ['Onam', 'Vishu', 'Thrissur Pooram'],
    t2: 'Kochi, Thiruvananthapuram, Kozhikode, Thrissur, Kollam',
    t3: 'Kannur, Alappuzha, Palakkad, Kottayam, Malappuram, Kasaragod, Pathanamthitta, Idukki, Muvattupuzha, Thalassery, Guruvayur, Kayamkulam, Perinthalmanna, Changanassery, Tirur, Kanhangad, Kalpetta, Attingal' },
  'Andhra Pradesh': { region: 'South', langs: 'Telugu', festivals: ['Ugadi', 'Sankranti', 'Dasara'],
    t2: 'Visakhapatnam, Vijayawada, Guntur, Tirupati, Nellore, Kurnool',
    t3: 'Rajahmundry, Kakinada, Kadapa, Anantapur, Eluru, Ongole, Machilipatnam, Nandyal, Chittoor, Srikakulam, Vizianagaram, Tenali, Proddatur, Hindupur, Bhimavaram, Madanapalle, Guntakal, Dharmavaram, Gudivada, Narasaraopet, Tadepalligudem, Chilakaluripet, Amaravati' },
  Telangana: { region: 'South', langs: 'Telugu and Urdu', festivals: ['Bathukamma', 'Bonalu', 'Ugadi'],
    t1: 'Hyderabad', t2: 'Warangal, Nizamabad, Karimnagar, Khammam',
    t3: 'Ramagundam, Mahbubnagar, Nalgonda, Adilabad, Suryapet, Siddipet, Miryalaguda, Jagtial, Mancherial, Secunderabad, Kothagudem, Bodhan' },
  'West Bengal': { region: 'East', langs: 'Bengali', festivals: ['Durga Puja', 'Poila Baisakh', 'Kali Puja'],
    t1: 'Kolkata', t2: 'Howrah, Durgapur, Asansol, Siliguri',
    t3: 'Bardhaman, Malda, Kharagpur, Haldia, Darjeeling, Jalpaiguri, Krishnanagar, Baharampur, Raiganj, Cooch Behar, Bankura, Purulia, Midnapore, Balurghat, Barrackpore, Santipur, Bidhannagar, Kalyani, Habra, Basirhat, Barasat, Dum Dum, Serampore, Chandannagar, Bally' },
  Bihar: { region: 'East', langs: 'Hindi and Maithili', festivals: ['Chhath Puja', 'Diwali', 'Makar Sankranti'],
    t2: 'Patna, Gaya',
    t3: 'Bhagalpur, Muzaffarpur, Purnia, Darbhanga, Bihar Sharif, Arrah, Begusarai, Katihar, Munger, Chhapra, Samastipur, Sasaram, Hajipur, Dehri, Siwan, Motihari, Nawada, Bettiah, Saharsa, Buxar, Jehanabad, Madhubani, Sitamarhi, Kishanganj, Bodh Gaya, Jamui, Araria, Supaul' },
  Odisha: { region: 'East', langs: 'Odia', festivals: ['Rath Yatra', 'Pana Sankranti', 'Kali Puja'],
    t2: 'Bhubaneswar, Cuttack, Rourkela',
    t3: 'Berhampur, Sambalpur, Puri, Balasore, Bhadrak, Baripada, Jharsuguda, Jeypore, Bargarh, Angul, Rayagada, Koraput, Kendujhar, Paradip, Dhenkanal, Kendrapara, Bhawanipatna' },
  Jharkhand: { region: 'East', langs: 'Hindi', festivals: ['Sarhul', 'Karma Puja', 'Diwali'],
    t2: 'Ranchi, Jamshedpur, Dhanbad, Bokaro Steel City',
    t3: 'Hazaribagh, Deoghar, Giridih, Ramgarh, Phusro, Medininagar, Chirkunda, Chaibasa, Dumka, Mango, Adityapur, Sahibganj' },
  Chhattisgarh: { region: 'Central', langs: 'Hindi and Chhattisgarhi', festivals: ['Hareli', 'Bastar Dussehra', 'Diwali'],
    t2: 'Raipur, Bhilai, Bilaspur', t3: 'Korba, Durg, Raigarh, Rajnandgaon, Jagdalpur, Ambikapur, Dhamtari, Chirmiri, Mahasamund, Kawardha, Janjgir' },
  Punjab: { region: 'North', langs: 'Punjabi', festivals: ['Baisakhi', 'Lohri', 'Diwali'],
    t2: 'Ludhiana, Amritsar, Jalandhar, Patiala',
    t3: 'Bathinda, Mohali, Hoshiarpur, Pathankot, Moga, Batala, Abohar, Malerkotla, Khanna, Phagwara, Muktsar, Barnala, Firozpur, Kapurthala, Fazilka, Rajpura, Sangrur, Gurdaspur, Zirakpur, Ropar' },
  Haryana: { region: 'North', langs: 'Hindi and Haryanvi', festivals: ['Teej', 'Lohri', 'Diwali'],
    t2: 'Gurugram, Faridabad, Panipat, Ambala, Karnal',
    t3: 'Hisar, Rohtak, Sonipat, Yamunanagar, Panchkula, Bhiwani, Sirsa, Bahadurgarh, Jind, Kurukshetra, Kaithal, Rewari, Palwal, Fatehabad, Narnaul, Hansi, Mahendragarh, Charkhi Dadri, Jhajjar, Manesar' },
  Delhi: { region: 'North', langs: 'Hindi and English', festivals: ['Diwali', 'Dussehra', 'Navratri'], t1: 'Delhi, New Delhi' },
  Uttarakhand: { region: 'North', langs: 'Hindi', festivals: ['Harela', 'Uttarayani', 'Diwali'],
    t2: 'Dehradun', t3: 'Haridwar, Roorkee, Haldwani, Rudrapur, Kashipur, Rishikesh, Kotdwar, Nainital, Mussoorie, Pithoragarh, Almora, Ramnagar, Sitarganj, Pauri' },
  'Himachal Pradesh': { region: 'North', langs: 'Hindi and Pahari', festivals: ['Kullu Dussehra', 'Lohri', 'Diwali'],
    t2: 'Shimla', t3: 'Solan, Dharamshala, Mandi, Kullu, Manali, Baddi, Palampur, Una, Hamirpur, Nahan' },
  'Jammu and Kashmir': { region: 'North', langs: 'Kashmiri, Dogri and Urdu', festivals: ['Navreh', 'Baisakhi', 'Diwali'],
    t2: 'Srinagar, Jammu', t3: 'Anantnag, Baramulla, Sopore, Kathua, Udhampur' },
  Ladakh: { region: 'North', langs: 'Ladakhi and Hindi', festivals: ['Hemis Festival', 'Losar', 'Sindhu Darshan'], t3: 'Leh, Kargil' },
  Assam: { region: 'North-East', langs: 'Assamese', festivals: ['Bohag Bihu', 'Durga Puja', 'Diwali'],
    t2: 'Guwahati', t3: 'Silchar, Dibrugarh, Jorhat, Nagaon, Tinsukia, Tezpur, Bongaigaon, Dhubri, Diphu, North Lakhimpur, Goalpara' },
  Meghalaya: { region: 'North-East', langs: 'English, Khasi and Garo', festivals: ['Wangala Festival', 'Christmas', 'Durga Puja'], t3: 'Shillong, Tura' },
  Manipur: { region: 'North-East', langs: 'Meiteilon (Manipuri)', festivals: ['Ningol Chakouba', 'Lai Haraoba', 'Diwali'], t3: 'Imphal' },
  Mizoram: { region: 'North-East', langs: 'Mizo and English', festivals: ['Chapchar Kut', 'Mim Kut', 'Christmas'], t3: 'Aizawl, Lunglei' },
  Nagaland: { region: 'North-East', langs: 'English and Nagamese', festivals: ['Hornbill Festival', 'Moatsu', 'Christmas'], t3: 'Kohima, Dimapur' },
  Tripura: { region: 'North-East', langs: 'Bengali and Kokborok', festivals: ['Kharchi Puja', 'Durga Puja', 'Diwali'], t3: 'Agartala' },
  Sikkim: { region: 'North-East', langs: 'Nepali and English', festivals: ['Losar', 'Saga Dawa', 'Diwali'], t3: 'Gangtok' },
  'Arunachal Pradesh': { region: 'North-East', langs: 'English and Hindi', festivals: ['Losar', 'Solung', 'Diwali'], t3: 'Itanagar' },
  Goa: { region: 'West', langs: 'Konkani and Marathi', festivals: ['Ganesh Chaturthi', 'Shigmo', 'Diwali'], t3: 'Panaji, Margao, Vasco da Gama, Mapusa, Ponda' },
  Chandigarh: { region: 'North', langs: 'Punjabi and Hindi', festivals: ['Baisakhi', 'Lohri', 'Diwali'], t2: 'Chandigarh' },
  Puducherry: { region: 'South', langs: 'Tamil', festivals: ['Pongal', 'Tamil New Year', 'Diwali'], t3: 'Puducherry, Karaikal' },
  'Andaman and Nicobar Islands': { region: 'East', langs: 'Hindi and English', festivals: ['Diwali', 'Durga Puja', 'Pongal'], t3: 'Port Blair' },
  'Dadra and Nagar Haveli and Daman and Diu': { region: 'West', langs: 'Gujarati and Hindi', festivals: ['Navratri', 'Ganesh Chaturthi', 'Diwali'], t3: 'Silvassa, Daman' },
};

/** Other names people search for. Used in titles, intros and keywords. */
export const ALIASES: Record<string, string> = {
  Bengaluru: 'Bangalore', Gurugram: 'Gurgaon', Mysuru: 'Mysore', Prayagraj: 'Allahabad', Thiruvananthapuram: 'Trivandrum', Kochi: 'Cochin', Kozhikode: 'Calicut',
  Visakhapatnam: 'Vizag', 'Chhatrapati Sambhajinagar': 'Aurangabad', Ahilyanagar: 'Ahmednagar', Dharashiv: 'Osmanabad', Narmadapuram: 'Hoshangabad', Katni: 'Murwara',
  Mangaluru: 'Mangalore', Belagavi: 'Belgaum', Kalaburagi: 'Gulbarga', Vijayapura: 'Bijapur', Shivamogga: 'Shimoga', Tumakuru: 'Tumkur', Ballari: 'Bellary', 'Hubballi-Dharwad': 'Hubli',
  Thanjavur: 'Tanjore', Tiruchirappalli: 'Trichy', Thoothukudi: 'Tuticorin', Tiruppur: 'Tirupur', Kanchipuram: 'Kanchi', Alappuzha: 'Alleppey', Thrissur: 'Trichur', Kollam: 'Quilon',
  Kalpetta: 'Wayanad', Vadodara: 'Baroda', Kolkata: 'Calcutta', Howrah: 'Haora', Bardhaman: 'Burdwan', Baharampur: 'Berhampore', Midnapore: 'Medinipur', Puducherry: 'Pondicherry',
  Panaji: 'Panjim', Shimla: 'Simla', Kurukshetra: 'Thanesar', Ayodhya: 'Faizabad', Kanpur: 'Cawnpore', Varanasi: 'Banaras', 'Navi Mumbai': 'Bombay', Mumbai: 'Bombay',
  Chennai: 'Madras', 'Vasco da Gama': 'Vasco', Bhubaneswar: 'Bhubaneshwar', Imphal: 'Manipur', Kendujhar: 'Keonjhar', 'Bokaro Steel City': 'Bokaro', Medininagar: 'Daltonganj', Silchar: 'Cachar',
};

export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (s?: string) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

function build(): City[] {
  const out: City[] = [];
  const seen = new Set<string>();
  for (const [state, info] of Object.entries(STATES)) {
    (['t1', 't2', 't3'] as const).forEach((k, i) => {
      for (const name of list(info[k])) {
        const slug = slugify(name);
        if (seen.has(slug)) continue;
        seen.add(slug);
        out.push({ slug, name, state, tier: (i + 1) as Tier, region: info.region, alias: ALIASES[name] });
      }
    });
  }
  return out;
}
export const CITIES: City[] = build();
export const cityBySlug = (slug: string) => CITIES.find((c) => c.slug === slug);
/** Blog URL slug for a city. */
export const postSlug = (c: City) => `best-numerologist-in-${c.slug}`;
export const cityFromPostSlug = (s: string) => cityBySlug(s.replace(/^best-numerologist-in-/, ''));
export const TIER_LABEL: Record<Tier, string> = { 1: 'Tier 1 · Metro', 2: 'Tier 2', 3: 'Tier 3' };
