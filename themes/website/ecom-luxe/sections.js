/* ════════════════════════════════════════════════════════════════
   Ecom Luxe Theme — Section Definitions
   Accent: #d4af37 (gold) — dark background, premium luxury feel

   Identical structure to ecom-fresh/sections.js.
   Only the accent color and sample card backgrounds differ.

   Dynamic sections: category_banner, product_grid
   Static/shell sections: product_detail, cart, checkout

   ms_products → ecom products (and all other product types)
   ms_posts    → pages and blog posts
   ════════════════════════════════════════════════════════════════ */

const _ECOM_AC = '#d4af37'; // gold

registerThemeSections({

  /* ── Category / Collection Banner — DYNAMIC (ms_products) ─── */
  category_banner: {
    cat: { label: 'Category Banner', icon: '🏷️', sub: 'Dynamic category cards from ms_products', bg: '#fef9c3' },

    fields: [
      { key: 'heading',  label: 'Heading',            ph: 'Shop by Category' },
      { key: 'subtext',  label: 'Subtext (optional)', ph: 'Curated collections, crafted with care.' },
      { key: 'limit', type: 'select', label: 'Max categories to show',
        default: '4', options: { '3':'3', '4':'4', '6':'6', '8':'8' } },
      { key: 'bgColor', type: 'color', label: 'Background color', default: '#0a0a0f' }
    ],

    render(d, esc) {
      const AC    = _ECOM_AC;
      const bg    = d.bgColor || '#0a0a0f';
      const limit = parseInt(d.limit || '4', 10);
      const sample = [
        { icon:'💎', label:'Fine Jewellery',  color:'#1a1228' },
        { icon:'👠', label:'Luxury Footwear', color:'#1a1205' },
        { icon:'👜', label:'Designer Bags',   color:'#180d05' },
        { icon:'⌚', label:'Timepieces',       color:'#0f1a1a' },
        { icon:'🧥', label:'Couture',          color:'#1a0505' },
        { icon:'🕶️', label:'Eyewear',          color:'#0a1a0a' }
      ].slice(0, limit);

      return `
        <div style="background:${esc(bg)};padding:80px;">
          <div style="text-align:center;margin-bottom:48px;">
            <h2 style="font-size:clamp(28px,4vw,48px);font-weight:800;color:#fff;
              margin-bottom:10px;letter-spacing:-1px;">
              ${esc(d.heading || 'Shop by Category')}
            </h2>
            ${d.subtext ? `
              <p style="font-size:16px;color:rgba(255,255,255,0.5);">${esc(d.subtext)}</p>
            ` : ''}
            <div style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;
              background:rgba(212,175,55,0.15);color:${AC};font-size:11px;
              font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">
              ⚡ Dynamic · loads ${limit} categories from ms_products
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;">
            ${sample.map(cat => `
              <a href="#" style="text-decoration:none;">
                <div style="background:${cat.color};border:1px solid rgba(212,175,55,0.3);
                  border-radius:20px;padding:36px 20px;text-align:center;">
                  <div style="font-size:48px;margin-bottom:14px;">${esc(cat.icon)}</div>
                  <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:8px;">
                    ${esc(cat.label)}
                  </div>
                  <div style="font-size:12px;color:${AC};">Explore →</div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `;
    }
  },

  /* ── Product Grid — DYNAMIC (ms_products) ─────────────────── */
  product_grid: {
    cat: { label: 'Product Grid', icon: '🛍️', sub: 'Dynamic product cards from ms_products', bg: '#fef9c3' },

    fields: [
      { key: 'heading',    label: 'Heading',    ph: 'Our Collection' },
      { key: 'subheading', label: 'Subheading', ph: '' },
      { key: 'category',   label: 'Category filter (slug, optional)',
        ph: 'jewellery — leave blank for all' },
      { key: 'limit', type: 'select', label: 'Number of products to show',
        default: '8',
        options: { '4':'4', '8':'8', '12':'12', '16':'16' } },
      { key: 'sort_by', type: 'select', label: 'Sort by',
        default: 'newest',
        options: { 'newest':'Newest first', 'price_asc':'Price: low to high',
                   'price_desc':'Price: high to low', 'popular':'Most popular',
                   'featured':'Featured first' } }
    ],

    render(d, esc) {
      const AC    = _ECOM_AC;
      const limit = parseInt(d.limit || '8', 10);
      const sampleProducts = [
        { icon:'💎', name:'Diamond Pendant', category:'Jewellery', price:'₹24,999', oldPrice:'₹29,999', badge:'New' },
        { icon:'👠', name:'Stiletto Heels',  category:'Footwear',  price:'₹8,499',  oldPrice:'',        badge:''    },
        { icon:'⌚', name:'Gold Chronograph',category:'Watches',   price:'₹45,000', oldPrice:'₹52,000', badge:'Sale'},
        { icon:'👜', name:'Leather Clutch',  category:'Bags',      price:'₹12,999', oldPrice:'',        badge:''    }
      ];

      return `
        <div class="section section-alt" style="background:#0a0a0f;">
          <div class="container">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;
              margin-bottom:48px;flex-wrap:wrap;gap:12px;">
              <div>
                ${d.heading ? `
                  <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#fff;
                    margin-bottom:8px;">${esc(d.heading)}</h2>
                ` : ''}
                ${d.subheading ? `<p style="color:rgba(255,255,255,0.5);">${esc(d.subheading)}</p>` : ''}
              </div>
              <div style="background:rgba(212,175,55,0.15);color:${AC};font-size:11px;
                font-weight:700;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;
                white-space:nowrap;border:1px solid rgba(212,175,55,0.3);">
                ⚡ Dynamic · loads ${limit} from ms_products
                ${d.category ? ` · category: ${esc(d.category)}` : ''}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;">
              ${sampleProducts.map(p => `
                <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                  border-radius:16px;overflow:hidden;">
                  <div style="background:#1a1a28;height:220px;display:flex;
                    align-items:center;justify-content:center;position:relative;">
                    <div style="font-size:90px;">${esc(p.icon)}</div>
                    ${p.badge ? `
                      <div style="position:absolute;top:14px;left:14px;background:${AC};
                        color:#000;font-size:10px;font-weight:700;
                        padding:4px 12px;border-radius:20px;">${esc(p.badge)}</div>
                    ` : ''}
                  </div>
                  <div style="padding:16px;">
                    <div style="font-size:11px;color:${AC};font-weight:600;
                      letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
                      ${esc(p.category)}
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:10px;">
                      ${esc(p.name)}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                      <div style="font-size:19px;font-weight:800;color:${AC};">
                        ${esc(p.price)}
                      </div>
                      ${p.oldPrice ? `
                        <div style="font-size:13px;color:rgba(255,255,255,0.35);
                          text-decoration:line-through;">${esc(p.oldPrice)}</div>
                      ` : ''}
                    </div>
                    <button style="width:100%;background:${AC};color:#000;border:none;
                      padding:11px;border-radius:10px;font-size:14px;font-weight:700;
                      cursor:pointer;">Add to Cart</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Product Detail Page ───────────────────────────────────── */
  product_detail: {
    cat: { label: 'Product Detail', icon: '📦', sub: 'Single product detail page', bg: '#fef9c3' },

    fields: [
      { key: 'show_related', type: 'select', label: 'Show related products',
        default: 'yes', options: { 'yes':'Yes', 'no':'No' } },
      { key: 'related_limit', type: 'select', label: 'Related products count',
        default: '4', options: { '2':'2', '4':'4', '6':'6' } },
      { key: 'add_to_cart_text', label: 'Add to Cart text', ph: 'Add to Cart' },
      { key: 'buy_now_text',     label: 'Buy Now text',     ph: 'Buy Now' }
    ],

    render(d, esc) {
      const AC = _ECOM_AC;
      const sample = { icon:'💎', name:'Diamond Solitaire Pendant', category:'Fine Jewellery',
        price:'₹24,999', oldPrice:'₹29,999', badge:'New Arrival', rating:4.9, reviews:86 };

      return `
        <div class="section" style="background:#0a0a0f;">
          <div class="container">
            <div style="background:rgba(212,175,55,0.1);color:${AC};font-size:11px;
              font-weight:700;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;
              display:inline-block;margin-bottom:24px;border:1px solid rgba(212,175,55,0.3);">
              ⚡ Dynamic · product data loads from ms_products via URL slug
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;">
              <div>
                <div style="background:#1a1a28;border-radius:20px;height:400px;
                  display:flex;align-items:center;justify-content:center;
                  position:relative;margin-bottom:14px;">
                  <div style="font-size:160px;">${sample.icon}</div>
                  <div style="position:absolute;top:20px;left:20px;background:${AC};
                    color:#000;font-size:11px;font-weight:700;padding:6px 16px;
                    border-radius:20px;">${sample.badge}</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                  ${[0,1,2,3].map(() =>
                    `<div style="background:#1a1a28;border-radius:10px;height:80px;"></div>`
                  ).join('')}
                </div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:${AC};margin-bottom:10px;">
                  ${sample.category}
                </div>
                <h2 style="font-size:clamp(22px,3vw,32px);font-weight:800;color:#fff;
                  margin-bottom:10px;line-height:1.2;">${sample.name}</h2>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
                  <div style="font-size:14px;color:${AC};">★★★★★</div>
                  <span style="font-size:13px;font-weight:700;color:#fff;">${sample.rating}</span>
                  <span style="font-size:13px;color:rgba(255,255,255,0.4);">(${sample.reviews} reviews)</span>
                </div>
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
                  <div style="font-size:32px;font-weight:800;color:${AC};">${sample.price}</div>
                  <div style="font-size:16px;color:rgba(255,255,255,0.3);
                    text-decoration:line-through;">${sample.oldPrice}</div>
                </div>
                <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);
                  border-radius:12px;padding:16px;margin-bottom:24px;">
                  ${['Certified genuine gold & diamond','Complimentary gift packaging',
                     '30-day returns','Lifetime polishing service'].map(h => `
                    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:6px;">
                      <span style="color:${AC};font-weight:700;">✓</span> ${esc(h)}
                    </div>
                  `).join('')}
                </div>
                <div style="display:flex;gap:12px;">
                  <button style="flex:1;background:${AC};color:#000;border:none;padding:15px;
                    border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                    ${esc(d.add_to_cart_text || 'Add to Cart')}
                  </button>
                  <button style="flex:1;background:#fff;color:#000;border:none;padding:15px;
                    border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                    ${esc(d.buy_now_text || 'Buy Now')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Cart ──────────────────────────────────────────────────── */
  cart: {
    cat: { label: 'Cart', icon: '🛒', sub: 'Shopping cart page', bg: '#fef9c3' },

    fields: [
      { key: 'heading',           label: 'Heading',              ph: 'Your Cart' },
      { key: 'cta_text',          label: 'Checkout button text', ph: 'Proceed to Checkout' },
      { key: 'promo_placeholder', label: 'Coupon field hint',    ph: 'Enter coupon code' }
    ],

    render(d, esc) {
      const AC = _ECOM_AC;
      const sampleItems = [
        { icon:'💎', name:'Diamond Pendant',  variant:'Gold 18K | Size: Standard', price:24999, qty:1 },
        { icon:'⌚', name:'Gold Chronograph', variant:'Gold Strap',                price:45000, qty:1 }
      ];
      const subtotal = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
      const total    = subtotal + 199;

      return `
        <div class="section section-alt" style="background:#0a0a0f;">
          <div class="container">
            <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#fff;
              margin-bottom:36px;">
              ${esc(d.heading || 'Your Cart')}
              <span style="font-size:16px;font-weight:500;color:rgba(255,255,255,0.4);
                margin-left:10px;">(${sampleItems.length} items)</span>
            </h2>
            <div style="display:grid;grid-template-columns:1.5fr 0.75fr;gap:32px;align-items:start;">
              <div style="display:flex;flex-direction:column;gap:16px;">
                ${sampleItems.map(item => `
                  <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                    border-radius:16px;padding:20px;display:flex;align-items:center;gap:20px;">
                    <div style="background:#1a1a28;border-radius:12px;width:90px;height:90px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:50px;flex-shrink:0;">${esc(item.icon)}</div>
                    <div style="flex:1;">
                      <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;">
                        ${esc(item.name)}
                      </div>
                      <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:12px;">
                        ${esc(item.variant)}
                      </div>
                      <div style="display:flex;align-items:center;gap:12px;">
                        <div style="display:flex;align-items:center;
                          border:1px solid rgba(212,175,55,0.3);border-radius:8px;overflow:hidden;">
                          <button style="padding:6px 12px;border:none;background:none;
                            cursor:pointer;font-size:16px;color:#fff;">−</button>
                          <span style="padding:6px 14px;font-size:14px;font-weight:600;color:#fff;">
                            ${item.qty}
                          </span>
                          <button style="padding:6px 12px;border:none;background:none;
                            cursor:pointer;font-size:16px;color:#fff;">+</button>
                        </div>
                        <button style="background:none;border:none;color:#ef4444;
                          font-size:13px;cursor:pointer;">Remove</button>
                      </div>
                    </div>
                    <div style="font-size:18px;font-weight:800;color:${AC};">
                      ₹${(item.price * item.qty).toLocaleString('en-IN')}
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                border-radius:16px;padding:24px;">
                <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:20px;">
                  Order Summary
                </div>
                ${[['Subtotal','₹' + subtotal.toLocaleString('en-IN')],
                   ['Shipping','₹199'],['Discount','— ₹0']].map(([k,v]) => `
                  <div style="display:flex;justify-content:space-between;
                    font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:12px;">
                    <span>${k}</span><span>${v}</span>
                  </div>
                `).join('')}
                <div style="border-top:1px solid rgba(212,175,55,0.2);margin:16px 0;"></div>
                <div style="display:flex;justify-content:space-between;font-size:17px;
                  font-weight:700;color:#fff;margin-bottom:20px;">
                  <span>Total</span>
                  <span style="color:${AC};">₹${total.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:16px;">
                  <input placeholder="${esc(d.promo_placeholder || 'Enter coupon code')}"
                    style="flex:1;background:#0a0a0f;border:1px solid rgba(212,175,55,0.3);
                      border-radius:8px;padding:10px 14px;font-size:13px;color:#fff;outline:none;" />
                  <button style="background:${AC};color:#000;border:none;padding:10px 16px;
                    border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;">Apply</button>
                </div>
                <button style="width:100%;background:${AC};color:#000;border:none;padding:15px;
                  border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                  ${esc(d.cta_text || 'Proceed to Checkout')} →
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  /* ── Checkout ──────────────────────────────────────────────── */
  checkout: {
    cat: { label: 'Checkout', icon: '💳', sub: 'Checkout form and order summary', bg: '#fef9c3' },

    fields: [
      { key: 'heading',    label: 'Heading',                ph: 'Checkout' },
      { key: 'cta_text',   label: 'Place order button text', ph: 'Place Order' },
      { key: 'pay_methods', type: 'items', label: 'Payment methods',
        cols: ['icon','label'], colLabels: ['Icon (emoji)','Method label'] }
    ],

    render(d, esc) {
      const AC = _ECOM_AC;
      const payMethods = (d.pay_methods && d.pay_methods.length ? d.pay_methods : [
        { icon:'💳', label:'Credit / Debit Card' },
        { icon:'📱', label:'UPI' },
        { icon:'🏦', label:'Net Banking' },
        { icon:'💵', label:'Cash on Delivery' }
      ]).slice(0, 4);

      return `
        <div class="section section-alt" style="background:#0a0a0f;">
          <div class="container">
            <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#fff;
              margin-bottom:36px;">${esc(d.heading || 'Checkout')}</h2>
            <div style="display:grid;grid-template-columns:1.5fr 0.75fr;gap:32px;align-items:start;">
              <div style="display:flex;flex-direction:column;gap:20px;">
                <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                  border-radius:16px;padding:24px;">
                  <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:16px;">
                    Delivery Address
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    ${['First Name','Last Name','Phone','Email'].map(lbl => `
                      <input placeholder="${lbl}"
                        style="background:#0a0a0f;border:1px solid rgba(212,175,55,0.25);
                          border-radius:8px;padding:12px 14px;font-size:13px;
                          color:#fff;outline:none;" />
                    `).join('')}
                    <input placeholder="Address"
                      style="grid-column:1/-1;background:#0a0a0f;
                        border:1px solid rgba(212,175,55,0.25);border-radius:8px;
                        padding:12px 14px;font-size:13px;color:#fff;outline:none;" />
                    ${['City','PIN Code'].map(lbl => `
                      <input placeholder="${lbl}"
                        style="background:#0a0a0f;border:1px solid rgba(212,175,55,0.25);
                          border-radius:8px;padding:12px 14px;font-size:13px;
                          color:#fff;outline:none;" />
                    `).join('')}
                  </div>
                </div>
                <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                  border-radius:16px;padding:24px;">
                  <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:16px;">
                    Payment Method
                  </div>
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    ${payMethods.map((m, i) => `
                      <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;
                        border:1px solid ${i === 0 ? AC : 'rgba(212,175,55,0.2)'};
                        border-radius:10px;cursor:pointer;
                        background:${i === 0 ? 'rgba(212,175,55,0.08)' : '#0a0a0f'};">
                        <div style="font-size:22px;">${esc(m.icon || '💳')}</div>
                        <div style="font-size:14px;font-weight:600;color:#fff;">
                          ${esc(m.label || 'Payment')}
                        </div>
                        <div style="margin-left:auto;width:16px;height:16px;border-radius:50%;
                          background:${i === 0 ? AC : 'transparent'};
                          border:2px solid ${i === 0 ? AC : 'rgba(255,255,255,0.2)'};"></div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <div style="background:#111118;border:1px solid rgba(212,175,55,0.2);
                border-radius:16px;padding:24px;">
                <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:20px;">
                  Order Total
                </div>
                ${[['2 items','₹69,999'],['Shipping','₹199'],['Discount','— ₹0']].map(([k,v]) => `
                  <div style="display:flex;justify-content:space-between;
                    font-size:14px;color:rgba(255,255,255,0.4);margin-bottom:12px;">
                    <span>${k}</span><span>${v}</span>
                  </div>
                `).join('')}
                <div style="border-top:1px solid rgba(212,175,55,0.2);margin:16px 0;"></div>
                <div style="display:flex;justify-content:space-between;font-size:17px;
                  font-weight:700;color:#fff;margin-bottom:24px;">
                  <span>Total</span>
                  <span style="color:${AC};">₹70,198</span>
                </div>
                <button style="width:100%;background:${AC};color:#000;border:none;padding:15px;
                  border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                  ${esc(d.cta_text || 'Place Order')} →
                </button>
                <div style="font-size:11px;color:rgba(255,255,255,0.3);text-align:center;margin-top:12px;">
                  🔒 Secure payment · SSL encrypted
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

}); // registerThemeSections
