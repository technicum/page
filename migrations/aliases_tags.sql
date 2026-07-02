-- ============================================================
-- Migration: Category Aliases + Tags
-- Purpose  : SEO landing pages per keyword + business tags
-- Run once : paste into phpMyAdmin or run via mysql CLI
-- ============================================================

-- ------------------------------------------------------------
-- 1. RENAME EXISTING CATEGORIES (India-friendly names)
-- ------------------------------------------------------------

UPDATE ms_categories SET name = 'Restaurant, Dhaba & Cloud Kitchen', icon = '🍽️' WHERE slug = 'restaurant';
UPDATE ms_categories SET name = 'Retail, Kirana & General Store',    icon = '🛒' WHERE slug = 'retail';
UPDATE ms_categories SET name = 'Clinic, Hospital & Diagnostic',     icon = '🏥' WHERE slug = 'healthcare';
UPDATE ms_categories SET name = 'Coaching, Tuition & Education',     icon = '🎓' WHERE slug = 'education';
UPDATE ms_categories SET name = 'Freelancer & Consultant',           icon = '💼' WHERE slug = 'freelancer';
UPDATE ms_categories SET name = 'Real Estate & Property',            icon = '🏠' WHERE slug = 'real-estate';
UPDATE ms_categories SET name = 'Salon, Parlour & Beauty',           icon = '💇' WHERE slug = 'beauty';
UPDATE ms_categories SET name = 'IT & Tech Services',                icon = '💻' WHERE slug = 'technology';
UPDATE ms_categories SET name = 'Creative, Design & Media',          icon = '🎨' WHERE slug = 'creative';
UPDATE ms_categories SET name = 'Gym, Yoga & Fitness',               icon = '🏋️' WHERE slug = 'fitness';
UPDATE ms_categories SET name = 'Travel, Tours & Pilgrimage',        icon = '✈️' WHERE slug = 'travel';
UPDATE ms_categories SET name = 'Events, Wedding & Entertainment',   icon = '🎉' WHERE slug = 'events';
UPDATE ms_categories SET name = 'CA, Finance & Legal',               icon = '⚖️' WHERE slug = 'finance';
UPDATE ms_categories SET name = 'NGO & Non-profit',                  icon = '❤️' WHERE slug = 'nonprofit';

-- ------------------------------------------------------------
-- 2. ADD NEW INDIA-SPECIFIC CATEGORIES
-- ------------------------------------------------------------

INSERT IGNORE INTO ms_categories (name, slug, icon, sort_order) VALUES
  ('Home Services & Repair',      'home-services',   '🔧', 17),
  ('Automobile & Garage',         'automobile',      '🚗', 18),
  ('Astrology & Spiritual',       'astrology',       '🔮', 19),
  ('Job Placement & Recruitment', 'recruitment',     '👔', 20),
  ('Pharmacy & Chemist',          'pharmacy',        '💊', 21),
  ('Transport & Packers Movers',  'transport',       '🚛', 22),
  ('Tailor & Boutique',           'tailor',          '🧵', 23),
  ('Jewellery & Goldsmith',       'jewellery',       '💍', 24),
  ('Electronics & Mobile Repair', 'electronics',     '📱', 25),
  ('Wedding & Bridal Services',   'wedding',         '💒', 26),
  ('Pet Care & Veterinary',       'pet-care',        '🐾', 27),
  ('Interior Design',             'interior-design', '🛋️', 28),
  ('Printing & Stationery',       'printing',        '🖨️', 29),
  ('Agriculture & Farm Supply',   'agriculture',     '🌾', 30),
  ('Marriage Bureau',             'marriage-bureau', '💑', 31),
  ('Security & Surveillance',     'security',        '🔒', 32);

-- ------------------------------------------------------------
-- 3. ms_category_aliases TABLE
-- Each alias generates its own SEO landing page per city
-- page_title / meta_desc use {city} as a dynamic placeholder
-- search_vol = approx monthly India searches (for ordering)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ms_category_aliases (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  category_id INT UNSIGNED     NOT NULL,
  keyword     VARCHAR(150)     NOT NULL,
  slug        VARCHAR(150)     NOT NULL UNIQUE,
  page_title  VARCHAR(200)     NOT NULL,
  meta_desc   VARCHAR(300)     DEFAULT NULL,
  h1          VARCHAR(200)     NOT NULL,
  search_vol  INT UNSIGNED     NOT NULL DEFAULT 0,
  status      TINYINT(1)       NOT NULL DEFAULT 1,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  KEY idx_slug (slug),
  CONSTRAINT fk_alias_category FOREIGN KEY (category_id)
    REFERENCES ms_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. SEED ALIASES
-- Format: (category_slug lookup via subquery, keyword, slug,
--           page_title, meta_desc, h1, search_vol)
-- ------------------------------------------------------------

-- ── Restaurant & Food ────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Restaurant',         'restaurant',          'Restaurants in {city} | Pagezaper',          'Find the best restaurants in {city}. View menus, timings & contact details.',              'Restaurants in {city}',          25000000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Tiffin Service',     'tiffin-service',      'Tiffin Service in {city} | Pagezaper',        'Find home-cooked tiffin services near you in {city}. Veg, Jain & non-veg options.',      'Tiffin Services in {city}',      4000000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Cloud Kitchen',      'cloud-kitchen',       'Cloud Kitchens in {city} | Pagezaper',        'Order from the best cloud kitchens in {city}. Fast delivery, home-cooked taste.',        'Cloud Kitchens in {city}',       2000000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Dhaba',              'dhaba',               'Dhabas in {city} | Pagezaper',               'Best dhabas in {city} for authentic North Indian food. Check timings & directions.',     'Dhabas in {city}',               3000000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Catering Service',   'catering-service',    'Catering Services in {city} | Pagezaper',    'Hire catering services in {city} for weddings, parties & corporate events.',            'Catering Services in {city}',    2500000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Bakery',             'bakery',              'Bakeries in {city} | Pagezaper',             'Find bakeries in {city} for cakes, bread, pastries & custom orders.',                   'Bakeries in {city}',             1500000),
((SELECT id FROM ms_categories WHERE slug='restaurant'), 'Sweet Shop',         'sweet-shop',          'Sweet Shops in {city} | Pagezaper',          'Best mithai & sweet shops in {city}. Festival sweets, dry fruit boxes & more.',         'Sweet Shops in {city}',          1200000);

-- ── Salon, Parlour & Beauty ──────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Beauty Parlour',     'beauty-parlour',      'Beauty Parlours in {city} | Pagezaper',      'Find top beauty parlours in {city}. Services, prices & reviews.',                       'Beauty Parlours in {city}',      5000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Salon',              'salon',               'Salons in {city} | Pagezaper',               'Best hair & beauty salons in {city}. Book appointments, view prices.',                  'Salons in {city}',               5000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Hair Salon',         'hair-salon',          'Hair Salons in {city} | Pagezaper',          'Top hair salons in {city} for haircuts, colour, straightening & more.',                 'Hair Salons in {city}',          3000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Mehndi Artist',      'mehndi-artist',       'Mehndi Artists in {city} | Pagezaper',       'Book bridal & party mehndi artists in {city}. Rajasthani, Arabic & Indo-Arabic designs.','Mehndi Artists in {city}',       4000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Bridal Makeup',      'bridal-makeup',       'Bridal Makeup Artists in {city} | Pagezaper','Find the best bridal makeup artists in {city} for weddings & engagements.',             'Bridal Makeup Artists in {city}',3500000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Spa',                'spa',                 'Spas in {city} | Pagezaper',                'Relaxing spas in {city} for massage, body wraps & wellness treatments.',                'Spas in {city}',                 2000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Unisex Salon',       'unisex-salon',        'Unisex Salons in {city} | Pagezaper',        'Best unisex salons in {city} offering hair, skin & beauty services for all.',           'Unisex Salons in {city}',        2000000),
((SELECT id FROM ms_categories WHERE slug='beauty'), 'Nail Studio',        'nail-studio',         'Nail Studios in {city} | Pagezaper',         'Find nail art studios in {city} for extensions, gel nails & nail art.',                 'Nail Studios in {city}',         800000);

-- ── Clinic, Hospital & Diagnostic ────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Doctor',             'doctor',              'Doctors in {city} | Pagezaper',              'Find verified doctors in {city}. View specializations, timings & fees.',                'Doctors in {city}',              8000000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Clinic',             'clinic',              'Clinics in {city} | Pagezaper',              'Find clinics near you in {city}. OPD timings, consultation fees & contact.',            'Clinics in {city}',              6000000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Diagnostic Centre',  'diagnostic-centre',   'Diagnostic Centres in {city} | Pagezaper',   'Blood tests, X-ray, MRI & lab tests in {city}. Check rates & book appointments.',      'Diagnostic Centres in {city}',   3000000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Dentist',            'dentist',             'Dentists in {city} | Pagezaper',             'Best dentists in {city} for teeth cleaning, braces, root canal & implants.',           'Dentists in {city}',             4000000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Skin Doctor',        'skin-doctor',         'Skin Doctors in {city} | Pagezaper',         'Find dermatologists & skin doctors in {city}. Acne, pigmentation & hair fall.',        'Skin Doctors in {city}',         2500000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Physiotherapist',    'physiotherapist',     'Physiotherapists in {city} | Pagezaper',     'Book physiotherapy sessions in {city} for back pain, sports injuries & recovery.',     'Physiotherapists in {city}',     1500000),
((SELECT id FROM ms_categories WHERE slug='healthcare'), 'Eye Hospital',       'eye-hospital',        'Eye Hospitals in {city} | Pagezaper',        'Find eye hospitals & opticians in {city} for glasses, LASIK & eye checkups.',          'Eye Hospitals in {city}',        2000000);

-- ── Coaching, Tuition & Education ────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='education'), 'Coaching Classes',  'coaching-classes',    'Coaching Classes in {city} | Pagezaper',     'Find coaching centres in {city} for JEE, NEET, UPSC, SSC & more.',                    'Coaching Classes in {city}',     4000000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Tuition Classes',   'tuition-classes',     'Tuition Classes in {city} | Pagezaper',      'Best home tutors & tuition centres in {city} for school & college students.',          'Tuition Classes in {city}',      3000000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Home Tutor',        'home-tutor',          'Home Tutors in {city} | Pagezaper',          'Find home tutors in {city} for all subjects & boards — CBSE, ICSE, State Board.',     'Home Tutors in {city}',          2500000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Computer Classes',  'computer-classes',    'Computer Classes in {city} | Pagezaper',     'Join computer training institutes in {city} for MS Office, Tally, coding & more.',    'Computer Classes in {city}',     2000000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Spoken English',    'spoken-english',      'Spoken English Classes in {city} | Pagezaper','Improve your English speaking skills. Find spoken English classes in {city}.',         'Spoken English Classes in {city}',1500000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Dance Classes',     'dance-classes',       'Dance Classes in {city} | Pagezaper',        'Join Bollywood, classical, hip-hop & Zumba dance classes in {city}.',                  'Dance Classes in {city}',        1500000),
((SELECT id FROM ms_categories WHERE slug='education'), 'Music Classes',     'music-classes',       'Music Classes in {city} | Pagezaper',        'Learn guitar, keyboard, vocals & tabla from top music teachers in {city}.',            'Music Classes in {city}',        1200000);

-- ── Gym, Yoga & Fitness ──────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Gym',                 'gym',                 'Gyms in {city} | Pagezaper',                'Find gyms near you in {city}. Monthly fees, timings & trainer details.',                'Gyms in {city}',                 6000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Yoga Classes',       'yoga-classes',        'Yoga Classes in {city} | Pagezaper',         'Join yoga classes in {city} for morning & evening batches. All levels welcome.',       'Yoga Classes in {city}',         3000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Fitness Centre',     'fitness-centre',      'Fitness Centres in {city} | Pagezaper',      'Best fitness centres in {city} with modern equipment & certified trainers.',           'Fitness Centres in {city}',      2000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Zumba Classes',      'zumba-classes',       'Zumba Classes in {city} | Pagezaper',        'Fun Zumba dance fitness classes in {city}. Lose weight while you dance.',              'Zumba Classes in {city}',        1000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Martial Arts',       'martial-arts',        'Martial Arts Classes in {city} | Pagezaper', 'Find karate, taekwondo, judo & boxing classes in {city} for kids & adults.',          'Martial Arts Classes in {city}', 800000);

-- ── Home Services & Repair ───────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Plumber',           'plumber',             'Plumbers in {city} | Pagezaper',             'Find verified plumbers in {city} for pipe fitting, leakage & bathroom repair.',        'Plumbers in {city}',             5000000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Electrician',       'electrician',         'Electricians in {city} | Pagezaper',         'Hire certified electricians in {city} for wiring, MCB & appliance installation.',     'Electricians in {city}',         4500000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Carpenter',         'carpenter',           'Carpenters in {city} | Pagezaper',           'Find carpenters in {city} for furniture making, repair & home woodwork.',              'Carpenters in {city}',           2500000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Pest Control',      'pest-control',        'Pest Control in {city} | Pagezaper',         'Best pest control services in {city} for cockroaches, termites & rodents.',           'Pest Control Services in {city}',2000000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'AC Repair',         'ac-repair',           'AC Repair in {city} | Pagezaper',            'AC servicing, gas refilling & repair in {city}. All brands supported.',               'AC Repair Services in {city}',   3000000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'House Cleaning',    'house-cleaning',      'House Cleaning Services in {city} | Pagezaper','Professional home cleaning & deep cleaning services in {city}. Book now.',           'House Cleaning in {city}',       1500000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Painter',           'painter',             'Painters in {city} | Pagezaper',             'Wall & home painters in {city} for interior & exterior painting services.',            'Painters in {city}',             2000000),
((SELECT id FROM ms_categories WHERE slug='home-services'), 'Inverter Repair',   'inverter-repair',     'Inverter Repair in {city} | Pagezaper',      'Find inverter & battery repair services in {city}. All brands & models.',             'Inverter Repair in {city}',      1000000);

-- ── Automobile & Garage ──────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='automobile'), 'Car Service Centre', 'car-service',         'Car Service Centres in {city} | Pagezaper',  'Find car service centres in {city} for servicing, repairs & denting-painting.',       'Car Service Centres in {city}',  5000000),
((SELECT id FROM ms_categories WHERE slug='automobile'), 'Bike Repair',        'bike-repair',         'Bike Repair Shops in {city} | Pagezaper',    'Find bike mechanics in {city} for servicing, puncture & engine repair.',              'Bike Repair in {city}',          4000000),
((SELECT id FROM ms_categories WHERE slug='automobile'), 'Tyre Shop',          'tyre-shop',           'Tyre Shops in {city} | Pagezaper',           'Buy & fit car & bike tyres in {city}. All brands, competitive prices.',                'Tyre Shops in {city}',           2500000),
((SELECT id FROM ms_categories WHERE slug='automobile'), 'Car Wash',           'car-wash',            'Car Wash in {city} | Pagezaper',             'Find car washing & detailing centres in {city}. Interior & exterior cleaning.',       'Car Wash in {city}',             2000000),
((SELECT id FROM ms_categories WHERE slug='automobile'), 'Denting Painting',   'denting-painting',    'Denting & Painting in {city} | Pagezaper',   'Car denting, painting & body repair shops in {city}. Scratch & accident repair.',     'Denting & Painting in {city}',   1500000);

-- ── CA, Finance & Legal ──────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='finance'), 'Chartered Accountant', 'chartered-accountant','Chartered Accountants in {city} | Pagezaper','Find CAs in {city} for GST, income tax, audit & company registration.',               'Chartered Accountants in {city}',5000000),
((SELECT id FROM ms_categories WHERE slug='finance'), 'Tax Consultant',     'tax-consultant',      'Tax Consultants in {city} | Pagezaper',      'Income tax return filing & tax planning consultants in {city}.',                      'Tax Consultants in {city}',      3000000),
((SELECT id FROM ms_categories WHERE slug='finance'), 'GST Consultant',     'gst-consultant',      'GST Consultants in {city} | Pagezaper',      'GST registration, filing & compliance consultants in {city}.',                        'GST Consultants in {city}',      2500000),
((SELECT id FROM ms_categories WHERE slug='finance'), 'Lawyer',             'lawyer',              'Lawyers in {city} | Pagezaper',              'Find experienced lawyers in {city} for civil, criminal, family & property law.',      'Lawyers in {city}',              4000000),
((SELECT id FROM ms_categories WHERE slug='finance'), 'Insurance Agent',    'insurance-agent',     'Insurance Agents in {city} | Pagezaper',     'Compare & buy life, health & vehicle insurance with top agents in {city}.',            'Insurance Agents in {city}',     2000000);

-- ── Events, Wedding & Entertainment ──────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='events'), 'Event Planner',      'event-planner',       'Event Planners in {city} | Pagezaper',       'Book top event planners in {city} for weddings, birthdays & corporate events.',       'Event Planners in {city}',       3000000),
((SELECT id FROM ms_categories WHERE slug='events'), 'Wedding Planner',    'wedding-planner',     'Wedding Planners in {city} | Pagezaper',     'Find wedding planners in {city} for full wedding management & decor.',                 'Wedding Planners in {city}',     4000000),
((SELECT id FROM ms_categories WHERE slug='events'), 'Photographer',       'photographer',        'Photographers in {city} | Pagezaper',        'Find wedding, portrait & event photographers in {city}.',                             'Photographers in {city}',        5000000),
((SELECT id FROM ms_categories WHERE slug='events'), 'Videographer',       'videographer',        'Videographers in {city} | Pagezaper',        'Hire wedding & event videographers in {city} for cinematic videos & reels.',           'Videographers in {city}',        2000000),
((SELECT id FROM ms_categories WHERE slug='events'), 'Tent House',         'tent-house',          'Tent House in {city} | Pagezaper',           'Tent & decoration rental for weddings & events in {city}.',                           'Tent Houses in {city}',          1500000),
((SELECT id FROM ms_categories WHERE slug='events'), 'DJ Service',         'dj-service',          'DJ Services in {city} | Pagezaper',          'Book professional DJs in {city} for weddings, parties & corporate events.',            'DJ Services in {city}',          1500000);

-- ── Astrology & Spiritual ────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='astrology'), 'Astrologer',        'astrologer',          'Astrologers in {city} | Pagezaper',          'Find experienced astrologers in {city} for kundali, horoscope & predictions.',        'Astrologers in {city}',          4000000),
((SELECT id FROM ms_categories WHERE slug='astrology'), 'Pandit',            'pandit',              'Pandits in {city} | Pagezaper',              'Book pandits in {city} for puja, havan, marriage rituals & religious ceremonies.',    'Pandits in {city}',              3500000),
((SELECT id FROM ms_categories WHERE slug='astrology'), 'Vastu Consultant',  'vastu-consultant',    'Vastu Consultants in {city} | Pagezaper',    'Find vastu shastra experts in {city} for home & office consultations.',               'Vastu Consultants in {city}',    1500000),
((SELECT id FROM ms_categories WHERE slug='astrology'), 'Tarot Reader',      'tarot-reader',        'Tarot Readers in {city} | Pagezaper',        'Book tarot card reading sessions in {city} for career, love & life guidance.',        'Tarot Readers in {city}',        800000),
((SELECT id FROM ms_categories WHERE slug='astrology'), 'Numerologist',      'numerologist',        'Numerologists in {city} | Pagezaper',        'Find expert numerologists in {city} for name correction & lucky number analysis.',    'Numerologists in {city}',        600000);

-- ── Job Placement & Recruitment ──────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='recruitment'), 'Placement Agency',  'placement-agency',    'Placement Agencies in {city} | Pagezaper',   'Find top placement & recruitment agencies in {city} for jobs across industries.',     'Placement Agencies in {city}',   3000000),
((SELECT id FROM ms_categories WHERE slug='recruitment'), 'HR Consultancy',    'hr-consultancy',      'HR Consultancies in {city} | Pagezaper',     'Connect with HR consultancies in {city} for hiring & staffing solutions.',            'HR Consultancies in {city}',     2000000),
((SELECT id FROM ms_categories WHERE slug='recruitment'), 'Manpower Agency',   'manpower-agency',     'Manpower Agencies in {city} | Pagezaper',    'Find manpower & staffing agencies in {city} for blue-collar & contractual hiring.',   'Manpower Agencies in {city}',    1500000);

-- ── Real Estate & Property ───────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='real-estate'), 'Real Estate Agent',  'real-estate-agent',  'Real Estate Agents in {city} | Pagezaper',  'Find real estate agents in {city} for buying, selling & renting property.',           'Real Estate Agents in {city}',   5000000),
((SELECT id FROM ms_categories WHERE slug='real-estate'), 'Property Dealer',    'property-dealer',    'Property Dealers in {city} | Pagezaper',    'Connect with property dealers in {city} for flats, plots, villas & commercial.',     'Property Dealers in {city}',     4000000),
((SELECT id FROM ms_categories WHERE slug='real-estate'), 'PG',                 'pg',                 'PG in {city} | Pagezaper',                  'Find PG accommodations in {city} for boys, girls & working professionals.',            'PG in {city}',                   5000000),
((SELECT id FROM ms_categories WHERE slug='real-estate'), 'Flat for Rent',      'flat-for-rent',      'Flats for Rent in {city} | Pagezaper',      'Find 1BHK, 2BHK & 3BHK flats for rent in {city}. Direct owner listings.',           'Flats for Rent in {city}',       6000000);

-- ── Travel, Tours & Pilgrimage ───────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='travel'), 'Travel Agent',       'travel-agent',        'Travel Agents in {city} | Pagezaper',        'Find travel agents in {city} for holiday packages, flights & hotel bookings.',        'Travel Agents in {city}',        3000000),
((SELECT id FROM ms_categories WHERE slug='travel'), 'Tour Operator',      'tour-operator',       'Tour Operators in {city} | Pagezaper',       'Best tour operators in {city} for domestic & international tour packages.',           'Tour Operators in {city}',       2500000),
((SELECT id FROM ms_categories WHERE slug='travel'), 'Pilgrimage Tour',    'pilgrimage-tour',     'Pilgrimage Tours from {city} | Pagezaper',   'Book Char Dham, Tirupati, Shirdi, Vaishno Devi & Hajj pilgrimage tours from {city}.', 'Pilgrimage Tours from {city}',   2000000);

-- ── Electronics & Mobile Repair ──────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='electronics'), 'Mobile Repair',     'mobile-repair',       'Mobile Repair Shops in {city} | Pagezaper',  'Find mobile phone repair shops in {city} for screen, battery & water damage.',       'Mobile Repair in {city}',        5000000),
((SELECT id FROM ms_categories WHERE slug='electronics'), 'Laptop Repair',     'laptop-repair',       'Laptop Repair in {city} | Pagezaper',        'Laptop & computer repair centres in {city}. Screen, keyboard & motherboard issues.',  'Laptop Repair in {city}',        4000000),
((SELECT id FROM ms_categories WHERE slug='electronics'), 'CCTV Installation', 'cctv-installation',   'CCTV Installation in {city} | Pagezaper',    'CCTV camera installation & setup services in {city} for homes & offices.',            'CCTV Installation in {city}',    2000000),
((SELECT id FROM ms_categories WHERE slug='electronics'), 'TV Repair',         'tv-repair',           'TV Repair in {city} | Pagezaper',            'LED & LCD TV repair services in {city}. All brands, doorstep service available.',     'TV Repair in {city}',            1500000);

-- ── Tailor & Boutique ────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='tailor'), 'Tailor',             'tailor',              'Tailors in {city} | Pagezaper',              'Find tailors in {city} for stitching, alterations & custom clothing.',                'Tailors in {city}',              4000000),
((SELECT id FROM ms_categories WHERE slug='tailor'), 'Boutique',           'boutique',            'Boutiques in {city} | Pagezaper',            'Shop designer & custom boutiques in {city} for sarees, lehengas & kurtas.',           'Boutiques in {city}',            3000000),
((SELECT id FROM ms_categories WHERE slug='tailor'), 'Embroidery Work',    'embroidery',          'Embroidery Work in {city} | Pagezaper',      'Zardosi, thread & machine embroidery work in {city} for suits & sarees.',             'Embroidery Work in {city}',      800000);

-- ── Transport & Packers Movers ───────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='transport'), 'Packers and Movers', 'packers-and-movers', 'Packers and Movers in {city} | Pagezaper',  'Reliable packers & movers in {city} for home & office relocation. Get quotes.',      'Packers and Movers in {city}',   6000000),
((SELECT id FROM ms_categories WHERE slug='transport'), 'Tempo Service',     'tempo-service',       'Tempo Service in {city} | Pagezaper',        'Hire tempos & mini trucks in {city} for shifting furniture & goods transport.',       'Tempo Service in {city}',        2000000),
((SELECT id FROM ms_categories WHERE slug='transport'), 'Courier Service',   'courier-service',     'Courier Services in {city} | Pagezaper',     'Fast & reliable courier services in {city} for local & national delivery.',           'Courier Services in {city}',     2500000);

-- ── Printing & Stationery ────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='printing'), 'Visiting Card',      'visiting-card',       'Visiting Card Printing in {city} | Pagezaper','Get visiting cards & business cards printed in {city}. Same-day delivery available.','Visiting Card Printing in {city}',2000000),
((SELECT id FROM ms_categories WHERE slug='printing'), 'Banner Printing',    'banner-printing',     'Banner Printing in {city} | Pagezaper',      'Flex, vinyl & digital banner printing in {city} for shops, events & hoardings.',     'Banner Printing in {city}',      1500000),
((SELECT id FROM ms_categories WHERE slug='printing'), 'T-Shirt Printing',   't-shirt-printing',    'T-Shirt Printing in {city} | Pagezaper',     'Custom t-shirt & uniform printing in {city} for events, teams & corporates.',        'T-Shirt Printing in {city}',     1500000);

-- ── Wedding & Bridal Services ────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='wedding'), 'Wedding Decorator',  'wedding-decorator',   'Wedding Decorators in {city} | Pagezaper',   'Find wedding decorators in {city} for mandap, stage, floral & theme decor.',         'Wedding Decorators in {city}',   3000000),
((SELECT id FROM ms_categories WHERE slug='wedding'), 'Bridal Wear',        'bridal-wear',         'Bridal Wear in {city} | Pagezaper',          'Shop bridal lehengas, sarees & gowns in {city}. Designer & rental options.',         'Bridal Wear in {city}',          2500000),
((SELECT id FROM ms_categories WHERE slug='wedding'), 'Wedding Caterer',    'wedding-caterer',     'Wedding Caterers in {city} | Pagezaper',     'Find wedding caterers in {city} for veg, non-veg & Jain food service.',              'Wedding Caterers in {city}',     2000000),
((SELECT id FROM ms_categories WHERE slug='wedding'), 'Marriage Hall',      'marriage-hall',       'Marriage Halls in {city} | Pagezaper',       'Book marriage halls & banquet halls in {city} for weddings & receptions.',            'Marriage Halls in {city}',       3500000);

-- ── Pharmacy & Chemist ───────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='pharmacy'), 'Medical Store',      'medical-store',       'Medical Stores in {city} | Pagezaper',       'Find medical shops & chemists in {city} for medicines, surgical & healthcare items.', 'Medical Stores in {city}',       5000000),
((SELECT id FROM ms_categories WHERE slug='pharmacy'), 'Chemist',            'chemist',             'Chemists in {city} | Pagezaper',             'Find chemist shops in {city} open 24 hours. Medicines, vitamins & supplements.',     'Chemists in {city}',             3000000),
((SELECT id FROM ms_categories WHERE slug='pharmacy'), 'Ayurvedic Store',    'ayurvedic-store',     'Ayurvedic Stores in {city} | Pagezaper',     'Buy Ayurvedic & herbal medicines from trusted stores in {city}.',                    'Ayurvedic Stores in {city}',     1000000);

-- ── Interior Design ──────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='interior-design'), 'Interior Designer', 'interior-designer', 'Interior Designers in {city} | Pagezaper', 'Find top interior designers in {city} for home, office & commercial spaces.',        'Interior Designers in {city}',   3000000),
((SELECT id FROM ms_categories WHERE slug='interior-design'), 'Modular Kitchen',   'modular-kitchen',   'Modular Kitchen in {city} | Pagezaper',    'Get modular kitchen design & installation in {city}. All budgets covered.',           'Modular Kitchens in {city}',     2500000),
((SELECT id FROM ms_categories WHERE slug='interior-design'), 'False Ceiling',     'false-ceiling',     'False Ceiling in {city} | Pagezaper',      'False ceiling & POP design contractors in {city} for homes & offices.',              'False Ceiling Work in {city}',   1500000);

-- ── Marriage Bureau ──────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='marriage-bureau'), 'Marriage Bureau', 'marriage-bureau',   'Marriage Bureaus in {city} | Pagezaper',     'Trusted marriage bureaus & matchmakers in {city} for all communities.',               'Marriage Bureaus in {city}',     2000000),
((SELECT id FROM ms_categories WHERE slug='marriage-bureau'), 'Matchmaker',      'matchmaker',        'Matchmakers in {city} | Pagezaper',          'Find experienced matchmakers in {city} for compatible life partners.',                'Matchmakers in {city}',          1500000);

-- ── IT & Tech Services ───────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='technology'), 'Web Designer',       'web-designer',        'Web Designers in {city} | Pagezaper',        'Find web designers & developers in {city} for websites, apps & e-commerce.',         'Web Designers in {city}',        3000000),
((SELECT id FROM ms_categories WHERE slug='technology'), 'Digital Marketing',  'digital-marketing',   'Digital Marketing Agencies in {city} | Pagezaper','Top digital marketing agencies in {city} for SEO, social media & ads.',          'Digital Marketing Agencies in {city}',2500000),
((SELECT id FROM ms_categories WHERE slug='technology'), 'App Developer',      'app-developer',       'App Developers in {city} | Pagezaper',       'Hire mobile app developers in {city} for Android & iOS apps.',                       'App Developers in {city}',       2000000);

-- ── Jewellery & Goldsmith ────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='jewellery'), 'Jewellery Shop',     'jewellery-shop',      'Jewellery Shops in {city} | Pagezaper',      'Buy gold, silver & diamond jewellery from trusted shops in {city}.',                 'Jewellery Shops in {city}',      4000000),
((SELECT id FROM ms_categories WHERE slug='jewellery'), 'Gold Shop',          'gold-shop',           'Gold Shops in {city} | Pagezaper',           'Buy 22KT & 24KT gold jewellery from verified goldsmiths in {city}.',                 'Gold Shops in {city}',           3000000);

-- ── Pet Care & Veterinary ────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='pet-care'), 'Veterinary Doctor',  'veterinary-doctor',   'Veterinary Doctors in {city} | Pagezaper',   'Find vet doctors in {city} for dog, cat & pet health care.',                         'Veterinary Doctors in {city}',   2000000),
((SELECT id FROM ms_categories WHERE slug='pet-care'), 'Pet Grooming',       'pet-grooming',        'Pet Grooming in {city} | Pagezaper',         'Pet grooming & spa services in {city} for dogs & cats.',                             'Pet Grooming in {city}',         1500000),
((SELECT id FROM ms_categories WHERE slug='pet-care'), 'Pet Shop',           'pet-shop',            'Pet Shops in {city} | Pagezaper',            'Buy pets, food, accessories & medicines from pet shops in {city}.',                  'Pet Shops in {city}',            2500000);

-- ── Creative, Design & Media ─────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='creative'), 'Graphic Designer',   'graphic-designer',    'Graphic Designers in {city} | Pagezaper',    'Hire graphic designers in {city} for logos, brochures & social media creatives.',    'Graphic Designers in {city}',    2000000),
((SELECT id FROM ms_categories WHERE slug='creative'), 'Video Editor',       'video-editor',        'Video Editors in {city} | Pagezaper',        'Find video editors in {city} for wedding films, reels & YouTube content.',            'Video Editors in {city}',        1500000),
((SELECT id FROM ms_categories WHERE slug='creative'), 'Content Writer',     'content-writer',      'Content Writers in {city} | Pagezaper',      'Hire content writers in {city} for blogs, websites & social media copy.',             'Content Writers in {city}',      1200000);

-- ── Security & Surveillance ──────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='security'), 'Security Agency',    'security-agency',     'Security Agencies in {city} | Pagezaper',    'Hire trained security guards from top agencies in {city}.',                          'Security Agencies in {city}',    1500000),
((SELECT id FROM ms_categories WHERE slug='security'), 'Fire Safety',        'fire-safety',         'Fire Safety Services in {city} | Pagezaper', 'Fire extinguisher, alarm & safety equipment suppliers in {city}.',                   'Fire Safety in {city}',          800000);

-- ── Agriculture & Farm Supply ────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='agriculture'), 'Seeds & Fertilizer', 'seeds-fertilizer',  'Seeds & Fertilizer Shops in {city} | Pagezaper','Find agricultural input shops in {city} for seeds, fertilizers & pesticides.',     'Seeds & Fertilizer in {city}',   1500000),
((SELECT id FROM ms_categories WHERE slug='agriculture'), 'Farm Equipment',   'farm-equipment',      'Farm Equipment in {city} | Pagezaper',       'Agricultural machinery & equipment dealers in {city} for tractors, pumps & more.',   'Farm Equipment in {city}',       1000000);

-- ── Freelancer & Consultant ──────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='freelancer'), 'Freelancer',         'freelancer',          'Freelancers in {city} | Pagezaper',          'Hire skilled freelancers in {city} for design, development & writing projects.',     'Freelancers in {city}',          2000000),
((SELECT id FROM ms_categories WHERE slug='freelancer'), 'Management Consultant','management-consultant','Management Consultants in {city} | Pagezaper','Find management & business consultants in {city} for strategy & operations.',      'Management Consultants in {city}',1000000);

-- ── Sports Academy ───────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Cricket Academy', 'cricket-academy',   'Cricket Academies in {city} | Pagezaper',    'Join cricket coaching academies in {city} for kids & adults.',                       'Cricket Academies in {city}',    2000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Football Academy', 'football-academy', 'Football Academies in {city} | Pagezaper',   'Find football coaching centres in {city} for all age groups.',                       'Football Academies in {city}',   1000000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Swimming Pool',   'swimming-pool',     'Swimming Pools in {city} | Pagezaper',       'Find swimming pools & coaching in {city} for kids, adults & competitive swimmers.','Swimming Pools in {city}',       1500000),
((SELECT id FROM ms_categories WHERE slug='fitness'), 'Badminton Court', 'badminton-court',   'Badminton Courts in {city} | Pagezaper',     'Book badminton courts in {city} on an hourly basis. Check availability & rates.',    'Badminton Courts in {city}',     1500000);

-- ── Retail, Kirana & General Store ──────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='retail'), 'Kirana Store',       'kirana-store',        'Kirana Stores in {city} | Pagezaper',        'Find kirana & general stores in {city} for daily groceries & household items.',      'Kirana Stores in {city}',        3000000),
((SELECT id FROM ms_categories WHERE slug='retail'), 'Grocery Store',      'grocery-store',       'Grocery Stores in {city} | Pagezaper',       'Find grocery shops in {city} with home delivery options.',                            'Grocery Stores in {city}',       4000000),
((SELECT id FROM ms_categories WHERE slug='retail'), 'Medical Equipment',  'medical-equipment',   'Medical Equipment in {city} | Pagezaper',    'Buy & rent medical equipment in {city} — wheelchairs, BP monitors, beds & more.',    'Medical Equipment in {city}',    800000);

-- ── NGO & Non-profit ─────────────────────────────────────────
INSERT INTO ms_category_aliases (category_id, keyword, slug, page_title, meta_desc, h1, search_vol) VALUES
((SELECT id FROM ms_categories WHERE slug='nonprofit'), 'NGO',               'ngo',                 'NGOs in {city} | Pagezaper',                 'Find NGOs & non-profit organisations in {city} working for social causes.',           'NGOs in {city}',                 1500000),
((SELECT id FROM ms_categories WHERE slug='nonprofit'), 'Charity',           'charity',             'Charities in {city} | Pagezaper',            'Donate to registered charities & welfare organisations in {city}.',                  'Charities in {city}',            800000);


-- ------------------------------------------------------------
-- 5. ms_tags TABLE
-- Business owners select tags from the dashboard
-- category_id = NULL means the tag applies to all categories
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ms_tags (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  slug        VARCHAR(100)  NOT NULL UNIQUE,
  category_id INT UNSIGNED  DEFAULT NULL,
  icon        VARCHAR(10)   DEFAULT NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  status      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  CONSTRAINT fk_tag_category FOREIGN KEY (category_id)
    REFERENCES ms_categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Universal Tags (category_id = NULL) ─────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('Home Delivery',     'home-delivery',     NULL, '🚚', 1),
  ('Open 24/7',         'open-24-7',         NULL, '🕐', 2),
  ('Open on Sunday',    'open-sunday',       NULL, '📅', 3),
  ('AC',                'ac',                NULL, '❄️', 4),
  ('Free Parking',      'free-parking',      NULL, '🅿️', 5),
  ('Ladies Only',       'ladies-only',       NULL, '👩', 6),
  ('Gents Only',        'gents-only',        NULL, '👨', 7),
  ('Accepts UPI',       'accepts-upi',       NULL, '📲', 8),
  ('Accepts Card',      'accepts-card',      NULL, '💳', 9),
  ('Online Booking',    'online-booking',    NULL, '📆', 10),
  ('Home Visit',        'home-visit',        NULL, '🏠', 11),
  ('WhatsApp Support',  'whatsapp-support',  NULL, '💬', 12),
  ('Free Consultation', 'free-consultation', NULL, '✅', 13),
  ('Verified',          'verified',          NULL, '🏅', 14),
  ('Budget Friendly',   'budget-friendly',   NULL, '💰', 15),
  ('Premium',           'premium',           NULL, '⭐', 16);

-- ── Food-specific Tags ───────────────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('Pure Veg',          'pure-veg',       (SELECT id FROM ms_categories WHERE slug='restaurant'), '🟢', 1),
  ('Jain Food',         'jain-food',      (SELECT id FROM ms_categories WHERE slug='restaurant'), '🕉️', 2),
  ('Non-Veg',           'non-veg',        (SELECT id FROM ms_categories WHERE slug='restaurant'), '🍗', 3),
  ('Egg Only',          'egg-only',       (SELECT id FROM ms_categories WHERE slug='restaurant'), '🥚', 4),
  ('Tiffin Available',  'tiffin',         (SELECT id FROM ms_categories WHERE slug='restaurant'), '🥡', 5),
  ('Outdoor Seating',   'outdoor-seating',(SELECT id FROM ms_categories WHERE slug='restaurant'), '🌳', 6),
  ('Takeaway',          'takeaway',       (SELECT id FROM ms_categories WHERE slug='restaurant'), '📦', 7),
  ('Party Orders',      'party-orders',   (SELECT id FROM ms_categories WHERE slug='restaurant'), '🎉', 8);

-- ── Beauty/Salon-specific Tags ───────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('Bridal Package',    'bridal-package', (SELECT id FROM ms_categories WHERE slug='beauty'), '👰', 1),
  ('Unisex',            'unisex',         (SELECT id FROM ms_categories WHERE slug='beauty'), '🧑', 2),
  ('Organic Products',  'organic',        (SELECT id FROM ms_categories WHERE slug='beauty'), '🌿', 3),
  ('Senior Stylist',    'senior-stylist', (SELECT id FROM ms_categories WHERE slug='beauty'), '🏆', 4);

-- ── Healthcare-specific Tags ─────────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('MBBS / MD',         'mbbs-md',        (SELECT id FROM ms_categories WHERE slug='healthcare'), '🩺', 1),
  ('Cashless Insurance','cashless',        (SELECT id FROM ms_categories WHERE slug='healthcare'), '🏥', 2),
  ('Home Sample',       'home-sample',    (SELECT id FROM ms_categories WHERE slug='healthcare'), '🧪', 3),
  ('Emergency',         'emergency',      (SELECT id FROM ms_categories WHERE slug='healthcare'), '🚨', 4);

-- ── Education-specific Tags ──────────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('CBSE',              'cbse',           (SELECT id FROM ms_categories WHERE slug='education'), '📘', 1),
  ('ICSE',              'icse',           (SELECT id FROM ms_categories WHERE slug='education'), '📗', 2),
  ('Online Classes',    'online-classes', (SELECT id FROM ms_categories WHERE slug='education'), '💻', 3),
  ('Demo Class Free',   'demo-free',      (SELECT id FROM ms_categories WHERE slug='education'), '🆓', 4),
  ('Doubt Sessions',    'doubt-sessions', (SELECT id FROM ms_categories WHERE slug='education'), '❓', 5);

-- ── Automobile-specific Tags ─────────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('All Brands',        'all-brands',     (SELECT id FROM ms_categories WHERE slug='automobile'), '🔧', 1),
  ('Doorstep Pickup',   'doorstep-pickup',(SELECT id FROM ms_categories WHERE slug='automobile'), '🚗', 2),
  ('Genuine Parts',     'genuine-parts',  (SELECT id FROM ms_categories WHERE slug='automobile'), '✅', 3);

-- ── Home Services-specific Tags ──────────────────────────────
INSERT INTO ms_tags (name, slug, category_id, icon, sort_order) VALUES
  ('Same Day Service',  'same-day',       (SELECT id FROM ms_categories WHERE slug='home-services'), '⚡', 1),
  ('Doorstep Service',  'doorstep',       (SELECT id FROM ms_categories WHERE slug='home-services'), '🏠', 2),
  ('Annual Contract',   'annual-contract',(SELECT id FROM ms_categories WHERE slug='home-services'), '📋', 3);


-- ------------------------------------------------------------
-- 6. ms_site_tags JUNCTION TABLE
-- Links sites to their selected tags (many-to-many)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ms_site_tags (
  site_id    INT UNSIGNED NOT NULL,
  tag_id     INT UNSIGNED NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (site_id, tag_id),
  KEY idx_tag (tag_id),
  CONSTRAINT fk_sitetag_tag FOREIGN KEY (tag_id)
    REFERENCES ms_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: FK from site_id to ms_sites(id) not added here because
-- ms_sites may use INT(11) vs INT UNSIGNED — add manually if needed:
-- ALTER TABLE ms_site_tags ADD CONSTRAINT fk_sitetag_site
--   FOREIGN KEY (site_id) REFERENCES ms_sites (id) ON DELETE CASCADE;
