UPDATE cards AS c SET
  network = CASE c.slug
    WHEN 'au-prathama' THEN NULL
    WHEN 'au-altura' THEN NULL
    WHEN 'au-nomo' THEN 'Visa'
    WHEN 'au-xcite' THEN NULL
    WHEN 'au-spont' THEN NULL
    WHEN 'au-altura-plus' THEN NULL
    WHEN 'au-tejas' THEN NULL
    WHEN 'au-xcite-ultra' THEN NULL
    WHEN 'au-xcite-ace' THEN NULL
    WHEN 'au-lakshya' THEN NULL
    WHEN 'au-ananta' THEN NULL
    WHEN 'au-vetta' THEN 'Visa'
    WHEN 'au-zenith-plus' THEN 'Visa'
    WHEN 'au-zenith' THEN 'Visa'
    WHEN 'au-business-cashback' THEN 'RuPay'
    WHEN 'au-cheq' THEN 'RuPay'
    WHEN 'au-cheq-led' THEN 'Visa'
    WHEN 'au-traverse-nri' THEN 'Visa'
    WHEN 'au-lit' THEN NULL
    WHEN 'au-instapay' THEN 'RuPay'
    WHEN 'au-kosmo' THEN 'RuPay'
    WHEN 'au-ixigo' THEN 'RuPay'
    ELSE c.network END,
  network_confidence = CASE c.slug
    WHEN 'au-prathama' THEN 'unknown'
    WHEN 'au-altura' THEN 'unknown'
    WHEN 'au-nomo' THEN 'low'
    WHEN 'au-xcite' THEN 'unknown'
    WHEN 'au-spont' THEN 'unknown'
    WHEN 'au-altura-plus' THEN 'unknown'
    WHEN 'au-tejas' THEN 'low'
    WHEN 'au-xcite-ultra' THEN 'unknown'
    WHEN 'au-xcite-ace' THEN 'unknown'
    WHEN 'au-lakshya' THEN 'unknown'
    WHEN 'au-ananta' THEN 'unknown'
    WHEN 'au-vetta' THEN 'high'
    WHEN 'au-zenith-plus' THEN 'high'
    WHEN 'au-zenith' THEN 'high'
    WHEN 'au-business-cashback' THEN 'high'
    WHEN 'au-cheq' THEN 'high'
    WHEN 'au-cheq-led' THEN 'high'
    WHEN 'au-traverse-nri' THEN 'high'
    WHEN 'au-lit' THEN 'unknown'
    WHEN 'au-instapay' THEN 'high'
    WHEN 'au-kosmo' THEN 'high'
    WHEN 'au-ixigo' THEN 'high'
    ELSE c.network_confidence END,
  category = CASE c.slug
    WHEN 'au-prathama' THEN 'entry'
    WHEN 'au-altura' THEN 'entry'
    WHEN 'au-nomo' THEN 'entry'
    WHEN 'au-xcite' THEN 'mid_tier'
    WHEN 'au-spont' THEN 'entry'
    WHEN 'au-altura-plus' THEN 'entry'
    WHEN 'au-tejas' THEN 'entry'
    WHEN 'au-xcite-ultra' THEN 'premium'
    WHEN 'au-xcite-ace' THEN 'premium'
    WHEN 'au-lakshya' THEN 'entry'
    WHEN 'au-ananta' THEN 'mid_tier'
    WHEN 'au-vetta' THEN 'mid_tier'
    WHEN 'au-zenith-plus' THEN 'premium'
    WHEN 'au-zenith' THEN 'premium'
    WHEN 'au-business-cashback' THEN 'entry'
    WHEN 'au-cheq' THEN 'entry'
    WHEN 'au-cheq-led' THEN 'entry'
    WHEN 'au-traverse-nri' THEN 'mid_tier'
    WHEN 'au-lit' THEN 'entry'
    WHEN 'au-instapay' THEN 'entry'
    WHEN 'au-kosmo' THEN 'entry'
    WHEN 'au-ixigo' THEN 'entry'
    ELSE c.category END,
  reward_summary = CASE c.slug
    WHEN 'au-prathama' THEN 'Milestone Reward Points via AU Rewardz on shopping, dining, movies, bill payments & everyday spends; 1% fuel surcharge waiver (max Rs.100/month)'
    WHEN 'au-altura' THEN '2% cashback on grocery, departmental store & utility spends (max Rs.50/cycle); 1% on other retail (max Rs.50/cycle); +Rs.50 cashback on min Rs.10,000 retail/cycle; fuel excluded'
    WHEN 'au-nomo' THEN '2 Reward Points per Rs.100 retail (1 RP = Rs.0.25); quarterly bonus 500 RP at Rs.25,000 spend, doubles at Rs.50,000; 1% fuel surcharge waiver (max Rs.100)'
    WHEN 'au-xcite' THEN '1.5% cashback on POS retail; 2X Reward Points on online card usage'
    WHEN 'au-spont' THEN '1% cashback on all eCommerce, POS, contactless & UPI (cap Rs.500/cycle; excl fuel, rent, govt & education, cash, EMI, insurance); never-expiring coins on UPI; 1% fuel surcharge waiver'
    WHEN 'au-altura-plus' THEN '2 Reward Points per Rs.100 on all online transactions; 1 RP/Rs.100 on utility, telecom & insurance; 500 bonus RP on Rs.20,000+ monthly spend; 1% fuel surcharge waiver'
    WHEN 'au-tejas' THEN 'Accelerated reward points on eligible spends; 500 bonus RP on 5+ transactions/cycle; partner cashback (movies, grocery, food delivery, cabs, bill payments); fuel surcharge waiver'
    WHEN 'au-xcite-ultra' THEN '1 Reward Point per Rs.100 on utility & telecom (max 100 RP/txn); 1% fuel surcharge waiver (Rs.400-5,000, max Rs.150/cycle)'
    WHEN 'au-xcite-ace' THEN 'Up to Rs.76 extra cashback on contactless; +Rs.50 cashback on min Rs.10,000 retail/cycle'
    WHEN 'au-lakshya' THEN 'Up to 5 Reward Points per Rs.100 on Grocery, Departmental Stores & Contactless; 1 RP/Rs.100 on Insurance, Utility & Telecom; 15% off at partner merchants; monthly BOGO movie tickets; fuel surcharge waiver'
    WHEN 'au-ananta' THEN 'Up to 5 Reward Points per Rs.100 on shopping, dining & travel; up to 50,000 RP in a card-anniversary year'
    WHEN 'au-vetta' THEN 'Up to 4 Reward Points per Rs.100; 500 bonus RP on Rs.50,000/quarter and 1,000 bonus RP on Rs.1 lakh/quarter retail spend; 1,000 bonus RP on a birthday transaction'
    WHEN 'au-zenith-plus' THEN 'Up to 2 Reward Points per Rs.100 on dining, travel & international; 1,000 bonus RP on min Rs.75,000 retail spend/cycle; 1 RP = Rs.1'
    WHEN 'au-zenith' THEN '2 Reward Points per Rs.100 on travel, dining & international; 1 RP/Rs.100 other; 1 RP = Rs.1'
    WHEN 'au-business-cashback' THEN '1% cashback on spends (credited on full Total Amount Due repayment); GST payment enabled; business insurance cover (cash-in-transit, fire & burglary, public liability, air accident)'
    WHEN 'au-cheq' THEN '12% reward points on top brands (flights, hotels, utilities), 5% on other online shopping/travel/food/grocery, 2.5% on CheQ UPI, 1% elsewhere; 2 points = Rs.1 on CheQ Travel; fuel surcharge waiver'
    WHEN 'au-cheq-led' THEN '12% reward points on top brands (flights, hotels, utilities), 5% on other online shopping/travel/food/grocery, 2.5% on CheQ UPI, 1% elsewhere; 2 points = Rs.1 on CheQ Travel; fuel surcharge waiver'
    WHEN 'au-traverse-nri' THEN '4 Reward Points per Rs.100 on international spends; fuel surcharge waiver up to Rs.250/month (fuel/EMI/cash/rent/education/govt excluded)'
    WHEN 'au-lit' THEN '1 Reward Point per Rs.100 retail (base); customizable add-on features e.g. up to 5% cashback (max Rs.1,000/30 days) on selected categories by paying a feature fee'
    WHEN 'au-instapay' THEN '1% cashback on UPI transactions across Departmental Stores, Dining, Pharmacy, Grocery & Supermarkets (cap Rs.100/cycle)'
    WHEN 'au-kosmo' THEN 'Kiwi Rewards on UPI Scan & Pay (via Kiwi app), Ecom, POS & contactless (excl cash, rent, education/govt, insurance, EMI, fuel, BBPS); 1% fuel surcharge waiver. Exact per-Rs.100 rate not stated on AU pages'
    WHEN 'au-ixigo' THEN '1 Reward Point per Rs.200 (online, offline & CC-on-UPI); bonus at Rs.75,000 quarterly spend; 1 RP = 25 paise (50 paise on ixigo money); zero forex markup'
    ELSE c.reward_summary END,
  lounge_access = CASE c.slug
    WHEN 'au-prathama' THEN 'Complimentary domestic airport lounge on Rs.20,000 spend per calendar quarter (AU program default)'
    WHEN 'au-altura' THEN '2 complimentary railway lounge visits per calendar quarter; complimentary domestic airport lounge on Rs.20,000/quarter spend'
    WHEN 'au-nomo' THEN '2 complimentary domestic lounge visits per quarter on Rs.50,000 spend in prior quarter (w.e.f. 10-Apr-2026)'
    WHEN 'au-xcite' THEN '8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend'
    WHEN 'au-spont' THEN '2 railway lounge visits/quarter; 2 complimentary domestic airport lounge visits/quarter on Rs.50,000/quarter spend'
    WHEN 'au-altura-plus' THEN '2 complimentary railway lounge visits per calendar quarter; complimentary domestic airport lounge on Rs.20,000/quarter spend'
    WHEN 'au-tejas' THEN 'Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)'
    WHEN 'au-xcite-ultra' THEN '8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend'
    WHEN 'au-xcite-ace' THEN '8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend'
    WHEN 'au-lakshya' THEN '8 complimentary domestic airport lounge visits/year (max 2/quarter)'
    WHEN 'au-ananta' THEN 'Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)'
    WHEN 'au-vetta' THEN '1 complimentary domestic + 1 international airport lounge access per quarter, plus railway lounge access'
    WHEN 'au-zenith-plus' THEN '4 complimentary domestic + 4 international airport lounge visits per quarter (Priority Pass)'
    WHEN 'au-zenith' THEN '8 domestic (2/quarter) + 8 international (2/quarter) lounge visits/year via Priority Pass; from 10-Apr-2026 domestic needs Rs.50,000 prior-quarter spend'
    WHEN 'au-business-cashback' THEN NULL
    WHEN 'au-cheq' THEN '2 complimentary domestic lounge visits on Rs.20,000/quarter spend'
    WHEN 'au-cheq-led' THEN '2 complimentary domestic lounge visits on Rs.20,000/quarter spend'
    WHEN 'au-traverse-nri' THEN 'Priority Pass membership; 2 complimentary domestic + international lounge visits per quarter (USD 35 + GST beyond complimentary)'
    WHEN 'au-lit' THEN 'Up to 2 domestic airport lounge visits per quarter (feature-based)'
    WHEN 'au-instapay' THEN 'Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)'
    WHEN 'au-kosmo' THEN NULL
    WHEN 'au-ixigo' THEN '2 complimentary domestic lounge visits on Rs.20,000/quarter spend; Priority Pass on request (1,000+ intl lounges)'
    ELSE c.lounge_access END,
  welcome_benefit = CASE c.slug
    WHEN 'au-prathama' THEN NULL
    WHEN 'au-altura' THEN 'Introductory 5% cashback on min Rs.2,500 retail spend within first 60 days (max Rs.150/cycle)'
    WHEN 'au-nomo' THEN '500 Reward Points on first transaction within 30 days of setup'
    WHEN 'au-xcite' THEN '10,000 bonus Reward Points on spending Rs.1 lakh within 60 days of issuance'
    WHEN 'au-spont' THEN NULL
    WHEN 'au-altura-plus' THEN 'Welcome vouchers worth Rs.500 on min Rs.10,000 retail spend within 60 days'
    WHEN 'au-tejas' THEN 'Bonus reward points or curated brand voucher on card activation'
    WHEN 'au-xcite-ultra' THEN '10,000 bonus Reward Points on spending Rs.1 lakh within 60 days'
    WHEN 'au-xcite-ace' THEN NULL
    WHEN 'au-lakshya' THEN 'Brand vouchers worth Rs.1,000 or 4,000 Reward Points on activation & first transaction within 30 days'
    WHEN 'au-ananta' THEN '8,000 Reward Points on card activation & first transaction'
    WHEN 'au-vetta' THEN '10,000 bonus Reward Points on Rs.1 lakh spend within first 60 days; complimentary annual Times Prime membership'
    WHEN 'au-zenith-plus' THEN 'Luxury brand vouchers worth Rs.5,000 on card activation (or equivalent Reward Points)'
    WHEN 'au-zenith' THEN 'Welcome benefit worth Rs.5,000 on activation (luxury voucher or Reward Points)'
    WHEN 'au-business-cashback' THEN NULL
    WHEN 'au-cheq' THEN 'Virtual card issued instantly on approval'
    WHEN 'au-cheq-led' THEN 'Virtual card instantly on approval; India''s first LED card that lights up on every transaction'
    WHEN 'au-traverse-nri' THEN 'Rs.5,000 MakeMyTrip voucher on card activation within 30 days'
    WHEN 'au-lit' THEN NULL
    WHEN 'au-instapay' THEN NULL
    WHEN 'au-kosmo' THEN NULL
    WHEN 'au-ixigo' THEN 'Rs.1,000 ixigo money + 1,000 Reward Points on first transaction within 30 days'
    ELSE c.welcome_benefit END,
  badge = CASE c.slug
    WHEN 'au-prathama' THEN NULL
    WHEN 'au-altura' THEN 'cashback card'
    WHEN 'au-nomo' THEN 'low forex markup'
    WHEN 'au-xcite' THEN 'cashback card'
    WHEN 'au-spont' THEN 'cashback card'
    WHEN 'au-altura-plus' THEN NULL
    WHEN 'au-tejas' THEN NULL
    WHEN 'au-xcite-ultra' THEN 'premium'
    WHEN 'au-xcite-ace' THEN 'premium'
    WHEN 'au-lakshya' THEN NULL
    WHEN 'au-ananta' THEN NULL
    WHEN 'au-vetta' THEN NULL
    WHEN 'au-zenith-plus' THEN 'metal card'
    WHEN 'au-zenith' THEN 'premium'
    WHEN 'au-business-cashback' THEN 'cashback card'
    WHEN 'au-cheq' THEN NULL
    WHEN 'au-cheq-led' THEN NULL
    WHEN 'au-traverse-nri' THEN 'low forex markup'
    WHEN 'au-lit' THEN 'cashback card'
    WHEN 'au-instapay' THEN 'cashback card'
    WHEN 'au-kosmo' THEN NULL
    WHEN 'au-ixigo' THEN 'low forex markup'
    ELSE c.badge END,
  apply_url = CASE c.slug
    WHEN 'au-prathama' THEN 'https://www.au.bank.in/personal-banking/credit-cards/prathama-credit-card'
    WHEN 'au-altura' THEN 'https://www.au.bank.in/personal-banking/credit-cards/altura-credit-card'
    WHEN 'au-nomo' THEN 'https://www.au.bank.in/personal-banking/credit-cards/nomo-credit-card'
    WHEN 'au-xcite' THEN 'https://www.au.bank.in/personal-banking/credit-cards/swipeup-program/xcite-credit-card'
    WHEN 'au-spont' THEN 'https://www.au.bank.in/personal-banking/credit-cards/au-spont-credit-card'
    WHEN 'au-altura-plus' THEN 'https://www.au.bank.in/personal-banking/credit-cards/altura-plus-credit-card'
    WHEN 'au-tejas' THEN 'https://www.au.bank.in/personal-banking/credit-cards/tejas-credit-card'
    WHEN 'au-xcite-ultra' THEN 'https://www.au.bank.in/personal-banking/credit-cards/swipeup-program/xcite-ultra-credit-card'
    WHEN 'au-xcite-ace' THEN 'https://www.au.bank.in/personal-banking/credit-cards/swipeup-program/xcite-ace-credit-card'
    WHEN 'au-lakshya' THEN 'https://www.au.bank.in/personal-banking/credit-cards/laksya-credit-card'
    WHEN 'au-ananta' THEN 'https://www.au.bank.in/personal-banking/credit-cards/ananta-credit-card'
    WHEN 'au-vetta' THEN 'https://www.au.bank.in/personal-banking/credit-cards/vetta-credit-card'
    WHEN 'au-zenith-plus' THEN 'https://www.au.bank.in/premium-banking/credit-cards/zenith-plus-credit-card'
    WHEN 'au-zenith' THEN 'https://www.au.bank.in/personal-banking/credit-cards/zenith-credit-card'
    WHEN 'au-business-cashback' THEN 'https://www.au.bank.in/personal-banking/commercial-credit-cards/business-cashback-credit-card'
    WHEN 'au-cheq' THEN 'https://cheq.one/cheq-au-credit-card'
    WHEN 'au-cheq-led' THEN 'https://cheq.one/cheq-au-credit-card'
    WHEN 'au-traverse-nri' THEN 'https://www.au.bank.in/premium-banking/credit-cards/traverse-credit-card'
    WHEN 'au-lit' THEN 'https://www.au.bank.in/personal-banking/credit-cards/lit-credit-card'
    WHEN 'au-instapay' THEN 'https://www.au.bank.in/personal-banking/credit-cards/instapay-credit-card'
    WHEN 'au-kosmo' THEN 'https://www.au.bank.in/personal-banking/credit-cards/kosmo-credit-card'
    WHEN 'au-ixigo' THEN 'https://www.ixigo.com/payments/cbcc'
    ELSE c.apply_url END,
  features = CASE c.slug
    WHEN 'au-prathama' THEN ARRAY['Milestone Reward Points via AU Rewardz on shopping, dining, movies, bill payments & everyday spends; 1% fuel surcharge waiver (max Rs.100/month)','Complimentary domestic airport lounge on Rs.20,000 spend per calendar quarter (AU program default)']::text[]
    WHEN 'au-altura' THEN ARRAY['2% cashback on grocery, departmental store & utility spends (max Rs.50/cycle); 1% on other retail (max Rs.50/cycle); +Rs.50 cashback on min Rs.10,000 retail/cycle; fuel excluded','2 complimentary railway lounge visits per calendar quarter; complimentary domestic airport lounge on Rs.20,000/quarter spend','Introductory 5% cashback on min Rs.2,500 retail spend within first 60 days (max Rs.150/cycle)']::text[]
    WHEN 'au-nomo' THEN ARRAY['2 Reward Points per Rs.100 retail (1 RP = Rs.0.25); quarterly bonus 500 RP at Rs.25,000 spend, doubles at Rs.50,000; 1% fuel surcharge waiver (max Rs.100)','2 complimentary domestic lounge visits per quarter on Rs.50,000 spend in prior quarter (w.e.f. 10-Apr-2026)','500 Reward Points on first transaction within 30 days of setup']::text[]
    WHEN 'au-xcite' THEN ARRAY['1.5% cashback on POS retail; 2X Reward Points on online card usage','8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend','10,000 bonus Reward Points on spending Rs.1 lakh within 60 days of issuance']::text[]
    WHEN 'au-spont' THEN ARRAY['1% cashback on all eCommerce, POS, contactless & UPI (cap Rs.500/cycle; excl fuel, rent, govt & education, cash, EMI, insurance); never-expiring coins on UPI; 1% fuel surcharge waiver','2 railway lounge visits/quarter; 2 complimentary domestic airport lounge visits/quarter on Rs.50,000/quarter spend']::text[]
    WHEN 'au-altura-plus' THEN ARRAY['2 Reward Points per Rs.100 on all online transactions; 1 RP/Rs.100 on utility, telecom & insurance; 500 bonus RP on Rs.20,000+ monthly spend; 1% fuel surcharge waiver','2 complimentary railway lounge visits per calendar quarter; complimentary domestic airport lounge on Rs.20,000/quarter spend','Welcome vouchers worth Rs.500 on min Rs.10,000 retail spend within 60 days']::text[]
    WHEN 'au-tejas' THEN ARRAY['Accelerated reward points on eligible spends; 500 bonus RP on 5+ transactions/cycle; partner cashback (movies, grocery, food delivery, cabs, bill payments); fuel surcharge waiver','Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)','Bonus reward points or curated brand voucher on card activation']::text[]
    WHEN 'au-xcite-ultra' THEN ARRAY['1 Reward Point per Rs.100 on utility & telecom (max 100 RP/txn); 1% fuel surcharge waiver (Rs.400-5,000, max Rs.150/cycle)','8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend','10,000 bonus Reward Points on spending Rs.1 lakh within 60 days']::text[]
    WHEN 'au-xcite-ace' THEN ARRAY['Up to Rs.76 extra cashback on contactless; +Rs.50 cashback on min Rs.10,000 retail/cycle','8 railway lounge visits/year (max 2/quarter); complimentary domestic airport lounge on Rs.20,000/quarter spend']::text[]
    WHEN 'au-lakshya' THEN ARRAY['Up to 5 Reward Points per Rs.100 on Grocery, Departmental Stores & Contactless; 1 RP/Rs.100 on Insurance, Utility & Telecom; 15% off at partner merchants; monthly BOGO movie tickets; fuel surcharge waiver','8 complimentary domestic airport lounge visits/year (max 2/quarter)','Brand vouchers worth Rs.1,000 or 4,000 Reward Points on activation & first transaction within 30 days']::text[]
    WHEN 'au-ananta' THEN ARRAY['Up to 5 Reward Points per Rs.100 on shopping, dining & travel; up to 50,000 RP in a card-anniversary year','Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)','8,000 Reward Points on card activation & first transaction']::text[]
    WHEN 'au-vetta' THEN ARRAY['Up to 4 Reward Points per Rs.100; 500 bonus RP on Rs.50,000/quarter and 1,000 bonus RP on Rs.1 lakh/quarter retail spend; 1,000 bonus RP on a birthday transaction','1 complimentary domestic + 1 international airport lounge access per quarter, plus railway lounge access','10,000 bonus Reward Points on Rs.1 lakh spend within first 60 days; complimentary annual Times Prime membership']::text[]
    WHEN 'au-zenith-plus' THEN ARRAY['Up to 2 Reward Points per Rs.100 on dining, travel & international; 1,000 bonus RP on min Rs.75,000 retail spend/cycle; 1 RP = Rs.1','4 complimentary domestic + 4 international airport lounge visits per quarter (Priority Pass)','Luxury brand vouchers worth Rs.5,000 on card activation (or equivalent Reward Points)']::text[]
    WHEN 'au-zenith' THEN ARRAY['2 Reward Points per Rs.100 on travel, dining & international; 1 RP/Rs.100 other; 1 RP = Rs.1','8 domestic (2/quarter) + 8 international (2/quarter) lounge visits/year via Priority Pass; from 10-Apr-2026 domestic needs Rs.50,000 prior-quarter spend','Welcome benefit worth Rs.5,000 on activation (luxury voucher or Reward Points)']::text[]
    WHEN 'au-business-cashback' THEN ARRAY['1% cashback on spends (credited on full Total Amount Due repayment); GST payment enabled; business insurance cover (cash-in-transit, fire & burglary, public liability, air accident)']::text[]
    WHEN 'au-cheq' THEN ARRAY['12% reward points on top brands (flights, hotels, utilities), 5% on other online shopping/travel/food/grocery, 2.5% on CheQ UPI, 1% elsewhere; 2 points = Rs.1 on CheQ Travel; fuel surcharge waiver','2 complimentary domestic lounge visits on Rs.20,000/quarter spend','Virtual card issued instantly on approval']::text[]
    WHEN 'au-cheq-led' THEN ARRAY['12% reward points on top brands (flights, hotels, utilities), 5% on other online shopping/travel/food/grocery, 2.5% on CheQ UPI, 1% elsewhere; 2 points = Rs.1 on CheQ Travel; fuel surcharge waiver','2 complimentary domestic lounge visits on Rs.20,000/quarter spend','Virtual card instantly on approval; India''s first LED card that lights up on every transaction']::text[]
    WHEN 'au-traverse-nri' THEN ARRAY['4 Reward Points per Rs.100 on international spends; fuel surcharge waiver up to Rs.250/month (fuel/EMI/cash/rent/education/govt excluded)','Priority Pass membership; 2 complimentary domestic + international lounge visits per quarter (USD 35 + GST beyond complimentary)','Rs.5,000 MakeMyTrip voucher on card activation within 30 days']::text[]
    WHEN 'au-lit' THEN ARRAY['1 Reward Point per Rs.100 retail (base); customizable add-on features e.g. up to 5% cashback (max Rs.1,000/30 days) on selected categories by paying a feature fee','Up to 2 domestic airport lounge visits per quarter (feature-based)']::text[]
    WHEN 'au-instapay' THEN ARRAY['1% cashback on UPI transactions across Departmental Stores, Dining, Pharmacy, Grocery & Supermarkets (cap Rs.100/cycle)','Complimentary domestic airport lounge on Rs.20,000/quarter spend (AU default)']::text[]
    WHEN 'au-kosmo' THEN ARRAY['Kiwi Rewards on UPI Scan & Pay (via Kiwi app), Ecom, POS & contactless (excl cash, rent, education/govt, insurance, EMI, fuel, BBPS); 1% fuel surcharge waiver. Exact per-Rs.100 rate not stated on AU pages']::text[]
    WHEN 'au-ixigo' THEN ARRAY['1 Reward Point per Rs.200 (online, offline & CC-on-UPI); bonus at Rs.75,000 quarterly spend; 1 RP = 25 paise (50 paise on ixigo money); zero forex markup','2 complimentary domestic lounge visits on Rs.20,000/quarter spend; Priority Pass on request (1,000+ intl lounges)','Rs.1,000 ixigo money + 1,000 Reward Points on first transaction within 30 days']::text[]
    ELSE c.features END,
  match_status = CASE c.slug
    WHEN 'au-prathama' THEN 'matched'
    WHEN 'au-altura' THEN 'matched'
    WHEN 'au-nomo' THEN 'matched'
    WHEN 'au-xcite' THEN 'matched'
    WHEN 'au-spont' THEN 'matched'
    WHEN 'au-altura-plus' THEN 'matched'
    WHEN 'au-tejas' THEN 'matched'
    WHEN 'au-xcite-ultra' THEN 'matched'
    WHEN 'au-xcite-ace' THEN 'matched'
    WHEN 'au-lakshya' THEN 'matched'
    WHEN 'au-ananta' THEN 'matched'
    WHEN 'au-vetta' THEN 'matched'
    WHEN 'au-zenith-plus' THEN 'matched'
    WHEN 'au-zenith' THEN 'matched'
    WHEN 'au-business-cashback' THEN 'matched'
    WHEN 'au-cheq' THEN 'matched'
    WHEN 'au-cheq-led' THEN 'matched'
    WHEN 'au-traverse-nri' THEN 'matched'
    WHEN 'au-lit' THEN 'matched'
    WHEN 'au-instapay' THEN 'matched'
    WHEN 'au-kosmo' THEN 'matched'
    WHEN 'au-ixigo' THEN 'matched'
    ELSE c.match_status END,
  data_status = 'verified',
  updated_at = now()
WHERE c.slug IN (
  'au-prathama',
  'au-altura',
  'au-nomo',
  'au-xcite',
  'au-spont',
  'au-altura-plus',
  'au-tejas',
  'au-xcite-ultra',
  'au-xcite-ace',
  'au-lakshya',
  'au-ananta',
  'au-vetta',
  'au-zenith-plus',
  'au-zenith',
  'au-business-cashback',
  'au-cheq',
  'au-cheq-led',
  'au-traverse-nri',
  'au-lit',
  'au-instapay',
  'au-kosmo',
  'au-ixigo'
);
