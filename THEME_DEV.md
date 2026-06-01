# PageZapper Theme Development Guide

Build your own theme for PageZapper. No access to core code required — just a folder with two files.

---

## Quick Start

```
themes/
  my-theme/
    theme.json       ← required: metadata + section/field schema
    index.liquid     ← required: Liquid template that renders the site
    assets/
      theme.css      ← optional: your own styles (auto-served)
      theme.js       ← optional: your own JS
    preview.png      ← optional: 800×600 screenshot shown in theme picker
```

Create your folder inside `themes/`, restart the server — your theme appears automatically in the picker.

---

## theme.json

This is the contract between your theme and the builder UI. The builder reads your `sections` array to know what fields to show. **You define the sections. Core never needs to change.**

```json
{
  "name": "My Theme",
  "slug": "my-theme",
  "author": "Your Name",
  "version": "1.0",
  "description": "One-line description shown in the theme picker.",
  "tags": ["light", "serif", "minimal"],
  "for": ["all"],
  "order": 10,

  "settings": {
    "colors": [
      { "id": "blue",   "label": "Blue",   "hex": "#2563eb" },
      { "id": "green",  "label": "Green",  "hex": "#16a34a" },
      { "id": "purple", "label": "Purple", "hex": "#7c3aed" }
    ],
    "fonts": [
      { "id": "sans",  "label": "Sans-serif" },
      { "id": "serif", "label": "Serif" }
    ]
  },

  "sections": [
    {
      "id": "hero",
      "label": "Hero Banner",
      "emoji": "🌟",
      "description": "Shown as a tooltip in the builder.",
      "fields": [
        { "id": "headline",   "label": "Headline",    "type": "text",     "default": "Welcome" },
        { "id": "subheading", "label": "Subheading",  "type": "textarea", "default": "" },
        { "id": "btn_text",   "label": "Button Text", "type": "text",     "default": "Get Started" },
        { "id": "btn_link",   "label": "Button URL",  "type": "url",      "default": "#contact" }
      ]
    },
    {
      "id": "services",
      "label": "Services",
      "emoji": "⚡",
      "fields": [
        { "id": "title", "label": "Section Title", "type": "text", "default": "What We Offer" },
        {
          "id": "items",
          "label": "Service Cards",
          "type": "list",
          "item_fields": [
            { "id": "emoji", "label": "Icon",        "type": "text",     "default": "✨" },
            { "id": "name",  "label": "Name",        "type": "text",     "default": "Service" },
            { "id": "desc",  "label": "Description", "type": "textarea", "default": "" }
          ]
        }
      ]
    }
  ]
}
```

### `for` — which site types show this theme
`"all"` shows it for everyone. Or limit to: `"business"`, `"portfolio"`, `"freelancer"`, `"product"`, `"links"`.

### `order` — position in the theme picker
Lower numbers appear first.

---

## Field Types

| Type        | Builder renders          | Liquid value              |
|-------------|--------------------------|---------------------------|
| `text`      | Single-line input        | String                    |
| `textarea`  | Multi-line textarea      | String                    |
| `richtext`  | Multi-line textarea      | String (plain for now)    |
| `url`       | URL input (validated)    | String                    |
| `email`     | Email input              | String                    |
| `tel`       | Phone input              | String                    |
| `list`      | Repeating item group     | Array of objects          |

For `list` fields, define `item_fields` — an array of the sub-field definitions above.

---

## index.liquid — Template Variables

The engine is [LiquidJS](https://liquidjs.com/). Your template receives:

```
site.title         → Site name
site.subdomain     → The subdomain slug
site.url           → Full public URL

settings.theme         → Active color id (e.g. "blue")
settings.accent_color  → Resolved hex value (e.g. "#2563eb")
settings.site_type     → "business" | "portfolio" | etc.

theme.slug         → Your theme's slug
theme.assetsUrl    → URL prefix to your assets/ folder
theme.colors       → Map of color id → hex (all colors you declared)

sections           → Array of active sections (added by the user in builder)
  section.id       → Matches a section id from your schema
  section.fields   → Object with field values keyed by field id

site_type          → Same as settings.site_type (shorthand)
city               → User's city (legacy, may be empty)
app_name           → "PageZapper"
app_url            → Platform URL
```

### Built-in filters

```liquid
{{ f.phone | wa }}          → strips non-digits (for wa.me links)
{{ settings.theme | hex }}  → resolves color id to hex from your palette
```

---

## Rendering Sections

Iterate over `sections` and render based on `section.id`:

```liquid
{% for section in sections %}
  {% assign f = section.fields %}

  {% if section.id == 'hero' %}
    <h1>{{ f.headline }}</h1>
    <p>{{ f.subheading }}</p>
    <a href="{{ f.btn_link }}">{{ f.btn_text }}</a>

  {% elsif section.id == 'services' %}
    <h2>{{ f.title }}</h2>
    {% for item in f.items %}
      <div>{{ item.emoji }} {{ item.name }} — {{ item.desc }}</div>
    {% endfor %}

  {% elsif section.id == 'contact' %}
    {% if f.phone != '' and f.phone != nil %}
      <a href="tel:{{ f.phone }}">{{ f.phone }}</a>
    {% endif %}
    {% if f.whatsapp != '' and f.whatsapp != nil %}
      <a href="https://wa.me/{{ f.whatsapp | wa }}">WhatsApp</a>
    {% endif %}
  {% endif %}

{% endfor %}
```

You only need to handle sections your theme declares. Sections the user doesn't add won't appear in the `sections` array.

---

## Using Your Assets

Reference your CSS/JS via the `theme.assetsUrl` variable:

```liquid
<link rel="stylesheet" href="{{ theme.assetsUrl }}/theme.css">
<script src="{{ theme.assetsUrl }}/theme.js"></script>
```

Files in your `assets/` folder are served automatically at `/themes/your-slug/assets/`.

---

## Using Theme Colors

Use `settings.accent_color` for the main accent (already resolved to hex):

```liquid
<style>
  :root { --accent: {{ settings.accent_color }}; }
</style>
```

Or look up any color from your palette:

```liquid
{{ 'blue' | hex }}   → "#2563eb"
{{ settings.theme | hex }}  → resolves the user's chosen color
```

---

## Defining Custom Sections

You can define sections with any `id` — they don't have to match PageZapper's built-in ones. The builder UI is entirely driven by your schema:

```json
{
  "id": "pricing",
  "label": "Pricing Table",
  "emoji": "💰",
  "fields": [
    { "id": "title", "label": "Heading", "type": "text", "default": "Simple Pricing" },
    {
      "id": "plans",
      "label": "Plans",
      "type": "list",
      "item_fields": [
        { "id": "name",  "label": "Plan Name", "type": "text", "default": "Pro" },
        { "id": "price", "label": "Price",     "type": "text", "default": "$9/mo" },
        { "id": "desc",  "label": "What's included", "type": "textarea", "default": "" }
      ]
    }
  ]
}
```

Then in your Liquid:
```liquid
{% if section.id == 'pricing' %}
  <h2>{{ f.title }}</h2>
  {% for plan in f.plans %}
    <div>{{ plan.name }} — {{ plan.price }}</div>
    <p>{{ plan.desc }}</p>
  {% endfor %}
{% endif %}
```

---

## Submitting a Theme

To distribute your theme:
1. Zip the entire theme folder (`my-theme/`)
2. The site owner drops it into their `themes/` directory and restarts the server
3. No code changes to core are needed

---

## Tips

- Keep `index.liquid` self-contained — inline your CSS in `<style>` tags for portability
- Use Google Fonts via `<link>` in your `<head>` (the platform doesn't restrict external fonts)
- Test with the live preview in the builder (it hot-reloads on save)
- Handle empty fields gracefully: `{% if f.phone != '' and f.phone != nil %}`
- The `| default: 'fallback'` filter is your friend
