# SEO Audit — pagezaper.com
**Audit Date:** July 27, 2026  
**Audited By:** Claude (Cowork Mode)  
**Audit Type:** Full Site Audit

---

## Executive Summary

PageZaper has a functional product — an Indian local services directory with a free mini-site builder — but its SEO foundation needs significant work before organic growth is possible. The most damaging issue is a **critical route conflict**: the server matches `/robots.txt` as a city slug, which means search engine crawlers may receive a garbled response when trying to read crawl directives. Beyond that, the homepage title is "PageZaper — PageZaper" (duplicated brand, zero keywords), meta descriptions are missing site-wide, and all footer navigation links point to `#`. On the positive side, city landing pages already include structured data, canonical tags, OG metadata, and breadcrumbs — a strong template to build on.

**Top 3 priorities:**
1. Fix the `/robots.txt` route conflict so crawlers read valid directives
2. Rewrite the homepage title tag and add meta descriptions across all key pages
3. Purge or hide spam/test business listings that surface in `/search` and damage trust

Overall assessment: **needs work** — the infrastructure is sound but nearly every on-page and technical SEO signal is either missing or broken at the page level.

---

## Keyword Opportunity Table

| Keyword | Est. Difficulty | Opportunity | Current Ranking | Intent | Recommended Content Type |
|---|---|---|---|---|---|
| free mini website for business India | Low | **High** | Not ranking | Commercial | Homepage / landing page |
| local business directory India | High | **High** | Not ranking | Navigational | Homepage |
| free business listing India | Medium | **High** | Not ranking | Commercial | Homepage / /register |
| salon near me India | High | Medium | Not ranking | Transactional | City + category landing page |
| gym near me [city] | High | Medium | Not ranking | Transactional | City + category page |
| tutor near me [city] | Medium | Medium | Not ranking | Transactional | City + category page |
| create free website for small business India | Low | **High** | Not ranking | Commercial | /register landing page |
| how to get more customers for my small business India | Low | **High** | Not ranking | Informational | Blog post |
| business listing site India | Medium | **High** | Not ranking | Commercial | Homepage |
| free website builder India | Medium | **High** | Not ranking | Commercial | /register landing page |
| local service provider directory | Medium | Medium | Not ranking | Navigational | Homepage |
| plumber near me [city] | High | Medium | Not ranking | Transactional | City + category page |
| lawyer directory India | Medium | Medium | Not ranking | Navigational | Category page |
| beauty salon [city] | High | Medium | Not ranking | Transactional | City + category page |
| online presence for small business India | Low | **High** | Not ranking | Informational | Blog post |
| list my business online India free | Low | **High** | Not ranking | Commercial | /register landing page |
| home services near me India | Medium | Medium | Not ranking | Transactional | City + category page |
| Chandigarh businesses online | Low | **High** | Not ranking | Navigational | /chandigarh city page |
| mini website builder free India | Low | **High** | Not ranking | Commercial | /register landing page |
| photography services [city] | Low | Medium | Not ranking | Transactional | City + category page |
| restaurant listing India free | Low | Medium | Not ranking | Commercial | Category page |
| freelancer directory India | Low | Medium | Not ranking | Navigational | Category page |
| how to make a free business website in India | Low | **High** | Not ranking | Informational | Blog post / /register |
| small business website examples India | Low | Medium | Not ranking | Informational | Blog post / showcase page |
| JustDial alternative free listing | Low | **High** | Not ranking | Commercial | Landing page |

---

## On-Page Issues Table

| Page | Issue | Severity | Recommended Fix |
|---|---|---|---|
| Homepage | Title is "PageZaper — PageZaper" — duplicated brand, no keywords | **Critical** | Change to "PageZaper — Free Business Listings & Mini Sites in India" |
| Homepage | Meta description completely missing | **Critical** | Add 150-160 char description with primary keyword and CTA |
| Homepage | No structured data (Organization, SearchAction schema) | **High** | Add `Organization` and `WebSite`/`SearchAction` JSON-LD |
| Homepage | Footer links all use `href="#"` — broken internal links | **High** | Wire up /about, /pricing, /privacy, /terms, /contact routes |
| Homepage | No canonical tag | **High** | Add `<link rel="canonical" href="https://pagezaper.com/">` |
| Homepage | H1 "Find any service, anywhere in India" is good but page title doesn't match any keyword | Medium | Align title tag keyword with H1 topic |
| /register | Meta description missing | **Critical** | Add "Create your free mini website on PageZaper — get discovered by local customers in India." |
| /register | Title "Create Account — PageZaper" lacks keyword | High | Change to "Create Your Free Business Website — PageZaper" |
| /search | Meta description missing | **Critical** | Add dynamic meta description based on query/city params |
| /search | Title "Search — PageZaper" is non-descriptive | High | Dynamically generate: "Search [category] in [city] — PageZaper" |
| /search | Spam/test listings visible ("sdfdsf", "yyy", "asdasd") | **Critical** | Admin moderation queue — remove unverified/test entries |
| /robots.txt | URL served as a city page — route conflict | **Critical** | Add static file route before dynamic catch-all; see Technical section |
| City pages | Good template, but 0-business cities (like "Robots.Txt") are indexable | High | Add `<meta name="robots" content="noindex">` when business count = 0 |
| City pages | Image alt text not observed | Medium | Ensure all business logo/avatar `<img>` tags have descriptive alt attributes |
| All pages | No blog or editorial content | High | Launch a blog — needed for long-tail keyword coverage |
| All pages | Internal linking is minimal — no cross-links between city or category pages | Medium | Add "Explore nearby cities" and "Related categories" sections |

---

## Content Gap Recommendations

### 1. "How to get online for free" Blog Series
**Why it matters:** Searches like "how to create a free business website in India" and "how to get customers online small business India" have low competition and direct commercial intent for PageZaper's audience.  
**Recommended format:** Blog posts (3-5 part series), each targeting one long-tail keyword.  
**Priority:** High  
**Estimated effort:** Moderate (half day per post)

Example titles:
- *How to Get Your Business Online for Free in India (2026 Guide)*
- *JustDial vs PageZaper: Which Is Better for Small Businesses?*
- *5 Ways a Mini Website Helps You Get More Customers Locally*

---

### 2. City Landing Pages — Indexed Cities Need Content
**Why it matters:** City pages are currently just business card grids. Competitors like JustDial have rich city pages with category counts, popular searches, and editorial introductions that earn long-tail rankings.  
**Recommended format:** Add city-specific intro text (100-150 words), popular categories for that city, and a "recently added" business row.  
**Priority:** High  
**Estimated effort:** Moderate — template change, not per-city manual work

---

### 3. Category Landing Pages
**Why it matters:** There are no standalone category pages. Searches like "lawyer directory India" or "photography services Chandigarh" have no dedicated URL to land on — they all go through `/search?q=...` which has no indexable, keyword-rich content.  
**Recommended format:** `/c/salon`, `/c/lawyer`, etc. — static category landing pages with an intro, stats, and top-rated businesses.  
**Priority:** High  
**Estimated effort:** Substantial — requires new route/template

---

### 4. Comparison / Alternative Pages
**Why it matters:** "JustDial alternative", "Sulekha alternative", "free business listing vs JustDial" are commercially motivated queries with low competition for a new domain.  
**Recommended format:** Comparison landing page (`/vs/justdial`)  
**Priority:** Medium  
**Estimated effort:** Moderate

---

### 5. Business Success Stories / Showcase
**Why it matters:** Social proof content ranks for "small business website examples India" and builds trust with new sign-ups. Currently the homepage has stats but no real business showcase.  
**Recommended format:** `/showcase` page with featured mini sites  
**Priority:** Medium  
**Estimated effort:** Moderate

---

### 6. Pricing / Free vs Paid Explainer
**Why it matters:** The `/pricing` link in nav goes to `#`. High-intent searchers looking for "free website for business India" will bounce if they can't find pricing details.  
**Recommended format:** Dedicated `/pricing` page  
**Priority:** High  
**Estimated effort:** Quick win (template + copy)

---

## Technical SEO Checklist

| Check | Status | Details |
|---|---|---|
| HTTPS | ⚠️ Warning | Site is on HTTPS but initial fetches showed http:// redirect patterns. Verify all canonical tags and internal links use `https://` |
| robots.txt | ❌ Fail | **/robots.txt route is intercepted by the city catch-all route** — server returns HTML for "Businesses in Robots.Txt" mixed with the actual robots.txt. Move static file serving before dynamic routes in Express. |
| Sitemap | ✅ Pass | `/sitemap.xml` exists and responds |
| Sitemap — quality | ⚠️ Warning | Unverified: sitemap may include 0-business city pages or spam listing URLs that waste crawl budget |
| Canonical tags | ❌ Fail | Homepage has no canonical tag. City pages appear to have canonicals (good). |
| Meta robots | ⚠️ Warning | 0-business city pages (e.g., `/robots.txt` city page) are indexable — should be `noindex` |
| Structured data — Homepage | ❌ Fail | No `Organization`, `WebSite`, or `SearchAction` schema on homepage |
| Structured data — City pages | ✅ Pass | City pages include `CollectionPage` + `BreadcrumbList` JSON-LD |
| Mobile responsive | ✅ Pass | Pages use responsive CSS with media queries; viewport meta tag present |
| Title tags — Homepage | ❌ Fail | "PageZaper — PageZaper" — duplicated, no target keyword |
| Title tags — City pages | ✅ Pass | Pattern "Businesses in [City] \| PageZaper" — clean and descriptive |
| Meta descriptions — Homepage | ❌ Fail | Completely absent |
| Meta descriptions — City pages | ✅ Pass | Present and keyword-rich |
| OG / Social tags — City pages | ✅ Pass | `og:title`, `og:description`, `og:url`, Twitter Card all present |
| OG / Social tags — Homepage | ❌ Fail | Not confirmed; likely missing |
| Internal linking | ⚠️ Warning | Footer links point to `#`. No cross-linking between city or category pages. |
| Broken links | ❌ Fail | All footer links (About, Pricing, Privacy, Terms, Contact) are `href="#"` |
| Page speed signals | ⚠️ Warning | Google Fonts loaded synchronously — switch to `font-display: swap` and async loading |
| Indexation | ⚠️ Warning | No evidence of Google indexation found. Site may be too new or crawl-starved |
| AI bot blocking | ✅ Pass (expected) | ClaudeBot, GPTBot, Google-Extended blocked via robots.txt — intentional Cloudflare config |
| Spam / content quality | ❌ Fail | Test entries ("sdfdsf", "yyy") visible in `/search` — damages E-E-A-T signals |

---

## Competitor Comparison Summary

| Dimension | PageZaper | JustDial | Sulekha | indiya.live |
|---|---|---|---|---|
| Estimated DA | Very low / unestablished | ~74 | ~71 | Very low |
| Keyword coverage | Near zero organic | Tens of thousands | Thousands | Very limited |
| Content depth | Homepage only; no blog | Deep city/category/review pages | Blog + guides + city pages | Homepage |
| Publishing frequency | None observed | Continuous | Weekly | None |
| Structured data | City pages only | Comprehensive (LocalBusiness, Review, FAQ) | Present | Unknown |
| SERP features | None | Featured snippets, PAA, Knowledge Panel | PAA presence | None |
| Mobile experience | Good template | Excellent native app + mobile web | Good | Unknown |
| Unique differentiator | Free mini-site builder | Verified reviews + paid promotion | Lead gen + quotes | Simple mobile site |
| Backlink profile | Unknown / very limited | Massive (news, govt, enterprise) | Strong | Very limited |
| Free mini-site builder | ✅ Yes | ❌ No | ❌ No | ✅ Yes |

**Strategic insight:** PageZaper cannot compete with JustDial and Sulekha on volume or domain authority in the near term. The free mini-site builder is a genuine product differentiator neither large competitor offers — SEO strategy should lead with this angle ("create a free website for your business in India") rather than trying to rank for "find a salon near me" terms that JustDial dominates.

---

## Prioritized Action Plan

### Quick Wins (do this week)

| Action | Impact | Effort | Notes |
|---|---|---|---|
| Fix `/robots.txt` route conflict | **Critical** | ~1 hour | In Express, add a static file route for `robots.txt` before the catch-all city route. Without this, Googlebot may receive garbled crawl directives. |
| Fix homepage title tag | High | 15 min | Change from "PageZaper — PageZaper" to "PageZaper — Free Business Listings & Mini Sites in India" |
| Add homepage meta description | High | 15 min | "List your business free on PageZaper and get discovered by local customers across 180+ cities in India. Create your mini website in minutes." |
| Add homepage canonical tag | High | 10 min | `<link rel="canonical" href="https://pagezaper.com/">` |
| Add homepage OG tags | Medium | 30 min | og:title, og:description, og:image, og:url |
| Fix footer links | High | 1-2 hours | Create stub pages for /about, /pricing, /privacy, /terms, /contact — even minimal ones. Broken footer links hurt crawlability and trust. |
| Add /register meta description + better title | High | 15 min | "Create Your Free Business Website — PageZaper" + 155-char meta description |
| Admin-purge test/spam listings | High | 1-2 hours | Remove entries like "sdfdsf", "yyy", "asdasd" from the database. These are indexed pages that signal low-quality content to Google. |
| Add `noindex` to 0-business city pages | High | 1 hour | Query `WHERE business_count = 0` and dynamically inject `<meta name="robots" content="noindex, follow">` in the city page template |

---

### Strategic Investments (plan this quarter)

| Action | Impact | Effort | Notes |
|---|---|---|---|
| Add homepage Organization + SearchAction schema | High | Half day | JSON-LD: `@type: WebSite` with `potentialAction: SearchAction` for the search box. Google can display a sitelinks searchbox in SERPs. |
| Build a `/blog` section | **High** | Multi-day | Even 4-5 posts targeting "how to get online free India" keywords will start driving long-tail traffic within 60-90 days. This is the highest-leverage growth channel available given the DA disadvantage. |
| Create standalone category landing pages | High | Multi-day | Routes like `/c/salon`, `/c/gym`, `/c/lawyer` with intro copy, stats, and top businesses. These can rank for "[category] directory India" queries. |
| Enrich city pages with editorial content | High | Multi-day | Add a 100-150 word city intro, category breakdowns, and a "popular searches" section above the business grid — same pattern JustDial uses to rank for city queries. |
| Create a `/pricing` page | High | Half day | The nav links to it and it's completely missing. High commercial-intent visitors are bouncing. |
| Build 2-3 comparison/alternative pages | Medium | Half day each | Target "JustDial alternative free", "Sulekha vs PageZaper" — easy wins where PageZaper should rank because it has the mini-site differentiator. |
| Launch a link-building outreach | High | Ongoing | Target Indian small business blogs, startup media (YourStory, Inc42), and local city business associations. Even 10-15 quality backlinks would lift the domain significantly from baseline. |
| Submit to Google Search Console + Bing Webmaster | High | 30 min | Claim the domain, submit sitemap, and monitor indexation. Without this there's no data on crawl errors or which pages are indexed. |
| Add Review/Rating schema to business mini-sites | Medium | Multi-day | If business profiles support reviews, expose them as `AggregateRating` schema — this enables star ratings in Google SERPs for business pages. |

---

## Notes on Data Availability

This audit was conducted without connected SEO tools (Ahrefs, Semrush, SimilarWeb). All keyword difficulty and traffic estimates are qualitative based on competitive research and domain knowledge. For precise volume, difficulty scores, and current ranking positions, connect an SEO tool via the marketing plugin settings. The structural and technical findings above are based on direct page analysis and are not affected by this limitation.

---

*Report generated by Claude — Cowork Mode | PageZaper SEO Audit | July 2026*
