/* ════════════════════════════════════════════════════════════════
   Real Estate Theme — Section Definitions
   ════════════════════════════════════════════════════════════════

   Dynamic sections (property_listings, blog_posts):
     Properties / posts load from the database at render time.
     Fields control limit, category filter, and sort order —
     NOT individual items. The canvas shows sample placeholder cards.

   Static sections (property_search, property_detail, agents):
     Content is entered directly via the fields editor.

   ms_products → properties (and all other product types)
   ms_posts    → blog posts, pages

   ════════════════════════════════════════════════════════════════ */

registerThemeSections({

  /* ── Property Search Hero ──────────────────────────────────── */
  property_search: {
    cat: { label: 'Property Search', icon: '🔍', sub: 'Search hero with filters', bg: '#dbeafe' },

    fields: [
      { key: 'headline', label: 'Headline',           ph: 'Find Your Dream Home' },
      { key: 'subtext',  label: 'Subtext',            ph: 'Thousands of verified properties across top cities.' },
      { key: 'stats',    type: 'items', label: 'Stats (optional)',
        cols: ['num', 'label'], colLabels: ['Number / Value', 'Label'] }
    ],

    render(d, esc) {
      const stats = d.stats || [
        { num: '2,500+', label: 'Properties' },
        { num: '850+',   label: 'Families Served' },
        { num: '12+',    label: 'Years' }
      ];
      return `
        <div class="re-hero" style="background:#0f4c81;min-height:580px;
          display:flex;flex-direction:column;align-items:center;
          justify-content:center;padding:88px 80px;text-align:center;">
          <h1 style="font-size:clamp(32px,5.5vw,64px);font-weight:800;
            color:#fff;line-height:1.08;margin-bottom:14px;letter-spacing:-1px;">
            ${esc(d.headline || 'Find Your Dream Home')}
          </h1>
          <p style="font-size:17px;color:rgba(255,255,255,0.72);margin-bottom:44px;">
            ${esc(d.subtext || 'Thousands of verified properties across top cities.')}
          </p>
          <div class="re-search-bar" style="background:#fff;border-radius:14px;
            padding:18px 22px;display:flex;gap:10px;width:100%;max-width:860px;
            box-shadow:0 20px 60px rgba(0,0,0,0.22);">
            <div style="flex:1.5;border:1.5px solid #e2e8f0;border-radius:10px;
              height:52px;display:flex;align-items:center;padding:0 16px;
              font-size:14px;color:#9ca3af;">📍 City or Area</div>
            <div style="flex:1;border:1.5px solid #e2e8f0;border-radius:10px;
              height:52px;display:flex;align-items:center;padding:0 16px;
              font-size:14px;color:#9ca3af;">🏠 Property Type</div>
            <div style="flex:1;border:1.5px solid #e2e8f0;border-radius:10px;
              height:52px;display:flex;align-items:center;padding:0 16px;
              font-size:14px;color:#9ca3af;">💰 Budget</div>
            <button class="re-search-btn" style="background:#0f4c81;color:#fff;
              border:none;border-radius:10px;height:52px;padding:0 32px;
              font-size:15px;font-weight:700;cursor:pointer;white-space:nowrap;">
              Search Properties
            </button>
          </div>
          ${stats.length ? `
            <div style="display:flex;gap:56px;margin-top:56px;">
              ${stats.slice(0, 3).map(s => `
                <div style="text-align:center;">
                  <div style="font-size:38px;font-weight:800;color:#fff;">
                    ${esc(s.num || '')}
                  </div>
                  <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">
                    ${esc(s.label || '')}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  },

  /* ── Property Listings Grid — DYNAMIC (ms_products) ───────── */
  property_listings: {
    cat: { label: 'Property Grid', icon: '🏠', sub: 'Dynamic properties from ms_products', bg: '#e0f2fe' },

    /*
     * Properties load dynamically from ms_products at page render time.
     * Fields control HOW they load, not what they contain.
     */
    fields: [
      { key: 'heading',    label: 'Heading',    ph: 'Featured Properties' },
      { key: 'subheading', label: 'Subheading', ph: 'Hand-picked by our agents' },
      { key: 'category',   label: 'Category filter (slug, optional)',
        ph: 'apartment — leave blank to show all' },
      { key: 'limit', type: 'select', label: 'Number of properties to show',
        default: '6',
        options: { '3':'3', '6':'6', '9':'9', '12':'12' } },
      { key: 'sort_by', type: 'select', label: 'Sort by',
        default: 'newest',
        options: { 'newest':'Newest first', 'price_asc':'Price: low to high',
                   'price_desc':'Price: high to low', 'featured':'Featured first' } }
    ],

    render(d, esc) {
      const sampleProps = [
        { icon:'🏠', title:'3 BHK Apartment', location:'City, Area', price:'₹1.8 Cr', beds:3, baths:2, sqft:1450, tag:'For Sale' },
        { icon:'🏡', title:'4 BHK Villa',      location:'City, Area', price:'₹2.4 Cr', beds:4, baths:3, sqft:2800, tag:'Featured' },
        { icon:'🏢', title:'2 BHK Flat',       location:'City, Area', price:'₹85 L',   beds:2, baths:2, sqft:980,  tag:'For Rent' }
      ];
      const limit = parseInt(d.limit || '6', 10);

      return `
        <div class="section section-alt">
          <div class="container">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;
              margin-bottom:48px;flex-wrap:wrap;gap:12px;">
              <div>
                <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#0f172a;
                  margin-bottom:8px;">
                  ${esc(d.heading || 'Featured Properties')}
                </h2>
                ${d.subheading ? `<p style="color:#64748b;">${esc(d.subheading)}</p>` : ''}
              </div>
              <div style="background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:700;
                padding:6px 14px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;
                border:1.5px solid #bfdbfe;">
                ⚡ Dynamic · loads ${limit} from ms_products
                ${d.category ? ` · category: ${esc(d.category)}` : ''}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;">
              ${sampleProps.map(p => {
                const tagColor = p.tag === 'Featured' ? '#f59e0b' : '#0f4c81';
                return `
                  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#0f4c81,#2563eb);
                      height:200px;display:flex;align-items:center;
                      justify-content:center;position:relative;">
                      <div style="font-size:80px;opacity:0.18;">${esc(p.icon)}</div>
                      <div style="position:absolute;top:14px;left:14px;
                        background:${tagColor};color:#fff;font-size:11px;font-weight:700;
                        padding:4px 12px;border-radius:20px;">${esc(p.tag)}</div>
                      <button style="position:absolute;bottom:14px;right:14px;
                        background:rgba(255,255,255,0.15);border:none;border-radius:50%;
                        width:34px;height:34px;color:#fff;font-size:18px;cursor:pointer;">♡</button>
                    </div>
                    <div style="padding:20px;">
                      <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:6px;">
                        ${esc(p.title)}
                      </div>
                      <div style="font-size:13px;color:#64748b;margin-bottom:14px;">
                        📍 ${esc(p.location)}
                      </div>
                      <div style="display:flex;gap:16px;font-size:12px;color:#64748b;
                        margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f1f5f9;">
                        <span>🛏 ${p.beds} Beds</span>
                        <span>🚿 ${p.baths} Baths</span>
                        <span>📐 ${p.sqft}</span>
                      </div>
                      <div style="font-size:22px;font-weight:800;color:#0f4c81;">
                        ${esc(p.price)}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Property Detail Page ──────────────────────────────────── */
  property_detail: {
    cat: { label: 'Property Detail', icon: '🏡', sub: 'Single property detail page', bg: '#dcfce7' },

    fields: [
      { key: 'title',    label: 'Property Title', ph: '4 BHK Luxury Villa' },
      { key: 'location', label: 'Location',       ph: 'City, Area' },
      { key: 'price',    label: 'Price',          ph: '₹2.8 Cr' },
      { key: 'tag',      label: 'Tag',            ph: 'For Sale' },
      { key: 'icon',     label: 'Icon (emoji)',   ph: '🏠' },
      { key: 'beds',     label: 'Bedrooms',       ph: '4' },
      { key: 'baths',    label: 'Bathrooms',      ph: '3' },
      { key: 'sqft',     label: 'Area (sqft)',    ph: '2800' },
      { key: 'parking',  label: 'Parking spots',  ph: '2' },
      { key: 'desc',     type: 'textarea', label: 'Description' },
      { key: 'features', type: 'items', label: 'Features',
        cols: ['text'], colLabels: ['Feature (e.g. Swimming Pool)'] }
    ],

    render(d, esc) {
      const features = (d.features || [
        'Swimming Pool', 'Club House', 'Power Backup',
        '24/7 Security', 'Landscaped Garden', 'Children Play Area'
      ]).slice(0, 6);

      return `
        <div class="section">
          <div class="container">
            <div style="display:grid;grid-template-columns:1.3fr 0.7fr;gap:48px;align-items:start;">
              <div>
                <div style="background:linear-gradient(135deg,#0f4c81,#2563eb);
                  border-radius:20px;height:360px;display:flex;align-items:center;
                  justify-content:center;position:relative;margin-bottom:16px;">
                  <div style="font-size:120px;opacity:0.18;">${esc(d.icon || '🏠')}</div>
                  ${d.tag ? `
                    <div style="position:absolute;top:20px;left:20px;background:#0f4c81;
                      color:#fff;font-size:12px;font-weight:700;padding:6px 16px;
                      border-radius:20px;">${esc(d.tag)}</div>
                  ` : ''}
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                  ${[0,1,2,3].map(() =>
                    `<div style="background:#dbeafe;border-radius:10px;height:72px;"></div>`
                  ).join('')}
                </div>
              </div>
              <div>
                <h2 style="font-size:clamp(22px,3vw,32px);font-weight:800;color:#0f172a;
                  margin-bottom:8px;line-height:1.2;">
                  ${esc(d.title || '4 BHK Luxury Villa')}
                </h2>
                <div style="font-size:14px;color:#64748b;margin-bottom:16px;">
                  📍 ${esc(d.location || 'City, Area')}
                </div>
                <div style="font-size:clamp(24px,3vw,34px);font-weight:800;color:#0f4c81;
                  margin-bottom:20px;">
                  ${esc(d.price || '₹2.8 Cr')}
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;
                  padding:16px;background:#f8fafc;border-radius:12px;margin-bottom:20px;">
                  ${[
                    ['🛏', d.beds    || 4,              'Bedrooms'],
                    ['🚿', d.baths   || 3,              'Bathrooms'],
                    ['📐', (d.sqft   || 2800) + ' sqft','Area'],
                    ['🚗', d.parking || 2,              'Parking']
                  ].map(([icon, val, lbl]) => `
                    <div style="text-align:center;padding:8px;">
                      <div style="font-size:20px;">${icon}</div>
                      <div style="font-size:16px;font-weight:700;color:#0f172a;">${esc(String(val))}</div>
                      <div style="font-size:11px;color:#64748b;">${lbl}</div>
                    </div>
                  `).join('')}
                </div>
                ${d.desc ? `
                  <p style="color:#64748b;font-size:15px;line-height:1.75;margin-bottom:20px;">
                    ${esc(d.desc.slice(0, 200))}
                  </p>
                ` : ''}
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;">
                  ${features.map(f => `
                    <div style="font-size:13px;color:#374151;">
                      ✓ ${esc(typeof f === 'object' ? f.text : f)}
                    </div>
                  `).join('')}
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
                  <button style="background:#0f4c81;color:#fff;border:none;padding:15px;
                    border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">
                    Schedule a Visit
                  </button>
                  <button style="background:transparent;color:#0f4c81;border:1.5px solid #0f4c81;
                    padding:14px;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">
                    Contact Agent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Agent Cards ───────────────────────────────────────────── */
  agents: {
    cat: { label: 'Agents', icon: '👔', sub: 'Agent profile cards', bg: '#ede9fe' },

    fields: [
      { key: 'heading',    label: 'Heading',    ph: 'Meet Our Agents' },
      { key: 'subheading', label: 'Subheading', ph: '' },
      { key: 'items', type: 'items', label: 'Agents',
        cols: ['icon','name','specialty','listings','sold','years'],
        colLabels: ['Icon','Name','Specialty','Listings','Sold','Years Exp'] }
    ],

    render(d, esc) {
      const agents = (d.items && d.items.length ? d.items : [
        { icon:'👩', name:'Agent Name', specialty:'Luxury Residential',     listings:48, sold:120, years:8  },
        { icon:'👨', name:'Agent Name', specialty:'Commercial & Investment', listings:35, sold:94,  years:6  },
        { icon:'👩', name:'Agent Name', specialty:'Affordable Housing',      listings:52, sold:145, years:10 },
        { icon:'👨', name:'Agent Name', specialty:'Plots & Land',            listings:29, sold:67,  years:5  }
      ]).slice(0, 4);

      return `
        <div class="section section-alt">
          <div class="container">
            <div class="section-heading text-center" style="margin-bottom:48px;">
              <h2>${esc(d.heading || 'Meet Our Agents')}</h2>
              ${d.subheading ? `<p>${esc(d.subheading)}</p>` : ''}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;">
              ${agents.map(ag => `
                <div style="background:#fff;border:1.5px solid #e2e8f0;
                  border-radius:16px;padding:28px 20px;text-align:center;">
                  <div style="width:88px;height:88px;border-radius:50%;
                    background:linear-gradient(135deg,#0f4c81,#2563eb);
                    display:flex;align-items:center;justify-content:center;
                    font-size:46px;margin:0 auto 16px;">
                    ${esc(ag.icon || '👤')}
                  </div>
                  <div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:4px;">
                    ${esc(ag.name || 'Agent')}
                  </div>
                  <div style="font-size:12px;color:#0f4c81;font-weight:600;margin-bottom:18px;">
                    ${esc(ag.specialty || 'Residential')}
                  </div>
                  <div style="display:flex;justify-content:space-around;padding:12px 0;
                    border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;margin-bottom:18px;">
                    ${[
                      [ag.listings || 0, 'Listings'],
                      [ag.sold     || 0, 'Sold'],
                      [(ag.years   || 0) + 'y', 'Exp']
                    ].map(([val, lbl]) => `
                      <div style="text-align:center;">
                        <div style="font-size:20px;font-weight:800;color:#0f4c81;">
                          ${esc(String(val))}
                        </div>
                        <div style="font-size:10px;color:#94a3b8;">${lbl}</div>
                      </div>
                    `).join('')}
                  </div>
                  <button style="background:#0f4c81;color:#fff;border:none;
                    padding:10px 24px;border-radius:8px;font-size:13px;
                    font-weight:600;cursor:pointer;width:100%;">Contact</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Blog / Articles Grid — DYNAMIC (ms_posts) ────────────── */
  blog_posts: {
    cat: { label: 'Blog Posts', icon: '📰', sub: 'Dynamic blog posts from ms_posts', bg: '#fef3c7' },

    /*
     * Posts load from ms_posts at page render time.
     * Fields control limit, category filter, and sort — not post content.
     */
    fields: [
      { key: 'heading',    label: 'Heading',    ph: 'Latest Articles' },
      { key: 'subheading', label: 'Subheading', ph: '' },
      { key: 'category',   label: 'Category filter (slug, optional)',
        ph: 'tips — leave blank for all blog posts' },
      { key: 'limit', type: 'select', label: 'Number of posts to show',
        default: '3',
        options: { '3':'3', '6':'6', '9':'9' } },
      { key: 'sort_by', type: 'select', label: 'Sort by',
        default: 'newest',
        options: { 'newest':'Newest first', 'popular':'Most popular', 'featured':'Featured first' } }
    ],

    render(d, esc) {
      const samplePosts = [
        { icon:'🏠', category:'Buying Guide',  title:'10 Things to Check Before Buying a Flat',
          excerpt:'The complete pre-purchase checklist every buyer should run through.',
          author:'Your Name', date:'Jul 2026' },
        { icon:'📈', category:'Market Trends', title:'Real Estate Market Outlook 2026',
          excerpt:'Key data and analysis on price movements across top cities.',
          author:'Your Name', date:'Jul 2026' },
        { icon:'🔑', category:'Selling Tips',  title:'How to Price Your Property Right',
          excerpt:'Find the sweet spot between selling fast and getting top value.',
          author:'Your Name', date:'Jul 2026' }
      ];
      const limit = parseInt(d.limit || '3', 10);

      return `
        <div class="section">
          <div class="container">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;
              margin-bottom:48px;flex-wrap:wrap;gap:12px;">
              <div>
                <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#0f172a;
                  margin-bottom:8px;">
                  ${esc(d.heading || 'Latest Articles')}
                </h2>
                ${d.subheading ? `<p style="color:#64748b;">${esc(d.subheading)}</p>` : ''}
              </div>
              <div style="background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;
                padding:6px 14px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;
                border:1.5px solid #fde68a;">
                ⚡ Dynamic · loads ${limit} from ms_posts
                ${d.category ? ` · category: ${esc(d.category)}` : ''}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
              ${samplePosts.map(post => {
                const initial = (post.author || '?')[0].toUpperCase();
                return `
                  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                    <div style="background:linear-gradient(135deg,#0f4c81,#2563eb);
                      height:180px;display:flex;align-items:center;justify-content:center;">
                      <div style="font-size:80px;opacity:0.2;">${esc(post.icon)}</div>
                    </div>
                    <div style="padding:22px;">
                      <div style="font-size:11px;font-weight:700;color:#0f4c81;
                        letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">
                        ${esc(post.category)}
                      </div>
                      <div style="font-size:17px;font-weight:700;color:#0f172a;
                        margin-bottom:10px;line-height:1.4;">
                        ${esc(post.title)}
                      </div>
                      <div style="font-size:13px;color:#64748b;line-height:1.65;margin-bottom:18px;">
                        ${esc(post.excerpt)}
                      </div>
                      <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="width:28px;height:28px;border-radius:50%;background:#0f4c81;
                            display:flex;align-items:center;justify-content:center;
                            color:#fff;font-size:12px;font-weight:700;">
                            ${initial}
                          </div>
                          <div style="font-size:12px;color:#94a3b8;">
                            ${esc(post.author)} · ${esc(post.date)}
                          </div>
                        </div>
                        <div style="font-size:12px;color:#0f4c81;font-weight:600;cursor:pointer;">
                          Read →
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;
    }
  }

}); // registerThemeSections
