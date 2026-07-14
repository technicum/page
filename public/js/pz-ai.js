/* ── PageZaper AI — Rule-based Bio Writer ────────────────────────────────── */
(function(global){

  /* ── Business type detection ─────────────────────────────────────────── */
  var TYPE_KEYWORDS = {
    doctor:      ['doctor','physician','surgeon','dentist','dermatologist','cardiologist','psychiatrist','gynecologist','pediatrician','orthopedic','neurologist','ophthalmologist','ent','radiologist','anesthesiologist','medical','clinic','healthcare','health'],
    lawyer:      ['lawyer','attorney','advocate','solicitor','barrister','legal','law firm','paralegal','counsel','litigation','notary'],
    salon:       ['salon','beauty','hair','makeup','nail','spa','skincare','esthetician','barber','cosmetologist','waxing','threading','bridal makeup'],
    fitness:     ['fitness','gym','trainer','yoga','pilates','nutrition','dietitian','nutritionist','coach','wellness','crossfit','zumba','aerobics','physiotherapist','physical therapy'],
    restaurant:  ['restaurant','cafe','food','chef','catering','bakery','coffee','tea','bar','hospitality','cuisine','cloud kitchen','tiffin','hotel'],
    realestate:  ['real estate','property','realtor','broker','housing','mortgage','rental','land','plot','apartment','villa','construction'],
    finance:     ['finance','financial','investment','wealth','insurance','ca','chartered accountant','tax','accounting','auditor','ca firm','mutual fund','stock','trading','loan','bank'],
    education:   ['teacher','tutor','coach','trainer','educator','professor','institute','academy','school','college','training','courses','classes','mentor','teaching','education'],
    photographer:['photographer','photography','videographer','videography','cinematographer','studio','film','photo','wedding photography','portrait','product photography'],
    developer:   ['developer','programmer','software','engineer','web design','app developer','ui/ux','designer','coder','full stack','frontend','backend','devops','it consultant','tech'],
    freelancer:  ['freelancer','freelance','consultant','independent','self-employed','solopreneur','remote'],
    ecommerce:   ['shop','store','ecommerce','boutique','brand','seller','reseller','product','retail','fashion','clothing','jewellery','accessories','gifts'],
    consultant:  ['consultant','advisor','strategist','analyst','business coach','management','hr','marketing consultant','pr','public relations','branding'],
  };

  function detectType(profession, keywords) {
    var text = (profession + ' ' + (keywords||'')).toLowerCase();
    var scores = {};
    Object.keys(TYPE_KEYWORDS).forEach(function(type) {
      var kws = TYPE_KEYWORDS[type];
      var score = 0;
      kws.forEach(function(kw) { if(text.includes(kw)) score += kw.split(' ').length; });
      if(score > 0) scores[type] = score;
    });
    var best = Object.keys(scores).sort(function(a,b){ return scores[b]-scores[a]; })[0];
    return best || 'general';
  }

  /* ── Bio templates per type + tone ──────────────────────────────────── */
  var TEMPLATES = {
    doctor: {
      professional: [
        "{name} is a qualified {profession} committed to delivering evidence-based care and exceptional patient outcomes.",
        "With years of clinical expertise, {name} provides compassionate and comprehensive {profession} services.",
        "{name} specializes in {keywords_or_profession}, combining advanced medical knowledge with a patient-first approach."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who genuinely cares about your health and wellbeing. Let's get you feeling your best!",
        "I'm {name}, and I'm here to make healthcare feel less daunting. As a {profession}, I believe in treating the person, not just the condition.",
        "Hey there! I'm {name}, a {profession} passionate about helping patients live healthier, happier lives."
      ],
      bold: [
        "{name}. {profession}. Putting patients first — always.",
        "Trusted. Qualified. Caring. {name} is the {profession} you've been looking for.",
        "Your health deserves the best. {name} delivers world-class {profession} care you can count on."
      ]
    },
    lawyer: {
      professional: [
        "{name} is a seasoned {profession} with a proven track record in {keywords_or_profession}, offering expert legal guidance.",
        "With in-depth knowledge of {keywords_or_profession}, {name} provides strategic legal counsel you can trust.",
        "{name} brings rigorous legal expertise and client-focused advocacy to every case."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who makes legal matters less intimidating. I'm here to fight for you.",
        "Legal challenges can be stressful. I'm {name}, a {profession} who simplifies the process and puts you first.",
        "I'm {name}, a passionate {profession} who believes everyone deserves clear, accessible legal help."
      ],
      bold: [
        "{name}. Sharp legal mind. Real results.",
        "Don't settle. Fight back. {name} is the {profession} in your corner.",
        "Your rights matter. {name} — {profession} who wins."
      ]
    },
    salon: {
      professional: [
        "{name} is a skilled {profession} dedicated to helping clients look and feel their absolute best.",
        "With an eye for beauty and precision, {name} delivers premium {keywords_or_profession} services.",
        "{name} brings artistry and expertise to every appointment, ensuring stunning results every time."
      ],
      friendly: [
        "Hey gorgeous! I'm {name} — a {profession} who loves transforming looks and boosting confidence. Can't wait to work with you!",
        "I'm {name} and I believe beauty is for everyone! As a {profession}, I'm here to make you glow inside and out.",
        "Hi! I'm {name}, your go-to {profession} for all things beauty. Let's create your perfect look together!"
      ],
      bold: [
        "Beauty is my passion. {name} — {profession} who delivers results that turn heads.",
        "From ordinary to extraordinary. {name} is the {profession} who makes it happen.",
        "{name}. Where beauty meets expertise. Book your transformation today."
      ]
    },
    fitness: {
      professional: [
        "{name} is a certified {profession} specialising in {keywords_or_profession}, helping clients achieve their health and fitness goals.",
        "With a science-backed approach, {name} designs personalised {profession} programs for lasting results.",
        "{name} combines expertise in {keywords_or_profession} with motivational coaching to transform lives."
      ],
      friendly: [
        "Hey! I'm {name} — a {profession} who loves helping people feel strong, confident, and healthy. Let's crush your goals together!",
        "I'm {name}, and fitness changed my life — now I want to help change yours! As a {profession}, I make workouts fun and effective.",
        "Hi! I'm {name}, a {profession} passionate about building healthy habits that stick. No gimmicks, just results!"
      ],
      bold: [
        "No excuses. Just results. {name} — your {profession} for real transformation.",
        "Train hard. Live better. {name} is the {profession} who gets you there.",
        "{name}. Certified. Dedicated. Ready to push you to your best."
      ]
    },
    restaurant: {
      professional: [
        "{name} is a passionate {profession} dedicated to crafting memorable dining experiences using the finest ingredients.",
        "With a love for {keywords_or_profession}, {name} brings authentic flavours and culinary artistry to every dish.",
        "{name} is committed to excellence in every bite — from sourcing premium ingredients to perfecting every recipe."
      ],
      friendly: [
        "Hi, I'm {name}! Food is my love language, and as a {profession}, I pour that love into everything I cook.",
        "I'm {name} — a {profession} who believes great food brings people together. Come hungry, leave happy!",
        "Hey there! I'm {name}, your friendly {profession} who's obsessed with making delicious, unforgettable food."
      ],
      bold: [
        "Exceptional food. Every time. {name} — {profession} who raises the bar.",
        "Eat well. Live well. {name} serves up experiences worth coming back for.",
        "{name}. Where passion meets the plate."
      ]
    },
    realestate: {
      professional: [
        "{name} is an experienced {profession} helping clients navigate the property market with confidence and clarity.",
        "With deep market knowledge and a client-first approach, {name} delivers exceptional {keywords_or_profession} services.",
        "{name} is dedicated to helping buyers, sellers, and investors achieve their real estate goals."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who makes buying or selling property feel exciting, not stressful!",
        "I'm {name}, and I love helping people find their dream home. As a {profession}, I'm with you every step of the way.",
        "Hey! I'm {name}, a {profession} who turns property dreams into reality. Let's find your perfect place!"
      ],
      bold: [
        "Dream property. Real results. {name} — {profession} who delivers.",
        "Your next move starts here. {name} — the {profession} who gets deals done.",
        "{name}. Expert. Trusted. Results-driven real estate professional."
      ]
    },
    finance: {
      professional: [
        "{name} is a qualified {profession} specialising in {keywords_or_profession}, providing expert financial guidance.",
        "With a deep understanding of financial markets and regulations, {name} helps clients build and protect their wealth.",
        "{name} offers comprehensive {keywords_or_profession} services designed to secure your financial future."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who makes finance feel less complicated and more empowering!",
        "I'm {name}, and I believe everyone deserves great financial advice. As a {profession}, I'm here to simplify your money journey.",
        "Hey! I'm {name}, your friendly {profession} who helps you make smart financial decisions without the jargon."
      ],
      bold: [
        "Your money. Your future. {name} — {profession} who protects both.",
        "Smart finance starts here. {name} delivers strategies that grow your wealth.",
        "{name}. Trusted. Certified. The {profession} your portfolio deserves."
      ]
    },
    education: {
      professional: [
        "{name} is a dedicated {profession} committed to fostering learning, growth, and academic excellence.",
        "With expertise in {keywords_or_profession}, {name} creates engaging learning experiences that inspire students.",
        "{name} brings passion, knowledge, and innovative teaching methods to every session."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who believes every student has unlimited potential. Let's unlock yours!",
        "I'm {name}, and I love seeing the moment things 'click' for students. As a {profession}, I'm here to make learning fun.",
        "Hey! I'm {name}, a {profession} who's passionate about helping students thrive academically and beyond."
      ],
      bold: [
        "Learn. Grow. Achieve. {name} — the {profession} who makes it happen.",
        "Excellence is taught, not born. {name} — {profession} dedicated to your success.",
        "{name}. Inspiring minds. Changing futures."
      ]
    },
    photographer: {
      professional: [
        "{name} is a talented {profession} specialising in {keywords_or_profession}, capturing life's most precious moments.",
        "With a keen artistic eye and technical expertise, {name} delivers stunning visual stories.",
        "{name} transforms fleeting moments into timeless memories through the art of {keywords_or_profession}."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who lives to capture beautiful, authentic moments. Let's create magic together!",
        "I'm {name}, and I see beauty everywhere I look. As a {profession}, I make sure you see it too.",
        "Hey! I'm {name}, your go-to {profession} for stunning photos that tell your unique story."
      ],
      bold: [
        "Every frame tells a story. {name} — {profession} who tells yours perfectly.",
        "Ordinary moments. Extraordinary photos. {name} — the {profession} behind the lens.",
        "{name}. Vision. Skill. Unforgettable photography."
      ]
    },
    developer: {
      professional: [
        "{name} is a skilled {profession} specialising in {keywords_or_profession}, building robust and scalable digital solutions.",
        "With expertise in {keywords_or_profession}, {name} delivers clean, efficient, and user-focused technology.",
        "{name} combines technical excellence with creative problem-solving to build digital products that perform."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who turns your ideas into real, working digital products. Let's build something great!",
        "I'm {name}, and I love solving problems with code. As a {profession}, I make technology work for you.",
        "Hey! I'm {name}, a {profession} passionate about crafting seamless digital experiences that users love."
      ],
      bold: [
        "Idea to product. Fast. {name} — the {profession} who ships.",
        "Code that works. Designs that convert. {name} — your {profession}.",
        "{name}. Building tomorrow's digital experiences today."
      ]
    },
    consultant: {
      professional: [
        "{name} is an experienced {profession} helping businesses achieve growth through strategic insights and actionable solutions.",
        "With expertise in {keywords_or_profession}, {name} drives measurable results for clients across industries.",
        "{name} combines analytical thinking with industry knowledge to help organisations unlock their full potential."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who loves helping businesses grow and thrive. Let's solve your challenges together!",
        "I'm {name}, and I believe every business has untapped potential. As a {profession}, I help you find and unlock it.",
        "Hey! I'm {name}, a {profession} passionate about turning business challenges into opportunities."
      ],
      bold: [
        "Strategy. Execution. Results. {name} — the {profession} who delivers.",
        "Stop guessing. Start growing. {name} is the {profession} your business needs.",
        "{name}. Bold strategies. Real impact."
      ]
    },
    ecommerce: {
      professional: [
        "{name} curates and delivers premium {keywords_or_profession} products, built on a foundation of quality and customer trust.",
        "With a passion for {keywords_or_profession}, {name} offers an exceptional shopping experience backed by great service.",
        "{name} is dedicated to bringing you carefully selected {keywords_or_profession} at unbeatable value."
      ],
      friendly: [
        "Hi, I'm {name} — and I'm obsessed with great products! Shop my collection of {keywords_or_profession} and find your new favourite.",
        "I'm {name}, and I started this store because I couldn't find products I truly loved. Now I bring them to you!",
        "Hey! I'm {name}, and I hand-pick every {keywords_or_profession} item in my store with care and love."
      ],
      bold: [
        "Great products. Zero compromise. {name} — shop with confidence.",
        "Quality you can feel. Style you can own. Welcome to {name}.",
        "{name}. {keywords_or_profession} done right."
      ]
    },
    freelancer: {
      professional: [
        "{name} is a versatile {profession} delivering high-quality {keywords_or_profession} services with a focus on client satisfaction.",
        "As an independent {profession}, {name} brings flexibility, expertise, and dedication to every project.",
        "{name} specialises in {keywords_or_profession}, working with clients globally to achieve outstanding results."
      ],
      friendly: [
        "Hi, I'm {name} — a freelance {profession} who loves collaborating with great people on exciting projects!",
        "I'm {name}, and I've traded the 9-to-5 for doing what I love every day. Let's work together!",
        "Hey! I'm {name}, a freelance {profession} passionate about delivering great work and building lasting client relationships."
      ],
      bold: [
        "Skills. Hustle. Results. {name} — the freelance {profession} who delivers.",
        "No agency overhead. Just expert work. {name} — your dedicated {profession}.",
        "{name}. Independent. Skilled. Ready to make your project shine."
      ]
    },
    general: {
      professional: [
        "{name} is a dedicated {profession} committed to delivering exceptional results and outstanding service.",
        "With expertise in {keywords_or_profession}, {name} brings professionalism and passion to every project.",
        "{name} specialises in {keywords_or_profession}, helping clients achieve their goals with precision and care."
      ],
      friendly: [
        "Hi, I'm {name} — a {profession} who genuinely loves what I do. Let's work together and create something amazing!",
        "I'm {name}, and I'm passionate about {keywords_or_profession}. I'd love to help you with your needs!",
        "Hey there! I'm {name}, a {profession} dedicated to making a real difference for every client I work with."
      ],
      bold: [
        "{name}. {profession}. Exceptional work. Every time.",
        "Results-driven. Client-focused. {name} — the {profession} who goes above and beyond.",
        "Choose excellence. Choose {name} — your trusted {profession}."
      ]
    }
  };

  /* ── Fill a template string ──────────────────────────────────────────── */
  function fill(template, data) {
    return template
      .replace(/\{name\}/g, data.name || 'I')
      .replace(/\{profession\}/g, data.profession || 'professional')
      .replace(/\{keywords_or_profession\}/g, data.keywords || data.profession || 'my field');
  }

  /* ── Main generate function ──────────────────────────────────────────── */
  function generateBios(opts) {
    var name       = (opts.name       || '').trim();
    var profession = (opts.profession || '').trim();
    var keywords   = (opts.keywords   || '').trim();
    var tone       = opts.tone || 'friendly';

    var type = detectType(profession, keywords);
    var typeTemplates = TEMPLATES[type] || TEMPLATES.general;
    var toneTemplates = typeTemplates[tone] || typeTemplates.friendly;

    var data = { name: name, profession: profession, keywords: keywords };

    // Return all 3 variations
    return toneTemplates.map(function(t) { return fill(t, data); });
  }

  global.pzAI = { generateBios: generateBios, detectType: detectType };

})(window);
