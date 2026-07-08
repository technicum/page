"""
patch_themes.py
Applies all products/services/jobs block updates to all 14 minisite themes.
Run from the project root: python3 patch_themes.py
"""
import os, re

THEMES_DIR = os.path.join(os.path.dirname(__file__), 'themes')
ALL_THEMES = [
    'biolink-creator',
    'biolink-freelancer', 'biolink-realty', 'biolink-service', 'biolink-shop',
    'finnest-wealth', 'jobs-dark', 'jobs-light', 'jobs-saffron', 'loanbridge-dsa',
    'salon-midnight-noir', 'salon-rose-luxe', 'salon-sage-botanical', 'tradevault-academy'
]

# ── CSS ──────────────────────────────────────────────────────────────────────
PRODUCTS_CSS = """/* ── Products grid – shared ──────────────────────── */
.b-products-grid{border-radius:14px;overflow:hidden;background:{{ _btn_color }}18;}
.pg-acc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;user-select:none;-webkit-user-select:none;background:{{ _btn_color }};}
.pg-acc-head:active{opacity:.85;}
.pg-acc-title{font-size:16px;font-weight:700;color:{{ _btn_text_color }};}
.pg-acc-meta{display:flex;align-items:center;gap:8px;}
.pg-acc-count{font-size:11px;font-weight:500;color:{{ _btn_text_color }};opacity:.75;}
.pg-acc-chevron{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:10px;color:{{ _btn_text_color }};transition:transform .25s ease;flex-shrink:0;}
.pg-acc-body{display:none;padding:8px 8px 10px;}
.pg-acc-body.open{display:block;}
.pg-acc-chevron.open{transform:rotate(180deg);}
/* Layout: list (rows) */
.pg-list{display:flex;flex-direction:column;gap:6px;}
.pg-row{display:flex;align-items:center;gap:12px;background:rgba(128,128,128,0.12);border-radius:10px;padding:14px 12px;}
.pg-thumb{width:58px;height:58px;border-radius:9px;overflow:hidden;flex-shrink:0;background:rgba(128,128,128,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;}
.pg-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.pg-info{flex:1;min-width:0;}
.pg-name{font-size:16px;font-weight:600;line-height:1.3;margin-bottom:3px;}
.pg-desc{font-size:13px;opacity:.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.pg-right{flex-shrink:0;text-align:right;}
.pg-price{font-size:15px;font-weight:700;display:block;color:{{ _btn_color }};}
.pg-compare{font-size:12px;opacity:.45;text-decoration:line-through;display:block;}
.pg-dur{font-size:12px;opacity:.55;display:block;}
.pg-buy{margin-top:6px;display:block;padding:7px 13px;background:{{ _btn_color }};color:{{ _btn_text_color }};border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;text-align:center;border:none;cursor:pointer;font-family:inherit;}
.pg-oos{margin-top:6px;display:block;padding:7px 13px;border-radius:6px;font-size:13px;font-weight:600;text-align:center;opacity:.45;background:rgba(128,128,128,0.15);}
/* Layout: grid (2-col) */
.pg-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
.pg-gc{background:rgba(128,128,128,0.12);border-radius:10px;overflow:hidden;}
.pg-gi{width:100%;aspect-ratio:1;background:rgba(128,128,128,0.15);display:flex;align-items:center;justify-content:center;font-size:28px;overflow:hidden;}
.pg-gi img{width:100%;height:100%;object-fit:cover;display:block;}
.pg-gb{padding:8px 10px 10px;}
.pg-gn{font-size:13px;font-weight:600;line-height:1.3;margin-bottom:4px;}
.pg-gp{font-size:14px;font-weight:700;color:{{ _btn_color }};display:block;}
.pg-gcp{font-size:10px;opacity:.45;text-decoration:line-through;display:block;}
.pg-gbtn{display:block;width:100%;margin-top:6px;padding:6px 0;background:{{ _btn_color }};color:{{ _btn_text_color }};border-radius:6px;font-size:12px;font-weight:600;text-align:center;border:none;cursor:pointer;font-family:inherit;}
.pg-goos{display:block;width:100%;margin-top:6px;padding:6px 0;border-radius:6px;font-size:12px;font-weight:600;text-align:center;opacity:.45;background:rgba(128,128,128,0.15);}
/* Layout: cards (full-width) */
.pg-cards{display:flex;flex-direction:column;gap:8px;}
.pg-card{background:rgba(128,128,128,0.12);border-radius:10px;overflow:hidden;}
.pg-ci{width:100%;height:130px;background:rgba(128,128,128,0.15);display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden;}
.pg-ci img{width:100%;height:100%;object-fit:cover;display:block;}
.pg-cb{padding:10px 12px 12px;}
.pg-cn{font-size:16px;font-weight:700;margin-bottom:4px;}
.pg-cd{font-size:13px;opacity:.65;line-height:1.4;margin-bottom:8px;}
.pg-cf{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.pg-cp{font-size:16px;font-weight:700;color:{{ _btn_color }};}
.pg-ccp{font-size:11px;opacity:.45;text-decoration:line-through;display:block;}
.pg-cbtn{padding:8px 16px;background:{{ _btn_color }};color:{{ _btn_text_color }};border-radius:6px;font-size:13px;font-weight:600;border:none;cursor:pointer;font-family:inherit;white-space:nowrap;}
.pg-coos{padding:8px 16px;border-radius:6px;font-size:13px;font-weight:600;text-align:center;opacity:.45;background:rgba(128,128,128,0.15);white-space:nowrap;}
/* ── Services grid ───────────────────────────────────────────── */
.b-services-grid{border-radius:14px;overflow:hidden;background:{{ _btn_color }}18;}
.sv-acc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;user-select:none;-webkit-user-select:none;background:{{ _btn_color }};}
.sv-acc-head:active{opacity:.85;}
.sv-acc-title{font-size:16px;font-weight:700;color:{{ _btn_text_color }};}
.sv-acc-meta{display:flex;align-items:center;gap:8px;}
.sv-acc-count{font-size:11px;font-weight:500;color:{{ _btn_text_color }};opacity:.75;}
.sv-acc-chevron{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:10px;color:{{ _btn_text_color }};transition:transform .25s ease;flex-shrink:0;}
.sv-acc-body{display:none;padding:8px 8px 10px;}
.sv-acc-body.open{display:block;}
.sv-acc-chevron.open{transform:rotate(180deg);}
.sv-list{display:flex;flex-direction:column;gap:6px;}
.sv-row{display:flex;align-items:center;gap:12px;background:rgba(128,128,128,0.12);border-radius:10px;padding:14px 12px;}
.sv-thumb{width:58px;height:58px;border-radius:9px;overflow:hidden;flex-shrink:0;background:rgba(128,128,128,0.15);display:flex;align-items:center;justify-content:center;font-size:24px;}
.sv-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.sv-info{flex:1;min-width:0;}
.sv-name{font-size:16px;font-weight:600;line-height:1.3;margin-bottom:3px;}
.sv-desc{font-size:13px;opacity:.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;}
.sv-dur{font-size:12px;opacity:.55;display:block;margin-top:2px;}
.sv-right{flex-shrink:0;text-align:right;}
.sv-price{font-size:15px;font-weight:700;display:block;color:{{ _btn_color }};}
.sv-book{margin-top:6px;display:block;padding:7px 13px;background:{{ _btn_color }};color:{{ _btn_text_color }};border-radius:6px;font-size:13px;font-weight:600;text-decoration:none;text-align:center;border:none;cursor:pointer;font-family:inherit;}
/* ── Jobs grid ───────────────────────────────────────────────── */
.b-jobs-grid{border-radius:14px;overflow:hidden;background:{{ _btn_color }}18;}
.jb-acc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;cursor:pointer;user-select:none;-webkit-user-select:none;background:{{ _btn_color }};}
.jb-acc-head:active{opacity:.85;}
.jb-acc-title{font-size:16px;font-weight:700;color:{{ _btn_text_color }};}
.jb-acc-meta{display:flex;align-items:center;gap:8px;}
.jb-acc-count{font-size:11px;font-weight:500;color:{{ _btn_text_color }};opacity:.75;}
.jb-acc-chevron{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:10px;color:{{ _btn_text_color }};transition:transform .25s ease;flex-shrink:0;}
.jb-acc-body{display:none;padding:8px 8px 10px;}
.jb-acc-body.open{display:block;}
.jb-acc-chevron.open{transform:rotate(180deg);}
.jb-list{display:flex;flex-direction:column;gap:8px;}
.jb-card{background:rgba(128,128,128,0.12);border-radius:10px;padding:14px 12px;}
.jb-top{display:flex;align-items:flex-start;gap:12px;margin-bottom:8px;}
.jb-logo{width:44px;height:44px;border-radius:8px;overflow:hidden;flex-shrink:0;background:rgba(128,128,128,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;}
.jb-logo img{width:100%;height:100%;object-fit:cover;display:block;}
.jb-head{flex:1;min-width:0;}
.jb-title{font-size:16px;font-weight:700;line-height:1.3;margin-bottom:2px;}
.jb-sub{font-size:13px;opacity:.6;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.jb-tags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;}
.jb-tag{font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px;background:rgba(128,128,128,0.15);}
.jb-salary{font-size:14px;font-weight:700;color:{{ _btn_color }};display:block;margin-bottom:8px;}
.jb-apply{display:block;width:100%;padding:8px 0;background:{{ _btn_color }};color:{{ _btn_text_color }};border-radius:6px;font-size:13px;font-weight:600;text-align:center;border:none;cursor:pointer;font-family:inherit;}
"""

SERVICES_BLOCK = """{% when 'services_grid' %}
{% assign _sv_items = settings._products | where: "type", "service" %}
<div class="b-services-grid" id="sv-{{ block.id }}">
  <div class="sv-acc-head" onclick="svToggle('{{ block.id }}')">
    <span class="sv-acc-title">{{ block.heading | default: 'Our Services' }}</span>
    <span class="sv-acc-meta">
      {% if _sv_items and _sv_items.size > 0 %}<span class="sv-acc-count">{{ _sv_items.size }} services</span>{% endif %}
      <span class="sv-acc-chevron" id="sv-chv-{{ block.id }}">&#9660;</span>
    </span>
  </div>
  <div class="sv-acc-body" id="sv-body-{{ block.id }}">
    {% if _sv_items and _sv_items.size > 0 %}
    <div class="sv-list">
      {% for s in _sv_items %}
      <div class="sv-row">
        <div class="sv-thumb">{% if s.image_url != blank and s.image_url != nil %}<img src="{{ s.image_url }}" alt="{{ s.name }}">{% else %}&#128296;{% endif %}</div>
        <div class="sv-info">
          <div class="sv-name">{{ s.name }}</div>
          {% if s.description != blank %}<div class="sv-desc">{{ s.description | truncate: 80 }}</div>{% endif %}
          {% if s.duration != blank %}<span class="sv-dur">&#9201; {{ s.duration }}</span>{% endif %}
        </div>
        <div class="sv-right">
          {% if s.price != blank and s.price != nil %}<span class="sv-price">&#8377;{{ s.price | floor }}</span>{% endif %}
          <button class="sv-book">{{ block.btn_text | default: 'Book' }}</button>
        </div>
      </div>
      {% endfor %}
    </div>
    {% else %}
    <div style="text-align:center;padding:24px 16px;opacity:.45;font-size:13px;">No services added yet</div>
    {% endif %}
  </div>
</div>

"""

JOBS_BLOCK = """{% when 'jobs_grid' %}
{% assign _jb_items = settings._products | where: "type", "job" %}
<div class="b-jobs-grid" id="jb-{{ block.id }}">
  <div class="jb-acc-head" onclick="jbToggle('{{ block.id }}')">
    <span class="jb-acc-title">{{ block.heading | default: 'Open Positions' }}</span>
    <span class="jb-acc-meta">
      {% if _jb_items and _jb_items.size > 0 %}<span class="jb-acc-count">{{ _jb_items.size }} positions</span>{% endif %}
      <span class="jb-acc-chevron" id="jb-chv-{{ block.id }}">&#9660;</span>
    </span>
  </div>
  <div class="jb-acc-body" id="jb-body-{{ block.id }}">
    {% if _jb_items and _jb_items.size > 0 %}
    <div class="jb-list">
      {% for j in _jb_items %}
      <div class="jb-card">
        <div class="jb-top">
          <div class="jb-logo">{% if j.image_url != blank and j.image_url != nil %}<img src="{{ j.image_url }}" alt="{{ j.name }}">{% else %}&#128188;{% endif %}</div>
          <div class="jb-head">
            <div class="jb-title">{{ j.name }}</div>
            {% if j.description != blank %}<div class="jb-sub">{{ j.description | truncate: 60 }}</div>{% endif %}
          </div>
        </div>
        {% if j.duration != blank and j.duration != nil %}
        <div class="jb-tags"><span class="jb-tag">{{ j.duration }}</span></div>
        {% endif %}
        {% if j.price != blank and j.price != nil %}<span class="jb-salary">&#8377;{{ j.price | floor }} / month</span>{% endif %}
        <button class="jb-apply">{{ block.btn_text | default: 'Apply Now' }}</button>
      </div>
      {% endfor %}
    </div>
    {% else %}
    <div style="text-align:center;padding:24px 16px;opacity:.45;font-size:13px;">No positions available</div>
    {% endif %}
  </div>
</div>

"""

TOGGLE_JS = """function pgToggle(blockId){var body=document.getElementById('pg-body-'+blockId);var chv=document.getElementById('pg-chv-'+blockId);if(!body)return;var open=body.classList.contains('open');body.classList.toggle('open',!open);if(chv)chv.classList.toggle('open',!open);}
function svToggle(blockId){var body=document.getElementById('sv-body-'+blockId);var chv=document.getElementById('sv-chv-'+blockId);if(!body)return;var open=body.classList.contains('open');body.classList.toggle('open',!open);if(chv)chv.classList.toggle('open',!open);}
function jbToggle(blockId){var body=document.getElementById('jb-body-'+blockId);var chv=document.getElementById('jb-chv-'+blockId);if(!body)return;var open=body.classList.contains('open');body.classList.toggle('open',!open);if(chv)chv.classList.toggle('open',!open);}
"""

CSS_ANCHOR  = re.compile(r'(/\*\s*──\s*Form link block)', re.IGNORECASE)
FORM_ANCHOR = re.compile(r"(\{%\s*when\s*'form'\s*%\})", re.DOTALL)
JS_ANCHOR   = 'function faqToggle'

for theme in ALL_THEMES:
    path = os.path.join(THEMES_DIR, theme, 'index.liquid')
    if not os.path.exists(path):
        print(f'SKIP  {theme} (not found)')
        continue
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    orig = src

    if '.b-products-grid' not in src:
        src = CSS_ANCHOR.sub(PRODUCTS_CSS + r'\1', src, count=1)

    if "when 'services_grid'" not in src:
        src = FORM_ANCHOR.sub(SERVICES_BLOCK + JOBS_BLOCK + r'\1', src, count=1)

    if 'function pgToggle' not in src or 'function svToggle' not in src:
        if JS_ANCHOR in src:
            src = src.replace(JS_ANCHOR, TOGGLE_JS + '\n' + JS_ANCHOR, 1)

    if src != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(src)
        print(f'OK    {theme}')
    else:
        print(f'NOOP  {theme} (already up to date)')

print('\nDone. Restart PM2: pm2 restart pagezaper')
