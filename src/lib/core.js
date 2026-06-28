/* ============================================================
   Card Gyani — shared render core (no DOM, no Node APIs).
   Imported by Astro pages (build-time SEO HTML) AND by the
   browser client (interactivity). One render source => no drift.
   Ported from the cardgyani.html prototype with production changes:
     - 'Apply Now' is an external <a href> (per-card apply_url, new tab)
     - cross-page navigation uses real URLs (SEO)
     - data is injected (from Supabase) instead of hardcoded
   ============================================================ */

/* ---------- i18n (EN / HI / TA / TE) ---------- */
export const I18N = {
 en:{compare:'Compare',all_cards:'All cards',filter_cards:'Filter cards',category:'Category',
   super_premium:'Super Premium',premium:'Premium',mid_tier:'Mid-tier',entry:'Entry',travel:'Travel',fuel:'Fuel',
   annual_fee:'Annual fee',lifetime_free:'Lifetime free',u500:'Under ₹500',b1:'₹500–₹2,000',b2:'₹2,000–₹5,000',b3:'₹5,000+',
   benefits:'Benefits',lounge_access:'Lounge access',low_forex:'Low forex (<3%)',upi_card:'UPI credit card',   network:'Network',showing:'Showing',cards_word:'cards',fee_waiver:'Fee waiver',forex_markup:'Forex markup',finance_charge:'Finance charge',
   apply_now:'Apply Now',view_details:'View details',no_fee_waiver:'No fee waiver',waived_at:'Waived at',spend:'spend',
   add_to_compare:'Add to compare',compare_now:'Compare now',clear_all:'Clear all',selected:'selected',back_to_cards:'Back to cards',
   fees_charges:'Fees & charges',joining_fee:'Joining fee',interest_rate:'Interest rate',cash_advance:'Cash advance fee',late_payment:'Late payment fee',
   key_features:'Key features',rewards:'Rewards',lounge:'Lounge access',add_another:'Add another card to compare',comparing:'Comparing',remove:'Remove',
   reset:'Reset',language:'Language',pm:'p.m.',pa:'p.a.',sort_high:'Annual fee: High to Low',sort_low:'Annual fee: Low to High',
   sort_rew:'Reward rate',sort_name:'Name (A–Z)',max4:'You can compare up to 4 cards',none_match:'No cards match these filters',
   none_hint:'Try removing a filter or two.',empty_cmp:'No cards to compare yet',empty_hint:'Tick “Compare” on any card to start.',
   filters:'Filters',type:'Card type',retail:'Retail',business:'Business',secured:'Secured',cobrand:'Co-brand',fd_linked:'FD-linked',home:'Home',hero_h1:'Find the right card. Fast.',hero_sub:'Browse {n}+ credit cards by what you actually want — no forms, no spam calls.',see_all:'See all & filter →',partnered:'Partnered with',footer_note:'Indicative figures from issuer MITC documents. Verify on the bank site before applying.',cmp_sub:'Every benefit, line by line.',rewards_band:'Rewards & benefits',search_ph:'Search cards, banks or benefits…',browse_cat:'Browse by category',cats_h:'Top categories',cats_sub:'Compare India\'s credit cards by what you actually want — pick a category to filter.',trending_now:'Trending now',rewards:'Rewards',cashback:'Cashback',why_k:'Why Card Gyani',conf_a:'Pick your card',conf_b:'with confidence,',conf_c:'not guesswork.',conf_sub:'Bank sites bury the numbers. Card Gyani surfaces what actually matters — fees, real rewards and who qualifies — so you compare once and decide.',stat_cards:'Credit cards',stat_banks:'Banks covered',stat_langs:'Languages',stat_verified:'MITC-verified',marquee_k:'Trusted across India',marquee_h:'Cards from every major bank'},
 hi:{compare:'तुलना करें',all_cards:'सभी कार्ड',filter_cards:'कार्ड फ़िल्टर करें',category:'श्रेणी',
   super_premium:'सुपर प्रीमियम',premium:'प्रीमियम',mid_tier:'मिड-टियर',entry:'एंट्री',travel:'ट्रैवल',fuel:'फ्यूल',
   annual_fee:'वार्षिक शुल्क',lifetime_free:'लाइफटाइम फ्री',u500:'₹500 से कम',b1:'₹500–₹2,000',b2:'₹2,000–₹5,000',b3:'₹5,000+',
   benefits:'लाभ',lounge_access:'लाउंज एक्सेस',low_forex:'कम फॉरेक्स (<3%)',upi_card:'UPI क्रेडिट कार्ड',   network:'नेटवर्क',showing:'दिखा रहे हैं',cards_word:'कार्ड',fee_waiver:'शुल्क छूट',forex_markup:'फॉरेक्स मार्कअप',finance_charge:'वित्त शुल्क',
   apply_now:'अभी आवेदन करें',view_details:'विवरण देखें',no_fee_waiver:'कोई छूट नहीं',waived_at:'छूट',spend:'खर्च पर',
   add_to_compare:'तुलना में जोड़ें',compare_now:'अभी तुलना करें',clear_all:'सभी हटाएं',selected:'चयनित',back_to_cards:'कार्ड पर वापस',
   fees_charges:'शुल्क और चार्ज',joining_fee:'जॉइनिंग शुल्क',interest_rate:'ब्याज दर',cash_advance:'कैश एडवांस शुल्क',late_payment:'विलंब शुल्क',
   key_features:'मुख्य विशेषताएं',rewards:'रिवॉर्ड',lounge:'लाउंज एक्सेस',add_another:'तुलना के लिए दूसरा कार्ड जोड़ें',comparing:'तुलना',remove:'हटाएं',
   reset:'रीसेट',language:'भाषा',pm:'प्रति माह',pa:'प्रति वर्ष',sort_high:'वार्षिक शुल्क: अधिक से कम',sort_low:'वार्षिक शुल्क: कम से अधिक',
   sort_rew:'रिवॉर्ड दर',sort_name:'नाम (अ–ज्ञ)',max4:'आप अधिकतम 4 कार्ड की तुलना कर सकते हैं',none_match:'इन फ़िल्टर से कोई कार्ड नहीं मिला',
   none_hint:'एक-दो फ़िल्टर हटाकर देखें।',empty_cmp:'तुलना के लिए कोई कार्ड नहीं',empty_hint:'शुरू करने के लिए किसी कार्ड पर “तुलना करें” चुनें।',
   filters:'फ़िल्टर',type:'कार्ड प्रकार',retail:'रिटेल',business:'बिज़नेस',secured:'सिक्योर्ड',cobrand:'को-ब्रांड',fd_linked:'FD से लिंक्ड',home:'होम',see_all:'सभी देखें और फ़िल्टर करें →',partnered:'पार्टनर बैंक',rewards_band:'रिवॉर्ड और लाभ',search_ph:'कार्ड, बैंक या लाभ खोजें…',browse_cat:'श्रेणी के अनुसार देखें'},
 ta:{compare:'ஒப்பிடு',all_cards:'அனைத்து கார்டுகள்',filter_cards:'கார்டுகளை வடிகட்டு',category:'வகை',
   super_premium:'சூப்பர் பிரீமியம்',premium:'பிரீமியம்',mid_tier:'மிட்-டியர்',entry:'என்ட்ரி',travel:'டிராவல்',fuel:'எரிபொருள்',
   annual_fee:'ஆண்டுக் கட்டணம்',lifetime_free:'வாழ்நாள் இலவசம்',u500:'₹500-க்கு கீழ்',b1:'₹500–₹2,000',b2:'₹2,000–₹5,000',b3:'₹5,000+',
   benefits:'சலுகைகள்',lounge_access:'லவுஞ்ச் அணுகல்',low_forex:'குறைந்த ஃபாரெக்ஸ் (<3%)',upi_card:'UPI கிரெடிட் கார்டு',   network:'நெட்வொர்க்',showing:'காட்டுகிறது',cards_word:'கார்டுகள்',fee_waiver:'கட்டண விலக்கு',forex_markup:'ஃபாரெக்ஸ் மார்க்அப்',finance_charge:'நிதிக் கட்டணம்',
   apply_now:'விண்ணப்பிக்கவும்',view_details:'விவரங்களைக் காண்க',no_fee_waiver:'விலக்கு இல்லை',waived_at:'விலக்கு',spend:'செலவில்',
   add_to_compare:'ஒப்பீட்டில் சேர்',compare_now:'இப்போது ஒப்பிடு',clear_all:'அனைத்தையும் அழி',selected:'தேர்ந்தெடுக்கப்பட்டது',back_to_cards:'கார்டுகளுக்குத் திரும்பு',
   fees_charges:'கட்டணங்கள் & சார்ஜ்',joining_fee:'சேர்க்கைக் கட்டணம்',interest_rate:'வட்டி விகிதம்',cash_advance:'கேஷ் அட்வான்ஸ் கட்டணம்',late_payment:'தாமதக் கட்டணம்',
   key_features:'முக்கிய அம்சங்கள்',rewards:'ரிவார்டுகள்',lounge:'லவுஞ்ச் அணுகல்',add_another:'ஒப்பிட மற்றொரு கார்டைச் சேர்',comparing:'ஒப்பீடு',remove:'அகற்று',
   reset:'மீட்டமை',language:'மொழி',pm:'மாதம்',pa:'ஆண்டு',sort_high:'ஆண்டுக் கட்டணம்: அதிகம்→குறைவு',sort_low:'ஆண்டுக் கட்டணம்: குறைவு→அதிகம்',
   sort_rew:'ரிவார்டு விகிதம்',sort_name:'பெயர் (அ–ஃ)',max4:'அதிகபட்சம் 4 கார்டுகளை ஒப்பிடலாம்',none_match:'இந்த வடிகட்டிகளுக்கு கார்டுகள் இல்லை',
   none_hint:'ஓரிரு வடிகட்டிகளை அகற்றிப் பாருங்கள்.',empty_cmp:'ஒப்பிட கார்டுகள் இல்லை',empty_hint:'தொடங்க எந்த கார்டிலும் “ஒப்பிடு” தேர்ந்தெடுக்கவும்.',
   filters:'வடிகட்டிகள்',type:'கார்டு வகை',retail:'ரீடெயில்',business:'பிசினஸ்',secured:'செக்யூர்டு',cobrand:'கோ-பிராண்ட்',fd_linked:'FD இணைப்பு',home:'முகப்பு',see_all:'அனைத்தையும் பார்த்து வடிகட்டு →',partnered:'கூட்டாளி வங்கிகள்',rewards_band:'ரிவார்டுகள் & சலுகைகள்',search_ph:'கார்டுகள், வங்கிகள் அல்லது சலுகைகளைத் தேடுங்கள்…',browse_cat:'வகை வாரியாக உலாவு'},
 te:{compare:'పోల్చండి',all_cards:'అన్ని కార్డులు',filter_cards:'కార్డులను ఫిల్టర్ చేయండి',category:'వర్గం',
   super_premium:'సూపర్ ప్రీమియం',premium:'ప్రీమియం',mid_tier:'మిడ్-టైర్',entry:'ఎంట్రీ',travel:'ట్రావెల్',fuel:'ఫ్యూయల్',
   annual_fee:'వార్షిక రుసుము',lifetime_free:'లైఫ్‌టైమ్ ఫ్రీ',u500:'₹500 లోపు',b1:'₹500–₹2,000',b2:'₹2,000–₹5,000',b3:'₹5,000+',
   benefits:'ప్రయోజనాలు',lounge_access:'లాంజ్ యాక్సెస్',low_forex:'తక్కువ ఫారెక్స్ (<3%)',upi_card:'UPI క్రెడిట్ కార్డు',   network:'నెట్‌వర్క్',showing:'చూపిస్తోంది',cards_word:'కార్డులు',fee_waiver:'రుసుము మినహాయింపు',forex_markup:'ఫారెక్స్ మార్కప్',finance_charge:'ఫైనాన్స్ ఛార్జ్',
   apply_now:'దరఖాస్తు చేయండి',view_details:'వివరాలు చూడండి',no_fee_waiver:'మినహాయింపు లేదు',waived_at:'మినహాయింపు',spend:'ఖర్చుపై',
   add_to_compare:'పోలికకు జోడించండి',compare_now:'ఇప్పుడే పోల్చండి',clear_all:'అన్నీ తీసివేయండి',selected:'ఎంచుకున్నవి',back_to_cards:'కార్డులకు తిరిగి',
   fees_charges:'రుసుములు & ఛార్జీలు',joining_fee:'జాయినింగ్ రుసుము',interest_rate:'వడ్డీ రేటు',cash_advance:'క్యాష్ అడ్వాన్స్ రుసుము',late_payment:'ఆలస్య రుసుము',
   key_features:'ముఖ్య లక్షణాలు',rewards:'రివార్డులు',lounge:'లాంజ్ యాక్సెస్',add_another:'పోల్చడానికి మరో కార్డును జోడించండి',comparing:'పోలిక',remove:'తీసివేయి',
   reset:'రీసెట్',language:'భాష',pm:'నెలకు',pa:'సంవత్సరానికి',sort_high:'వార్షిక రుసుము: ఎక్కువ→తక్కువ',sort_low:'వార్షిక రుసుము: తక్కువ→ఎక్కువ',
   sort_rew:'రివార్డ్ రేటు',sort_name:'పేరు (అ–ఱ)',max4:'మీరు గరిష్టంగా 4 కార్డులను పోల్చవచ్చు',none_match:'ఈ ఫిల్టర్లకు కార్డులు సరిపోలలేదు',
   none_hint:'ఒకటి రెండు ఫిల్టర్లను తీసివేసి చూడండి.',empty_cmp:'పోల్చడానికి కార్డులు లేవు',empty_hint:'ప్రారంభించడానికి ఏదైనా కార్డుపై “పోల్చండి” ఎంచుకోండి.',
   filters:'ఫిల్టర్లు',type:'కార్డు రకం',retail:'రిటైల్',business:'బిజినెస్',secured:'సెక్యూర్డ్',cobrand:'కో-బ్రాండ్',fd_linked:'FD-లింక్డ్',home:'హోమ్',see_all:'అన్నీ చూసి ఫిల్టర్ చేయండి →',partnered:'భాగస్వామ్య బ్యాంకులు',rewards_band:'రివార్డులు & ప్రయోజనాలు',search_ph:'కార్డులు, బ్యాంకులు లేదా ప్రయోజనాలను శోధించండి…',browse_cat:'వర్గం వారీగా బ్రౌజ్ చేయండి'},
};
export const LANGS = {en:['English','EN'],hi:['हिन्दी','HI'],ta:['தமிழ்','TA'],te:['తెలుగు','TE']};

const BANKMETA = {
 'HDFC':['HDFC','#004C8F'],'Axis':['AXIS','#97144D'],'SBI':['SBI','#22409A'],'ICICI':['ICICI','#AE282E'],
 'American Express':['AMEX','#1F6FB2'],'Kotak':['KOTAK','#C8102E'],'IndusInd':['INDUS','#9B1B30'],
 'RBL Bank':['RBL','#C20E2A'],'IDFC':['IDFC','#9B1B30'],'Bank of Baroda':['BOB','#F26A21'],
 'Federal Bank':['FEDERAL','#003D7A'],'Yes':['YES','#00518F'],'SBM':['SBM','#1A7A5E']
};

export const CAT_ORDER = ['super_premium','premium','mid_tier','entry','travel','fuel'];

/* ---------- module state + data (set before each render) ---------- */
let S = null, CARDS = [], BANKS = [];
export function configure(cards, banks){ CARDS = cards || []; BANKS = banks || []; }
export function setState(s){ S = s; }
export function getCards(){ return CARDS; }
export function defaultState(over){
  return Object.assign({
    lang:'en', route:'home', detailSlug:null, catPage:null,
    homeCat:'all', homeQ:'',
    f:{cat:new Set(),fee:new Set(),ben:new Set(),net:new Set(),type:new Set()},
    sort:'fee_high', compare:[], langOpen:false, sortOpen:false
  }, over||{});
}

/* ---------- helpers ---------- */
const t = k => (I18N[S.lang] && I18N[S.lang][k]) ?? I18N.en[k] ?? k;
const inr = n => n===0 ? t('lifetime_free') : '₹'+Number(n).toLocaleString('en-IN');
const lakh = n => n>=100000 ? '₹'+(n/100000).toFixed(n%100000?1:0)+'L' : '₹'+Number(n).toLocaleString('en-IN');
const esc = s => String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// Card-attribute detectors. The Supabase `benefits` array is unpopulated
// (3/450), so lounge/UPI are derived from the columns that carry the signal;
// co-brand isn't stored on card_type at all, so detect it from the card name.
const LOUNGE_NA=/^(not applicable|n\/?a|none|—|-|)$/i;
function hasLounge(c){const l=(c.lounge||'').trim();return !!l && !LOUNGE_NA.test(l);}
function isUpi(c){return /\bupi\b|rupay/i.test((c.name||'')+' '+(c.network||''));}
const COBRAND_RE=/flipkart|amazon|tata neu|\birctc\b|swiggy|zomato|indianoil|indian oil|\bbpcl\b|\bhpcl\b|vistara|\bindigo\b|\b6e\b|marriott|bonvoy|makemytrip|\bmmt\b|emirates|etihad|air india|krisflyer|miles ?(?:and|&) ?more|jet airways|\byatra\b|paytm|phonepe|snapdeal|shoppers stop|pharmeasy|patanjali|\bpvr\b|adani|reliance|bigbasket|myntra|nykaa|ajio|\buber\b|airtel|apollo|manchester united|chennai super kings|club vistara|\bkiwi\b|\bzet\b|mobikwik|paisabazaar|kredit\.?pe|times black|\btata\b|\bixigo\b|easemytrip|croma|\blic\b/i;
function isCobrand(c){return COBRAND_RE.test(c.name||'');}
// Lifetime-free: the is_lifetime_free flag drives fee→0 in mapRow, but stay
// robust to any card whose fee resolves to 0 by other means.
function isLtf(c){return !!c.ltf || Number(c.fee)===0;}

// Intent-search alias map. Keys are words a user might type; values are the
// terms that actually appear in card reward/lounge/feature text. Used by
// homeView search to expand plain-language queries into field matches.
const KEYWORD_MAP = {
  // Entertainment / movies
  movies:['entertainment','cinema','pvr','inox','movie','bookmyshow'],
  movie:['entertainment','cinema','pvr','inox','movie','bookmyshow'],
  cinema:['cinema','pvr','inox','movie','entertainment'],
  entertainment:['entertainment','cinema','movie','pvr','inox'],
  ott:['ott','streaming','netflix','prime','disney','hotstar'],
  netflix:['netflix','ott','streaming'],
  streaming:['streaming','ott','netflix','prime','disney'],
  // Dining / food
  dining:['dining','restaurant','food','zomato','swiggy','eazydiner'],
  restaurant:['restaurant','dining','food'],
  food:['food','dining','restaurant','zomato','swiggy'],
  zomato:['zomato','dining','food'],
  swiggy:['swiggy','food','dining'],
  // Travel
  travel:['travel','airline','flight','hotel','miles','air india','indigo','vistara'],
  flight:['flight','airline','travel','air india','indigo','vistara','6e'],
  airline:['airline','flight','travel','miles'],
  flying:['flight','airline','travel'],
  hotel:['hotel','travel','marriott'],
  miles:['miles','air miles','travel'],
  // Lounge / airport
  lounge:['lounge','airport lounge','priority pass','dreamfolks'],
  airport:['lounge','airport'],
  // Shopping
  shopping:['shopping','amazon','flipkart','myntra','retail','online'],
  online:['online','shopping','amazon','flipkart'],
  amazon:['amazon'],
  flipkart:['flipkart'],
  ecommerce:['shopping','online','amazon','flipkart','myntra'],
  // Fuel / petrol
  fuel:['fuel','petrol','surcharge','bpcl','hpcl','indianoil','indian oil'],
  petrol:['petrol','fuel','surcharge','bpcl','hpcl'],
  gas:['fuel','petrol','surcharge'],
  // Grocery / supermarket
  grocery:['grocery','supermarket','bigbasket','grofer'],
  supermarket:['supermarket','grocery'],
  // Cashback
  cashback:['cashback','cash back','cash-back'],
  // Rewards / points
  rewards:['reward','points','reward points','cashpoints'],
  points:['points','reward points','cashpoints'],
  // Forex / international
  forex:['forex','foreign currency','international','markup'],
  international:['international','forex','foreign','overseas'],
  abroad:['abroad','international','forex','foreign','overseas'],
  overseas:['overseas','international','forex'],
  // Health / pharmacy
  health:['health','medical','pharmacy','apollo','pharmeasy','wellness'],
  medical:['medical','health','pharmacy'],
  pharmacy:['pharmacy','medical','health','apollo'],
  // Insurance
  insurance:['insurance','accident','cover'],
  // Utility / bills
  utility:['utility','bill','electricity','mobile recharge'],
  bills:['bill','utility','electricity','recharge'],
  // LTF / free
  free:['lifetime free','ltf','no annual fee'],
  lifetime:['lifetime free','ltf'],
  // Premium / luxury
  luxury:['super premium','metal','invite','concierge'],
  metal:['metal','metal card'],
  // UPI / RuPay
  upi:['upi','rupay'],
  rupay:['rupay','upi'],
  // Business
  business:['business'],
  // Secured / FD
  secured:['secured','fd','fixed deposit'],
  fd:['fd','fixed deposit','secured'],
};

// Derive every applicable tag for a card from its stored attributes.
// The primary badge (c.badge, stored in Supabase) is the single most
// important tag shown on the homepage tile. cardTags() returns ALL tags
// applicable to the card and is used on list rows, detail pages, compare.
function cardTags(c){
  const nm=c.name||'';
  const nml=nm.toLowerCase();
  const rw=(c.reward||'').toLowerCase();
  const b=c.badge||'';
  const tags=[];
  // — Tier (one slot; most specific wins) —
  if(b==='invite only') tags.push('invite only');
  else if(c.cat==='super_premium') tags.push('super premium');
  else if(nml.includes('metal')||b==='metal card') tags.push('metal card');
  else if(c.cat==='premium') tags.push('premium');
  else if(c.cat==='mid_tier') tags.push('mid tier');
  // — Travel — badge OR name contains travel brand/keyword OR reward text mentions miles —
  const TRAVEL_NM=/miles|allmiles|worldmiles|atlas|horizon|safari|voyager|air india|indigo|vistara|makemytrip|krisflyer|marriott|accor|\btaj\b|irctc|etihad|emirates|skywards/i;
  const TRAVEL_RW=/\b(air miles?|airmiles|travel points?|fly.*rewards?|earn.*miles|miles.*earn)\b/i;
  if(b==='travel'||TRAVEL_NM.test(nm)||TRAVEL_RW.test(rw)) tags.push('travel');
  // — Lounge —
  if(hasLounge(c)) tags.push('lounge access');
  // — Fuel —
  const FUEL_NM=/indianoil|indian oil|\biocl\b|bpcl|hpcl|first power/i;
  if(b==='fuel surcharge waiver'||FUEL_NM.test(nm)||(c.fuelWaiver&&c.fuelWaiver.length>3)) tags.push('fuel surcharge waiver');
  // — Cashback —
  const CASH_NM=/cashback|cash back|moneyback|money back|amazon pay/i;
  const CASH_RW=/\d+\s*%\s*cash\s*back|unlimited cashback|flat.*cashback/i;
  if(b==='cashback card'||CASH_NM.test(nm)||CASH_RW.test(rw)) tags.push('cashback card');
  // — Lifetime free —
  if(isLtf(c)) tags.push('lifetime free');
  // — Low forex: forex > 0 (excludes null→0) AND < 3; or badge-assigned 0% cards —
  if((c.forex>0&&c.forex<3)||(c.forex===0&&(b==='low forex markup'||/safari/i.test(nm)))) tags.push('low forex');
  // — UPI —
  if(isUpi(c)) tags.push('UPI');
  // — FD-linked / secured —
  if(c.type==='secured'||b==='FD-linked') tags.push('FD-linked');
  return [...new Set(tags)];
}

// Render a single tag chip. Reuses existing CSS colour classes; new ones
// (inv, fuel, cbk, lng, ltf, upi) are added in global.css.
function tagChip(tag){
  const CLS={
    'invite only':'inv','super premium':'superp','super-premium':'superp',
    'metal card':'metal','premium':'premium','mid tier':'',
    'travel':'travel','fuel surcharge waiver':'fuel','cashback card':'cbk',
    'lounge access':'lng','lifetime free':'ltf',
    'low forex':'lowforex','UPI':'upi','FD-linked':'fd',
  };
  const cls=Object.prototype.hasOwnProperty.call(CLS,tag)?CLS[tag]:'';
  return `<span class="tag${cls?' '+cls:''}">${esc(tag)}</span>`;
}

function feeBucket(c){
  if(isLtf(c))return'ltf'; if(c.fee<500)return'u500';
  if(c.fee<=2000)return'b1'; if(c.fee<=5000)return'b2'; return'b3';
}
function passes(c){
  const f=S.f;
  if(f.cat.size && !f.cat.has(c.cat))return false;
  if(f.fee.size && !f.fee.has(feeBucket(c)))return false;
  if(f.type.size && !(f.type.has(c.type) || (f.type.has('cobrand') && isCobrand(c))))return false;
  if(f.net.size && !c.networks.some(n=>f.net.has(n)))return false;
  for(const b of f.ben){
    if(b==='lounge_access' && !hasLounge(c))return false;
    if(b==='low_forex' && c.forex>=3)return false;
    if(b==='upi_card' && !isUpi(c))return false;
  }
  return true;
}
// ── Monetisation preference ──────────────────────────────────────────────
// Cards with a live affiliate link are our recommended picks, so they lead the
// DEFAULT ordering (home tiles + /cards default sort). Explicit user sorts
// (fee/name/reward) are respected as chosen — affiliate status only breaks
// exact ties there. In search, relevance wins and this is just a tiebreaker
// among similar-relevance matches (see homeView scoreOf).
function hasAff(c){return !!(c.affiliate_url && String(c.affiliate_url).trim());}
const byAff=(x,y)=>(hasAff(y)?1:0)-(hasAff(x)?1:0);   // affiliate-linked first

function sorted(list){
  const a=[...list];
  if(S.sort==='fee_low')      a.sort((x,y)=>(x.fee-y.fee) || byAff(x,y));
  else if(S.sort==='rew')     a.sort((x,y)=>(y.rpct-x.rpct) || byAff(x,y));
  else if(S.sort==='name')    a.sort((x,y)=>x.name.localeCompare(y.name));
  // Default "recommended" order: affiliate cards first, then annual fee high→low.
  else                        a.sort((x,y)=>byAff(x,y) || (y.fee-x.fee));
  return a;
}
export const bySlug = slug => CARDS.find(c=>c.slug===slug);
function activeCount(){return [...Object.values(S.f)].reduce((a,s)=>a+s.size,0);}

/* ---------- tiered fee formatter ---------- */
// Parse a semicolon-delimited tiered fee string into structured data:
//   { header, tiers: [{range, val}] }  — or null if it isn't actually tiered.
// One shared parser feeds both the detail-view table and the compact compare cell.
function parseTiers(text){
  if(!text || typeof text !== 'string') return null;
  const parts = text.split(';').map(s=>s.trim()).filter(Boolean);
  if(parts.length < 3) return null;
  // Require at least 2 of the remaining segments to look like "range: value"
  if(parts.slice(1).filter(p=>p.includes(':')).length < 2) return null;

  let header = '';
  const tiers = [];
  const first = parts[0];
  // First segment may carry an embedded header: "Header: range: value" (2+ colons)
  const colonIdxs = [...first.matchAll(/:/g)].map(m=>m.index);
  if(colonIdxs.length >= 2){
    const hEnd = colonIdxs[colonIdxs.length - 2];
    const vStart = colonIdxs[colonIdxs.length - 1];
    header = first.slice(0, hEnd).trim();
    tiers.push({range: first.slice(hEnd+1, vStart).trim(), val: first.slice(vStart+1).trim()});
  } else if(colonIdxs.length === 1){
    tiers.push({range: first.slice(0, colonIdxs[0]).trim(), val: first.slice(colonIdxs[0]+1).trim()});
  } else {
    tiers.push({range: first, val: ''});
  }
  for(const p of parts.slice(1)){
    const ci = p.indexOf(':');
    tiers.push(ci >= 0 ? {range: p.slice(0,ci).trim(), val: p.slice(ci+1).trim()} : {range: p, val: ''});
  }
  return {header, tiers};
}

// Full bordered table — used in the single-card detail view.
function lateFeeTable(text){
  const parsed = parseTiers(text);
  if(!parsed) return null;
  const rows = parsed.tiers.map(({range, val})=>
    `<tr><td>${esc(range)}</td><td>${esc(val)}</td></tr>`).join('');
  const header = parsed.header ? `<p class="fee-hdr">${esc(parsed.header)}</p>` : '';
  return `${header}<table class="fee-table"><tbody>${rows}</tbody></table>`;
}

// Compact stacked tiers — used inside the narrow compare-grid cell.
// Renders one "range → ₹fee" line per tier instead of a run-on paragraph.
function lateFeeMini(text){
  const parsed = parseTiers(text);
  if(!parsed) return null;
  const rows = parsed.tiers.map(({range, val})=>
    `<div class="tier"><span class="tr">${esc(range)}</span><span class="tf">${esc(val||'—')}</span></div>`).join('');
  const header = parsed.header ? `<div class="tier-hdr">${esc(parsed.header)}</div>` : '';
  return `<div class="tiers">${header}${rows}</div>`;
}

// Small chip (home grid, headers, trust strip). Logo (banks.logo_url) on a
// white tile when available, else the colored initials fallback.
function bankTile(bank,size,logoUrl){
  const px=size||40;
  if(logoUrl)return `<span class="blogo" style="width:${px}px;height:${px}px"><img src="${esc(logoUrl)}" alt="${esc(bank)}" loading="lazy"></span>`;
  const m=BANKMETA[bank]||[String(bank).slice(0,5).toUpperCase(),'#0e0f0c'];
  const st=size?`height:${size}px;font-size:${Math.round(size*0.3)}px`:'';
  return `<span class="bmono" style="background:${m[1]};${st}">${m[0]}</span>`;
}
// Large 64px square used in the list row + detail header.
function bankBig(bank,logoUrl){
  return logoUrl?`<div class="logo logo-img"><img src="${esc(logoUrl)}" alt="${esc(bank)}" loading="lazy"></div>`:`<div class="logo">${esc((bank||'')[0]||'')}</div>`;
}
// name → logo_url, derived from the loaded cards (for the names-only trust strip)
function bankLogoMap(){const m={};CARDS.forEach(c=>{if(c.bankLogo)m[c.bank]=c.bankLogo;});return m;}

// Card art comes from cards.card_image_url (Supabase Storage); '' when none.
function cardImgSrc(c){return c.cardImage||'';}
// Left visual for the list row: bigger card art with the bank logo overlaid in
// the white-padded corner; falls back to the bank logo centered when no art.
function rowStage(c){
  const img=cardImgSrc(c);
  if(img){
    const chip=c.bankLogo?`<img class="rbankchip" src="${esc(c.bankLogo)}" alt="${esc(c.bank)}">`:'';
    return `<div class="rcard"><img class="rcard-art" src="${img}" alt="${esc(c.name)}" loading="lazy">${chip}</div>`;
  }
  const fb=c.bankLogo?`<img src="${esc(c.bankLogo)}" alt="${esc(c.bank)}" loading="lazy">`:`<span class="rcard-i">${esc((c.bank||'')[0]||'')}</span>`;
  return `<div class="rcard rcard-fb">${fb}</div>`;
}
// Card-art banner; falls back to the bank logo centered on the white stage.
function cardStage(c){
  const img=cardImgSrc(c);
  // Card art when available; if the art 404s (e.g. not yet deployed) fall back
  // to the bank logo at runtime so the tile never shows a broken image.
  if(img)return `<div class="tcard"><img src="${img}" alt="${esc(c.name)}" width="640" height="404" loading="lazy"${c.bankLogo?` onerror="this.onerror=null;this.src='${esc(c.bankLogo)}';this.closest('.tcard').classList.add('tcard-fb')"`:''}></div>`;
  if(c.bankLogo)return `<div class="tcard tcard-fb"><img src="${esc(c.bankLogo)}" alt="${esc(c.bank)}" loading="lazy"></div>`;
  return `<div class="tcard tcard-fb"><span class="tcard-i">${esc((c.bank||'')[0]||'')}</span></div>`;
}
function catsPresent(){ return CAT_ORDER.filter(k=>CARDS.some(c=>c.cat===k)); }
function applyLink(c, cls, place){
  const href = c.affiliate_url || c.apply_url;   // affiliate link wins when present
  const url = href ? esc(href) : '#';
  const data = `data-ev="apply_click" data-card="${esc(c.slug)}" data-bank="${esc(c.bank)}" data-cat="${esc(c.cat)}" data-place="${place||''}" data-aff="${c.affiliate_url?'1':'0'}"`;
  return `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer nofollow" ${data}>${t('apply_now')} →</a>`;
}

/* ---------- header ---------- */
const LOGO = `<svg class="logomark" viewBox="0 0 120 90" width="27" height="20" aria-hidden="true"><rect x="6" y="10" width="108" height="70" rx="14" fill="#a3e635"/><rect x="18" y="24" width="28" height="18" rx="5" fill="#10131a"/><rect x="18" y="52" width="64" height="8" rx="4" fill="#10131a" opacity="0.5"/><rect x="18" y="64" width="44" height="8" rx="4" fill="#10131a" opacity="0.35"/><circle cx="96" cy="60" r="13" fill="#10131a"/></svg>`;

function header(){
  const onList = S.route==='list';
  return `<header class="app"><div class="hwrap">
    <a class="brand" href="/">${LOGO}Card <b>Gyani</b></a>
    <nav class="nav">
      <a class="${S.route==='home'?'active':''}" href="/">${t('home')}</a>
      <a class="${onList?'active':''}" href="/cards">${t('all_cards')}</a>
      <a class="${S.route==='compare'?'active':''}" href="/compare">${t('compare')}<span data-cmp-count>${S.compare.length?` (${S.compare.length})`:''}</span></a>
    </nav>
    <div class="spacer"></div>
    <div class="lang">
      <button onclick="S.langOpen=!S.langOpen;S.sortOpen=false;render()">🌐 ${LANGS[S.lang][1]} ▾</button>
      ${S.langOpen?`<div class="lang-menu">${Object.keys(LANGS).map(l=>
        `<button class="${l===S.lang?'sel':''}" onclick="setLang('${l}')"><span>${LANGS[l][0]}</span><small>${LANGS[l][1]}</small></button>`).join('')}</div>`:''}
    </div>
  </div></header>`;
}

/* ---------- filters ---------- */
function filterBody(){
  const grp=(label,name,items)=>`<div class="fgroup"><div class="flabel">${label}</div>${
    items.map(([val,lab])=>`<label class="opt"><input type="checkbox" ${S.f[name].has(val)?'checked':''}
      onchange="toggleFilter('${name}','${val}')"><span class="box"></span>${lab}</label>`).join('')}</div>`;
  return grp(t('category'),'cat',catsPresent().map(k=>[k,t(k)]))
    + grp(t('annual_fee'),'fee',[['ltf',t('lifetime_free')],['u500',t('u500')],['b1',t('b1')],['b2',t('b2')],['b3',t('b3')]])
    + grp(t('type'),'type',[['retail',t('retail')],['cobrand',t('cobrand')],['business',t('business')],['secured',t('secured')]])
    + grp(t('benefits'),'ben',[['lounge_access',t('lounge_access')],['low_forex',t('low_forex')],['upi_card',t('upi_card')]])
    + grp(t('network'),'net',[['Visa','Visa'],['Mastercard','Mastercard'],['RuPay','RuPay'],['American Express','Amex'],['Diners Club','Diners Club']]);
}

/* ---------- card row (list) ---------- */
function cardRow(c){
  const picked=S.compare.includes(c.id);
  const tags=cardTags(c).map(tagChip);
  tags.push(`<span class="tag net">${esc(c.network)}</span>`);
  const waiver=c.waiver?`${t('waived_at')} ${lakh(c.waiver)} ${t('spend')}`:t('no_fee_waiver');
  return `<div class="card ${picked?'picked':''}" data-card="${c.id}">
    <div class="crow">
      ${rowStage(c)}
      <div class="cmid">
        <div class="cname">${esc(c.name)} <span>by ${esc(c.bank)}</span></div>
        <div class="tags">${tags.join('')}</div>
        <div class="specs">
          <div class="spec"><div class="k">${t('annual_fee')}</div><div class="v num">${inr(c.fee)}</div></div>
          <div class="spec"><div class="k">${t('fee_waiver')}</div><div class="v">${waiver}</div></div>
          <div class="spec"><div class="k">${t('forex_markup')}</div><div class="v num">${c.forex}%</div></div>
          <div class="spec"><div class="k">${t('finance_charge')}</div><div class="v num">${c.finM}% ${t('pm')}</div></div>
        </div>
      </div>
      <div class="cright">
        ${c.badge?`<div class="badge">★ ${esc(c.badge)}</div>`:''}
        ${applyLink(c,'apply','list')}
        <a class="viewbtn" href="/cards/${esc(c.slug)}" data-ev="view_details" data-card="${esc(c.slug)}" data-place="list">${t('view_details')}</a>
        <label class="cmp"><input type="checkbox" ${picked?'checked':''}
          onchange="toggleCompare('${c.id}')"><span class="box"></span>${t('compare')}</label>
      </div>
    </div></div>`;
}

/* ---------- list view (also category pages) ---------- */
export function listView(){
  const list=sorted(CARDS.filter(passes));
  const body=list.length?list.map(cardRow).join(''):
    `<div class="empty"><b>${t('none_match')}</b>${t('none_hint')}</div>`;
  const sortLabels={fee_high:t('sort_high'),fee_low:t('sort_low'),rew:t('sort_rew'),name:t('sort_name')};
  const catHead = S.catPage ? `<h1 style="font-size:26px;letter-spacing:-.02em;margin:0 0 4px">${t(S.catPage)} ${t('cards_word')}</h1>
      <p style="color:var(--muted);margin:0 0 16px;font-size:15px">${t('comparing')==='Comparing'?'Compare':''}${t(S.catPage)} ${t('cards_word')} — ${t('cmp_sub')}</p>` : '';
  return header()+`<div class="shell">
    <aside class="filters">
      <div class="fhead"><h2>${t('filter_cards')}</h2><button onclick="resetFilters()">${t('reset')}</button></div>
      ${filterBody()}
    </aside>
    <div class="results">
      ${catHead}
      <div class="sortbar">
        <div class="count">${t('showing')} <b data-count>${list.length}</b> ${t('cards_word')}</div>
        <div class="right-tools">
          <button class="mfilter" onclick="openDrawer()">⚙ ${t('filters')}${activeCount()?` (${activeCount()})`:''}</button>
          <div class="sortsel">
            <button onclick="S.sortOpen=!S.sortOpen;S.langOpen=false;render()">↕ ${sortLabels[S.sort]} ▾</button>
            ${S.sortOpen?`<div class="sort-menu">${Object.entries(sortLabels).map(([k,v])=>
              `<button class="${S.sort===k?'sel':''}" onclick="setSort('${k}')">${v}</button>`).join('')}</div>`:''}
          </div>
        </div>
      </div>
      <div class="list">${body}</div>
    </div>
  </div>`;
}

/* ---------- detail view ---------- */
export function detailView(slug){
  const c=bySlug(slug);
  if(!c)return header()+`<div class="detail"><a class="back" href="/cards">← ${t('back_to_cards')}</a><div class="empty"><b>${t('none_match')}</b></div></div>`;
  const picked=S.compare.includes(c.id);
  const waiver=c.waiver?`${t('waived_at')} ${lakh(c.waiver)} ${t('spend')}`:t('no_fee_waiver');
  const kv=(k,v)=>`<div class="kv"><span>${k}</span><span class="vv">${v}</span></div>`;
  return header()+`<div class="detail">
    <a class="back" href="/cards">← ${t('back_to_cards')}</a>
    <div class="dhero">
      ${bankBig(c.bank,c.bankLogo)}
      <div>
        <h1>${esc(c.name)}</h1>
        <div class="sub">by ${esc(c.bank)} · ${esc(c.network)} · <a href="/cards/category/${esc(c.cat).replace(/_/g,'-')}">${t(c.cat)}</a> · ${t(c.type)}</div>
        <div class="dtags">${cardTags(c).map(tagChip).join('')}</div>
      </div>
      <div class="acts">
        ${applyLink(c,'apply','detail')}
        <button class="viewbtn" onclick="toggleCompare('${c.id}')">${picked?'✓ '+t('selected'):'+ '+t('add_to_compare')}</button>
      </div>
    </div>
    <div class="dgrid">
      <div class="panel"><h3>${t('fees_charges')}</h3>
        ${kv(t('joining_fee'),inr(c.join))}
        ${kv(t('annual_fee'),inr(c.fee))}
        ${kv(t('fee_waiver'),waiver)}
        ${kv(t('forex_markup'),c.forex+'%')}
        ${kv(t('finance_charge'),c.finM+'% '+t('pm')+' ('+c.finA+'% '+t('pa')+')')}
        ${kv(t('cash_advance'),esc(c.cash))}
        ${(()=>{const lt=lateFeeTable(c.late);return lt?`<div class="kv kv-stack"><span>${t('late_payment')}</span>${lt}</div>`:kv(t('late_payment'),esc(c.late));})()}
      </div>
      <div class="dcol">
        <div class="panel"><h3>${t('rewards')} & ${t('lounge')}</h3>
          ${kv(t('rewards'),esc(c.reward))}
          ${kv(t('lounge'),esc(c.lounge))}
          ${kv(t('network'),esc(c.network))}
          ${kv(t('category'),t(c.cat))}
          ${kv(t('type'),t(c.type))}
        </div>
        <div class="panel"><h3>${t('key_features')}</h3>
          <ul class="flist">${c.feat.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
    <div class="addrow">
      <a class="primary" href="/cards">+ ${t('add_another')}</a>
      ${S.compare.length>=2?`<a class="ghost" href="/compare" data-ev="compare_view" data-place="addrow" data-n="${S.compare.length}">${t('compare_now')} (${S.compare.length}) →</a>`:''}
    </div>
  </div>`;
}

/* ---------- compare view ---------- */
export function compareView(){
  const cards=S.compare.map(bySlug).filter(Boolean);
  if(!cards.length)return header()+`<div class="cmppage"><h1>${t('compare')}</h1>
    <div class="empty"><b>${t('empty_cmp')}</b>${t('empty_hint')}
    <div style="margin-top:16px"><a class="apply" href="/cards">${t('all_cards')} →</a></div></div></div>`;
  const n=cards.length;
  const cols=`220px repeat(${n},minmax(220px,1fr))`;
  const feeRows=[
    [t('annual_fee'),c=>`<span class="num">${inr(c.fee)}</span>`],
    [t('joining_fee'),c=>`<span class="num">${inr(c.join)}</span>`],
    [t('fee_waiver'),c=>c.waiver?`${t('waived_at')} ${lakh(c.waiver)}`:t('no_fee_waiver')],
    [t('forex_markup'),c=>`<span class="num">${c.forex}%</span>`],
    [t('finance_charge'),c=>`<span class="num">${c.finM}% ${t('pm')}</span> <span style="color:var(--muted)">(${c.finA}% ${t('pa')})</span>`],
    [t('cash_advance'),c=>lateFeeMini(c.cash)||esc(c.cash)],
    [t('late_payment'),c=>lateFeeMini(c.late)||esc(c.late)],
  ];
  const rewRows=[
    [t('rewards'),c=>esc(c.reward)],
    [t('lounge'),c=>esc(c.lounge)],
    [t('network'),c=>esc(c.network)],
    [t('category'),c=>t(c.cat)],
    [t('type'),c=>c.type==='secured'?`${t('secured')} · ${t('fd_linked')}`:t(c.type)],
  ];
  const valCell=(fn,c)=>{const v=fn(c);const empty=(v==null||v==='');return `<div class="vcell ${empty?'na':''}">${empty?'—':v}</div>`;};
  const rowsHtml=rows=>rows.map(([label,fn])=>`<div class="lcell">${label}</div>${cards.map(c=>valCell(fn,c)).join('')}`).join('');
  return header()+`<div class="cmppage">
    <a class="back" href="/cards">← ${t('back_to_cards')}</a>
    <h1>${t('comparing')} ${n} ${t('cards_word')}</h1>
    <div class="csub">${t('cmp_sub')}</div>
    <div class="cmpwrap"><div class="cmpx"><div class="cmpgrid" style="grid-template-columns:${cols}">
      <div class="corner"></div>
      ${cards.map(c=>`<div class="hcell">
        <button class="rmx" title="${t('remove')}" onclick="toggleCompare('${c.id}')">✕</button>
        ${bankTile(c.bank,40,c.bankLogo)}
        <div><div class="hissuer">${esc(c.bank)}</div><div class="hname">${esc(c.name)}</div></div>
        <div class="ctags">${cardTags(c).map(tagChip).join('')}</div>
        ${applyLink(c,'apply','compare')}
      </div>`).join('')}
      <div class="band">${t('fees_charges')}</div>
      ${rowsHtml(feeRows)}
      <div class="band">${t('rewards_band')}</div>
      ${rowsHtml(rewRows)}
    </div></div></div>
    <div class="addrow"><a class="primary" href="/cards">+ ${t('add_another')}</a></div>
  </div>`;
}

/* ---------- home ---------- */
function homeCats(){
  return [
   ['all',t('all_cards'),()=>true],
   ['premium',t('premium'),c=>c.cat==='premium'||c.cat==='super_premium'],
   ['ltf',t('lifetime_free'),c=>c.fee===0],
   ['lounge',t('lounge_access'),c=>c.ben.includes('lounge')],
   ['lowforex',t('low_forex'),c=>c.forex<3],
   ['secured',t('fd_linked'),c=>c.type==='secured'],
  ];
}
function trendingCats(){
  return [
   ['premium',  t('premium'),       '👑', c=>c.cat==='premium'||c.cat==='super_premium'],
   ['rewards',  t('rewards'),        '🎁', c=>/reward|points|\bpts\b|\brp\b|miles/i.test(c.reward||'')],
   ['cashback', t('cashback'),       '💰', c=>/cashback|cash back/i.test((c.reward||'')+' '+(c.badge||''))],
   ['ltf',      t('lifetime_free'),  '💳', c=>isLtf(c)],
   ['lounge',   t('lounge_access'),  '✈️', c=>hasLounge(c)],
   ['lowforex', t('low_forex'),      '🌐', c=>c.forex<3],
  ];
}
function cardTile(c){
  const picked=S.compare.includes(c.id);
  return `<div class="tile ${picked?'picked':''}" data-card="${c.id}">
    ${cardStage(c)}
    <div class="tile-top">${bankTile(c.bank,40,c.bankLogo)}${c.badge?`<span class="badge">★ ${esc(c.badge)}</span>`:''}</div>
    <div class="tname">${esc(c.name)}</div>
    <div class="tissuer">by ${esc(c.bank)} · ${esc(c.network)}</div>
    ${c.type==='secured'?`<span class="tag fd" style="align-self:flex-start">🔒 ${t('fd_linked')}</span>`:''}
    <div class="tstats">
      <div><span>${t('annual_fee')}</span><b class="num">${inr(c.fee)}</b></div>
      <div><span>${t('forex_markup')}</span><b class="num">${c.forex}%</b></div>
    </div>
    <div class="tfeat">${esc(c.reward||'')}</div>
    <div class="tacts">
      ${applyLink(c,'apply','tile')}
      <a class="viewbtn" href="/cards/${esc(c.slug)}" data-ev="view_details" data-card="${esc(c.slug)}" data-place="tile">${t('view_details')}</a>
    </div>
    <label class="cmp tcmp"><input type="checkbox" ${picked?'checked':''}
      onchange="toggleCompare('${c.id}')"><span class="box"></span>${t('compare')}</label>
  </div>`;
}
function catLinks(){
  return `<div class="sf-cats"><span class="cat-l">${t('browse_cat')}</span>${
    catsPresent().map(k=>`<a href="/cards/category/${k.replace(/_/g,'-')}">${t(k)}</a>`).join('')}</div>`;
}
// Trending row — a fixed, hand-picked set of cards shown above the main grid.
// Purely presentational: links straight to each card's detail page, no state.
function trendingSection(){
  const SLUGS=['sbi-irctc-sbi-card','axis-flipkart-axis-bank-credit-card','axis-magnus-credit-card','sbi-cashback-sbi-card','axis-my-zone-credit-card','sbi-bpcl-sbi-card'];
  const cards=SLUGS.map(s=>bySlug(s)).filter(Boolean);
  if(cards.length<2) return '';
  const tiles=cards.map(c=>`<a class="trend-tile" href="/cards/${esc(c.slug)}">
      <div class="trend-logo">${esc(c.bank[0])}</div>
      <div class="trend-name">${esc(c.name)}</div>
      <div class="trend-bank">${esc(c.bank)}</div>
      ${c.badge?`<span class="trend-badge">${esc(c.badge)}</span>`:''}
      <div class="trend-fee">${inr(c.fee)}/yr</div>
    </a>`).join('');
  return `<section class="trending-wrap">
    <div class="trending-head">
      <h2>Trending Now <span class="trend-flame">🔥</span></h2>
    </div>
    <div class="trending-row">${tiles}</div>
  </section>`;
}
export function homeView(){
  const active=S.homeCat||'all';
  const TREND=trendingCats().filter(x=>CARDS.some(x[3]));
  const meta=active==='all'?null:trendingCats().find(x=>x[0]===active);
  const q=(S.homeQ||'').trim().toLowerCase();
  let list=meta?CARDS.filter(meta[3]):CARDS.slice();
  // Default (non-search) recommendation leads with affiliate-linked cards.
  list.sort((x,y)=>byAff(x,y) || (y.fee-x.fee));
  if(q){
    // Tokenise: split on whitespace + connectors (+, &, comma, slash, dash).
    // Strip intent/filler words so "best card for movies" → ["movies"].
    const FILLER=/^(best|good|top|card|cards|for|the|a|an|and|or|with|what|which|give|me|find|show|i|want|need|looking|my|in|india|indian|credit|debit)$/;
    const toks=q.split(/[\s+&,;/()\-]+/).map(s=>s.trim()).filter(s=>s.length>=2 && !FILLER.test(s));
    if(toks.length===0){
      // Nothing left after stripping (e.g. user typed only filler) — show all
    } else {
      // Per-card scoring: order-independent, all tokens must match somewhere.
      // Score tiers (per token): name 100 > bank 50 > badge/cat 40 > feat 20 > reward/lounge 10.
      // KEYWORD_MAP expands intent words to the terms that actually appear in card text.
      const scoreOf=c=>{
        const name=(c.name||'').toLowerCase();
        const bank=(c.bank||'').toLowerCase();
        const badgeCat=[(c.badge||''),(c.cat||'').replace(/_/g,' ')].join(' ').toLowerCase();
        const featText=(Array.isArray(c.feat)?c.feat.join(' '):'').toLowerCase();
        const descText=[(c.reward||''),(c.lounge||''),(c.network||''),(c.welcome||''),(c.fuelWaiver||''),
          isLtf(c)?'lifetime free ltf':'',isUpi(c)?'upi rupay':'',
          isCobrand(c)?'cobrand co-brand':'',c.type||'',
        ].join(' ').toLowerCase();
        // matchIn: checks if the token OR any of its KEYWORD_MAP aliases appear in text
        const matchIn=(tk,text)=>text.includes(tk)||(KEYWORD_MAP[tk]||[]).some(a=>text.includes(a));
        let s=0;
        for(const tk of toks){
          if(name.includes(tk))       s+=100;
          else if(bank.includes(tk))  s+=50;
          else if(matchIn(tk,badgeCat)) s+=40;
          else if(matchIn(tk,featText)) s+=20;
          else if(matchIn(tk,descText)) s+=10;
          else return 0; // token found nowhere → card doesn't match
        }
        // Lift exact / starts-with card name hits
        if(name===q) s+=1000; else if(name.startsWith(q)) s+=500;
        // Quality tiebreaker: better cards surface first among equal-relevance results
        if(c.cat==='super_premium') s+=4;
        else if(c.cat==='premium')  s+=2;
        else if(c.cat==='mid_tier') s+=1;
        // Monetisation lift: among similar-relevance matches, affiliate-linked cards
        // lead. Kept smaller than a relevance tier (10) so a clearly more relevant
        // non-affiliate card still ranks above (e.g. a name hit beats a reward hit).
        if(hasAff(c)) s+=8;
        return s;
      };
      list=list.map(c=>[c,scoreOf(c)]).filter(p=>p[1]>0).sort((a,b)=>b[1]-a[1]).map(p=>p[0]);
    }
  }
  // Only show count when the user has filtered/searched (not on the default "Trending now" heading)
  const headLabel=q?('"'+esc(S.homeQ)+'"'):(meta?meta[1]:t('trending_now'));
  const showCount=!!(q||meta);
  const banks=BANKS.length?BANKS:[...new Set(CARDS.map(c=>c.bank))];
  const BABA_SVG = `<svg class="cg-mark" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gyani Baba mascot cycling through rupee, flight and rewards">
  <defs><filter id="cgSoft" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0e0f0c" flood-opacity="0.20"/></filter></defs>
  <ellipse cx="120" cy="126" rx="92" ry="92" fill="rgba(159,232,112,.40)" opacity="0.5" style="filter:blur(26px)"/>
  <g class="cg-float">
    <path id="cgMorph" fill="#9fe870" filter="url(#cgSoft)"/>
    <g id="cgBabaDetail"><path d='M73.3 81.7 Q 120.0 96.7 166.7 81.7' fill='none' stroke='#0e0f0c' stroke-width='5.8' stroke-linecap='round'/><rect x='117.5' y='97.1' width='5.0' height='12.5' rx='2.5' fill='#0e0f0c'/><path d='M120.0 115.0 L 120.0 125.0' fill='none' stroke='#0e0f0c' stroke-width='4.2' stroke-linecap='round'/><path d='M103.3 111.7 Q 108.3 117.5 113.3 111.7' fill='none' stroke='#0e0f0c' stroke-width='4.2' stroke-linecap='round'/><path d='M126.7 111.7 Q 131.7 117.5 136.7 111.7' fill='none' stroke='#0e0f0c' stroke-width='4.2' stroke-linecap='round'/><path d='M105.0 131.7 Q 120.0 140.0 135.0 131.7' fill='none' stroke='#0e0f0c' stroke-width='4.2' stroke-linecap='round'/></g>
  </g></svg>`;
  return header()+`<div class="home">
    <section class="hero">
      <div class="hero-in">
        <div class="hero-copy">
          <h1>${t('hero_h1')}</h1>
          <p>${t('hero_sub').replace('{n}',CARDS.length)}</p>
          <div class="searchpill">
            <span class="si">🔍</span>
            <input id="homeSearch" type="text" placeholder="${t('search_ph')}" value="${esc(S.homeQ)}" oninput="setHomeQ(this.value,this.selectionStart)">
            ${S.homeQ?`<button class="sx" onclick="setHomeQ('')">✕</button>`:''}
          </div>
        </div>
        <div class="baba-stage">${BABA_SVG}</div>
      </div>
    </section>
    ${q.length>=3?'':(`<section class="catwrap">
      <div class="cats-head"><h2>${t('cats_h')}</h2></div>
      <p class="cats-sub">${t('cats_sub')}</p>
      <div class="catrow">${TREND.map(([id,lab,ic])=>`<a class="catitem ${active===id?'active':''}" href="/cards" onclick="setHomeCat(S.homeCat==='${id}'?'all':'${id}');return false"><div class="cat-card">${ic}</div><span class="cat-l">${lab}</span></a>`).join('')}</div>
    </section>`)}
    ${trendingSection()}
    <section class="hgrid-wrap">
      <div class="hgrid-head">
        <h2>${headLabel}${showCount?` <span>· ${list.length}</span>`:''}</h2>
        <a class="seeall" href="/cards">${t('see_all')}</a>
      </div>
      ${list.length?`<div class="grid">${list.slice(0,6).map(cardTile).join('')}</div>`:`<div class="empty" style="max-width:520px;margin:0 auto"><b>${t('none_match')}</b>${t('none_hint')}</div>`}
    </section>
  </div>
  <section class="whyband" id="statband">
    <div class="why-head">
      <span class="kpill">${t('why_k')}</span>
      <h2>${t('conf_a')} <em>${t('conf_b')}</em> ${t('conf_c')}</h2>
      <p>${t('conf_sub')}</p>
    </div>
    <div class="statband-in">
      <div class="statcard"><div class="statnum" data-target="${CARDS.length}" data-suffix="+">${CARDS.length}+</div><div class="statlbl">${t('stat_cards')}</div></div>
      <div class="statcard"><div class="statnum" data-target="${banks.length}" data-suffix="+">${banks.length}+</div><div class="statlbl">${t('stat_banks')}</div></div>
      <div class="statcard"><div class="statnum" data-target="4" data-suffix="">4</div><div class="statlbl">${t('stat_langs')}</div></div>
      <div class="statcard"><div class="statnum" data-target="100" data-suffix="%">100%</div><div class="statlbl">${t('stat_verified')}</div></div>
    </div>
  </section>
  <section class="marquee">
    <div class="marquee-head"><span class="k">${t('marquee_k')}</span><h2>${t('marquee_h')}</h2></div>
    <div class="marquee-mask"><div class="marquee-track">${(()=>{const lm=bankLogoMap();const row=banks.map(b=>bankTile(b,40,lm[b])).join('');return row+row;})()}</div></div>
  </section>
  <footer class="site-footer"><div class="sf-in">
    <div class="brand">${LOGO}Card <b>Gyani</b></div>
    <span>${t('footer_note')}</span>
  </div>${catLinks()}</footer>`;
}

/* ---------- tray + drawer (client overlays) ---------- */
export function trayHTML(){
  if(S.route==='compare' || !S.compare.length)return {cls:'tray',html:''};
  const cards=S.compare.map(bySlug).filter(Boolean);
  return {cls:'tray show', html:`<div class="tray-in">
    <div class="chips">${cards.map(c=>`<span class="chip"><span class="chip-name">${esc(c.name)}</span><button onclick="toggleCompare('${c.id}')">✕</button></span>`).join('')}</div>
    <div class="tray-actions">
      <span class="tray-count">${S.compare.length}/4 ${t('selected')}</span>
      <button class="clr" onclick="clearCompare()">${t('clear_all')}</button>
      <a class="go ${S.compare.length<2?'disabled':''}" href="/compare" data-ev="compare_view" data-place="tray" data-n="${S.compare.length}">${t('compare_now')} →</a>
    </div>
  </div>`};
}
export function drawerHTML(){
  return `<div class="dh"><h2>${t('filter_cards')}</h2><button class="x" onclick="closeDrawer()">✕</button></div>
    ${filterBody()}
    <div class="applybar"><button onclick="closeDrawer()">${t('showing')} ${CARDS.filter(passes).length} ${t('cards_word')}</button></div>`;
}

/* ---------- top-level dispatch ---------- */
export function viewFor(){
  if(S.route==='home')return homeView();
  if(S.route==='list')return listView();
  if(S.route==='detail')return detailView(S.detailSlug);
  if(S.route==='compare')return compareView();
  return homeView();
}

/* convenience for build-time pages: set data+state and return html */
export function renderRoute(over){
  setState(defaultState(over));
  return viewFor();
}
