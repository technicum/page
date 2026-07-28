/* ════════════════════════════════════════════════════════════════
   Ecom Spark Theme — Section Definitions
   Accent: #f43f5e (rose/coral) — white background, vibrant energy

   Identical structure to ecom-fresh/sections.js.
   Only the accent color and sample card backgrounds differ.

   Dynamic sections: category_banner, product_grid
   Static/shell sections: product_detail, cart, checkout

   ms_products → ecom products (and all other product types)
   ms_posts    → pages and blog posts
   ════════════════════════════════════════════════════════════════ */

const _ECOM_AC = '#f43f5e'; // rose / coral

registerThemeSections({

  /* ── Category / Collection Banner — DYNAMIC (ms_products) ─── */
  category_banner: {
    cat: { label: 'Category Banner', icon: '🏷️', sub: 'Dynamic category cards from ms_products', bg: '#ffe4e6' },

    fields: [
      { key: 'heading',  label: 'Heading',            ph: 'Shop by Category' },
      { key: 'subtext',  label: 'Subtext (optional)', ph: 'Find something you\'ll love.' },
      { key: 'limit', type: 'select', label: 'Max categories to show',
        default: '4', options: { '3':'3', '4':'4', '6':'6', '8':'8' } },
      { key: 'bgColor', type: 'color', label: 'Background color', default: '#4c0519' }
    ],

    render(d, esc) {
      const AC    = _ECOM_AC;
      const bg    = d.bgColor || '#4c0519';
      const limit = parseInt(d.limit || '4', 10);
      const sample = [
        { icon:'💄', label:'Beauty',      color:'#881337' },
        { icon:'👗', label:'Fashion',     color:'#9f1239' },
        { icon:'🧴', label:'Skincare',    color:'#be185d' },
        { icon:'💅', label:'Nails',       color:'#be123c' },
        { icon:'🌸', label:'Wellness',    color:'#9d174d' },
        { icon:'✨', label:'Lifestyle',   color:'#7f1d1d' }
      ].slice(0, limit);

      return `
        <div style="background:${esc(bg)};padding:80px;">
          <div style="text-align:center;margin-bottom:48px;">
            <h2 style="font-size:clamp(28px,4vw,48px);font-weight:800;color:#fff;
              margin-bottom:10px;letter-spacing:-1px;">
              ${esc(d.heading || 'Shop by Category')}
            </h2>
            ${d.subtext ? `
              <p style="font-size:16px;color:rgba(255,255,255,0.65);">${esc(d.subtext)}</p>
            ` : ''}
            <div style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;
              background:rgba(244,63,94,0.2);color:${AC};font-size:11px;
              font-weight:700;padding:5px 14px;border-radius:20px;letter-spacing:0.5px;">
              ⚡ Dynamic · loads ${limit} categories from ms_products
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:20px;">
            ${sample.map(cat => `
              <a href="#" style="text-decoration:none;">
                <div style="background:${cat.color};border-radius:20px;padding:36px 20px;
                  text-align:center;">
                  <div style="font-size:48px;margin-bottom:14px;">${esc(cat.icon)}</div>
                  <div style="font-size:17px;font-weight:700;color:#fff;margin-bottom:8px;">
                    ${esc(cat.label)}
                  </div>
                  <div style="font-size:12px;color:rgba(255,255,255,0.65);">Shop Now →</div>
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
    cat: { label: 'Product Grid', icon: '🛍️', sub: 'Dynamic product cards from ms_products', bg: '#ffe4e6' },

    fields: [
      { key: 'heading',    label: 'Heading',    ph: 'Trending Now' },
      { key: 'subheading', label: 'Subheading', ph: '' },
      { key: 'category',   label: 'Category filter (slug, optional)',
        ph: 'beauty — leave blank for all' },
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
        { icon:'💄', name:'Matte Lipstick',    category:'Lips',     price:'₹699',   oldPrice:'₹999',  badge:'Hot' },
        { icon:'✨', name:'Glow Serum',         category:'Skincare', price:'₹1,299', oldPrice:'',      badge:'New' },
        { icon:'💅', name:'Nail Art Set',       category:'Nails',    price:'₹349',   oldPrice:'₹499',  badge:'Sale'},
        { icon:'🌸', name:'Rose Face Mist',     category:'Skincare', price:'₹449',   oldPrice:'',      badge:''    }
      ];

      return `
        <div class="section section-alt">
          <div class="container">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;
              margin-bottom:48px;flex-wrap:wrap;gap:12px;">
              <div>
                ${d.heading ? `
                  <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#0f172a;
                    margin-bottom:8px;">${esc(d.heading)}</h2>
                ` : ''}
                ${d.subheading ? `<p style="color:#64748b;">${esc(d.subheading)}</p>` : ''}
              </div>
              <div style="background:#ffe4e6;color:#be123c;font-size:11px;font-weight:700;
                padding:6px 14px;border-radius:20px;letter-spacing:0.5px;white-space:nowrap;
                border:1.5px solid #fecdd3;">
                ⚡ Dynamic · loads ${limit} from ms_products
                ${d.category ? ` · category: ${esc(d.category)}` : ''}
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;">
              ${sampleProducts.map(p => `
                <div style="background:#fff;border:1.5px solid #e2e8f0;
                  border-radius:16px;overflow:hidden;">
                  <div style="background:#fff1f2;height:220px;display:flex;
                    align-items:center;justify-content:center;position:relative;">
                    <div style="font-size:90px;">${esc(p.icon)}</div>
                    ${p.badge ? `
                      <div style="position:absolute;top:14px;left:14px;background:${AC};
                        color:#fff;font-size:10px;font-weight:700;
                        padding:4px 12px;border-radius:20px;">${esc(p.badge)}</div>
                    ` : ''}
                    <button style="position:absolute;bottom:14px;right:14px;background:#fff;
                      border:1.5px solid #e2e8f0;border-radius:50%;
                      width:34px;height:34px;font-size:18px;cursor:pointer;">♡</button>
                  </div>
                  <div style="padding:16px;">
                    <div style="font-size:11px;color:#64748b;font-weight:600;
                      letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">
                      ${esc(p.category)}
                    </div>
                    <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:10px;">
                      ${esc(p.name)}
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
                      <div style="font-size:19px;font-weight:800;color:${AC};">
                        ${esc(p.price)}
                      </div>
                      ${p.oldPrice ? `
                        <div style="font-size:13px;color:#94a3b8;text-decoration:line-through;">
                          ${esc(p.oldPrice)}
                        </div>
                      ` : ''}
                    </div>
                    <button style="width:100%;background:${AC};color:#fff;border:none;
                      padding:11px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">
                      Add to Cart
                    </button>
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
    cat: { label: 'Product Detail', icon: '📦', sub: 'Single product detail page', bg: '#ffe4e6' },

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
      const sample = { icon:'✨', name:'Vitamin C Glow Serum', category:'Skincare',
        price:'₹1,299', oldPrice:'₹1,799', badge:'Best Seller', rating:4.8, reviews:312 };

      return `
        <div class="section">
          <div class="container">
            <div style="background:#ffe4e6;color:#be123c;font-size:11px;font-weight:700;
              padding:6px 14px;border-radius:20px;letter-spacing:0.5px;
              display:inline-block;margin-bottom:24px;border:1.5px solid #fecdd3;">
              ⚡ Dynamic · product data loads from ms_products via URL slug
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:start;">
              <div>
                <div style="background:#fff1f2;border-radius:20px;height:400px;
                  display:flex;align-items:center;justify-content:center;
                  position:relative;margin-bottom:14px;">
                  <div style="font-size:160px;">${sample.icon}</div>
                  <div style="position:absolute;top:20px;left:20px;background:${AC};
                    color:#fff;font-size:11px;font-weight:700;padding:6px 16px;
                    border-radius:20px;">${sample.badge}</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                  ${[0,1,2,3].map(() =>
                    `<div style="background:#fff1f2;border-radius:10px;height:80px;"></div>`
                  ).join('')}
                </div>
              </div>
              <div>
                <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;
                  text-transform:uppercase;color:${AC};margin-bottom:10px;">
                  ${sample.category}
                </div>
                <h2 style="font-size:clamp(22px,3vw,32px);font-weight:800;color:#0f172a;
                  margin-bottom:10px;line-height:1.2;">${sample.name}</h2>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;">
                  <div style="font-size:14px;color:#fbbf24;">★★★★★</div>
                  <span style="font-size:13px;font-weight:700;color:#0f172a;">${sample.rating}</span>
                  <span style="font-size:13px;color:#64748b;">(${sample.reviews} reviews)</span>
                </div>
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
                  <div style="font-size:32px;font-weight:800;color:${AC};">${sample.price}</div>
                  <div style="font-size:16px;color:#94a3b8;text-decoration:line-through;">${sample.oldPrice}</div>
                </div>
                <div style="background:#fff1f2;border-radius:12px;padding:16px;margin-bottom:24px;">
                  ${['Dermatologist tested','Cruelty-free formula',
                     'Free delivery above ₹499','30-day returns'].map(h => `
                    <div style="font-size:13px;color:#9f1239;margin-bottom:6px;">
                      <span style="color:${AC};font-weight:700;">✓</span> ${esc(h)}
                    </div>
                  `).join('')}
                </div>
                <div style="display:flex;gap:12px;">
                  <button style="flex:1;background:${AC};color:#fff;border:none;padding:15px;
                    border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                    ${esc(d.add_to_cart_text || 'Add to Cart')}
                  </button>
                  <button style="flex:1;background:#0f172a;color:#fff;border:none;padding:15px;
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
    cat: { label: 'Cart', icon: '🛒', sub: 'Shopping cart page', bg: '#ffe4e6' },

    fields: [
      { key: 'heading',           label: 'Heading',              ph: 'Your Cart' },
      { key: 'cta_text',          label: 'Checkout button text', ph: 'Proceed to Checkout' },
      { key: 'promo_placeholder', label: 'Coupon field hint',    ph: 'Enter coupon code' }
    ],

    render(d, esc) {
      const AC = _ECOM_AC;
      const sampleItems = [
        { icon:'✨', name:'Vitamin C Glow Serum', variant:'30ml',             price:1299, qty:2 },
        { icon:'💄', name:'Matte Lipstick',       variant:'Shade: Cherry Red', price:699,  qty:1 }
      ];
      const subtotal = sampleItems.reduce((s, i) => s + i.price * i.qty, 0);
      const total    = subtotal + 49;

      return `
        <div class="section section-alt">
          <div class="container">
            <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#0f172a;
              margin-bottom:36px;">
              ${esc(d.heading || 'Your Cart')}
              <span style="font-size:16px;font-weight:500;color:#64748b;margin-left:10px;">
                (${sampleItems.length} items)
              </span>
            </h2>
            <div style="display:grid;grid-template-columns:1.5fr 0.75fr;gap:32px;align-items:start;">
              <div style="display:flex;flex-direction:column;gap:16px;">
                ${sampleItems.map(item => `
                  <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;
                    padding:20px;display:flex;align-items:center;gap:20px;">
                    <div style="background:#fff1f2;border-radius:12px;width:90px;height:90px;
                      display:flex;align-items:center;justify-content:center;
                      font-size:50px;flex-shrink:0;">${esc(item.icon)}</div>
                    <div style="flex:1;">
                      <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">
                        ${esc(item.name)}
                      </div>
                      <div style="font-size:12px;color:#64748b;margin-bottom:12px;">
                        ${esc(item.variant)}
                      </div>
                      <div style="display:flex;align-items:center;gap:12px;">
                        <div style="display:flex;align-items:center;border:1.5px solid #e2e8f0;
                          border-radius:8px;overflow:hidden;">
                          <button style="padding:6px 12px;border:none;background:none;
                            cursor:pointer;font-size:16px;">−</button>
                          <span style="padding:6px 14px;font-size:14px;font-weight:600;">
                            ${item.qty}
                          </span>
                          <button style="padding:6px 12px;border:none;background:none;
                            cursor:pointer;font-size:16px;">+</button>
                        </div>
                        <button style="background:none;border:none;color:#ef4444;
                          font-size:13px;cursor:pointer;">Remove</button>
                      </div>
                    </div>
                    <div style="font-size:18px;font-weight:800;color:#0f172a;">
                      ₹${(item.price * item.qty).toLocaleString('en-IN')}
                    </div>
                  </div>
                `).join('')}
              </div>
              <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;">
                <div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:20px;">
                  Order Summary
                </div>
                ${[['Subtotal','₹' + subtotal.toLocaleString('en-IN')],
                   ['Shipping','₹49'],['Discount','— ₹0']].map(([k,v]) => `
                  <div style="display:flex;justify-content:space-between;
                    font-size:14px;color:#64748b;margin-bottom:12px;">
                    <span>${k}</span><span>${v}</span>
                  </div>
                `).join('')}
                <div style="border-top:1.5px solid #e2e8f0;margin:16px 0;"></div>
                <div style="display:flex;justify-content:space-between;font-size:17px;
                  font-weight:700;color:#0f172a;margin-bottom:20px;">
                  <span>Total</span>
                  <span style="color:${AC};">₹${total.toLocaleString('en-IN')}</span>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:16px;">
                  <input placeholder="${esc(d.promo_placeholder || 'Enter coupon code')}"
                    style="flex:1;border:1.5px solid #e2e8f0;border-radius:8px;
                      padding:10px 14px;font-size:13px;outline:none;" />
                  <button style="background:#0f172a;color:#fff;border:none;padding:10px 16px;
                    border-radius:8px;font-size:13px;cursor:pointer;">Apply</button>
                </div>
                <button style="width:100%;background:${AC};color:#fff;border:none;padding:15px;
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
    cat: { label: 'Checkout', icon: '💳', sub: 'Checkout form and order summary', bg: '#ffe4e6' },

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
        <div class="section section-alt">
          <div class="container">
            <h2 style="font-size:clamp(24px,3.5vw,38px);font-weight:800;color:#0f172a;
              margin-bottom:36px;">${esc(d.heading || 'Checkout')}</h2>
            <div style="display:grid;grid-template-columns:1.5fr 0.75fr;gap:32px;align-items:start;">
              <div style="display:flex;flex-direction:column;gap:20px;">
                <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;">
                  <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px;">
                    Delivery Address
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                    ${['First Name','Last Name','Phone','Email'].map(lbl => `
                      <input placeholder="${lbl}"
                        style="border:1.5px solid #e2e8f0;border-radius:8px;
                          padding:12px 14px;font-size:13px;outline:none;" />
                    `).join('')}
                    <input placeholder="Address" style="grid-column:1/-1;border:1.5px solid #e2e8f0;
                      border-radius:8px;padding:12px 14px;font-size:13px;outline:none;" />
                    ${['City','PIN Code'].map(lbl => `
                      <input placeholder="${lbl}"
                        style="border:1.5px solid #e2e8f0;border-radius:8px;
                          padding:12px 14px;font-size:13px;outline:none;" />
                    `).join('')}
                  </div>
                </div>
                <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;">
                  <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px;">
                    Payment Method
                  </div>
                  <div style="display:flex;flex-direction:column;gap:10px;">
                    ${payMethods.map((m, i) => `
                      <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;
                        border:1.5px solid ${i === 0 ? AC : '#e2e8f0'};border-radius:10px;
                        cursor:pointer;background:${i === 0 ? '#fff1f2' : '#fff'};">
                        <div style="font-size:22px;">${esc(m.icon || '💳')}</div>
                        <div style="font-size:14px;font-weight:600;color:#0f172a;">
                          ${esc(m.label || 'Payment')}
                        </div>
                        <div style="margin-left:auto;width:16px;height:16px;border-radius:50%;
                          background:${i === 0 ? AC : 'transparent'};
                          border:2px solid ${i === 0 ? AC : '#cbd5e1'};"></div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:16px;padding:24px;">
                <div style="font-size:17px;font-weight:700;color:#0f172a;margin-bottom:20px;">
                  Order Total
                </div>
                ${[['2 items','₹3,297'],['Shipping','₹49'],['Discount','— ₹0']].map(([k,v]) => `
                  <div style="display:flex;justify-content:space-between;
                    font-size:14px;color:#64748b;margin-bottom:12px;">
                    <span>${k}</span><span>${v}</span>
                  </div>
                `).join('')}
                <div style="border-top:1.5px solid #e2e8f0;margin:16px 0;"></div>
                <div style="display:flex;justify-content:space-between;font-size:17px;
                  font-weight:700;color:#0f172a;margin-bottom:24px;">
                  <span>Total</span>
                  <span style="color:${AC};">₹3,346</span>
                </div>
                <button style="width:100%;background:${AC};color:#fff;border:none;padding:15px;
                  border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">
                  ${esc(d.cta_text || 'Place Order')} →
                </button>
                <div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:12px;">
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
