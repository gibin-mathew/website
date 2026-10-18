#!/usr/bin/env python3
"""Builds gibin.in subpages from _build/content/*.html.

Each content file starts with a JSON header inside <!--meta ... -->, then the article HTML.
Run:  python3 _build/build.py      (from the repo root)
Output: projects/, blog/, sitemap.xml. Folders starting with _ are ignored by GitHub Pages.
"""
import json, re, html, os, datetime, pathlib
from figures import HERO, INLINE

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = "https://gibin.in"
CONTENT = ROOT / "_build" / "content"

FONTS = "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,500;112,700;125,800;125,900&family=Instrument+Serif:ital@1&family=Public+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500&display=swap"
ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230B1320'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' dominant-baseline='middle' font-family='Arial,sans-serif' font-weight='800' font-size='28' fill='%23EEF2F8'%3EGM%3C/text%3E%3C/svg%3E"
PERSON = {"@type": "Person", "@id": f"{SITE}/#person", "name": "Gibin Mathew", "url": f"{SITE}/",
          "jobTitle": "Data and Automation Manager", "sameAs": ["https://www.linkedin.com/in/gibinm"]}

CORD = '<button class="cord hint" id="cord" type="button" aria-label="Switch to light theme"><span class="halo" aria-hidden="true"></span><span class="cl"></span><span class="flies" aria-hidden="true"></span><span class="ck"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3Z"/></svg></span><span class="tip" id="cord-tip">pull for day</span></button>'

GOAT = """<script>/* GoatCounter: privacy-friendly stats, live domain only. */
window.goatcounter={no_onload:true};
(function(){if(!/(^|\\.)gibin\\.in$/.test(location.hostname))return;var g=document.createElement('script');g.async=true;g.src='https://gc.zgo.at/count.js';g.setAttribute('data-goatcounter','https://gibin.goatcounter.com/count');
g.onload=function(){try{window.goatcounter.count()}catch(e){}
  if(/[?&](ref|utm_[a-z]+)=/.test(location.search)){try{history.replaceState(null,'',location.pathname+location.hash)}catch(e){}}};
document.body.appendChild(g)})();</script>"""

FOOTER = """<footer class="contact" id="contact">
  <div class="container">
    <div class="inner">
      <div>
        <div class="contact-id"><div class="avatar"><img src="/gibin-mathew.webp" alt="Gibin Mathew" width="360" height="360" loading="lazy"></div></div>
        <h2>Have a process that's still <em>done by hand?</em></h2>
        <p>Happy to talk about automation, data platforms, or getting AI into production without breaking things.</p>
      </div>
      <div class="reach">
        <div class="emailrow"><code id="email">gibin.mat96@gmail.com</code><button class="copy" id="copyBtn" type="button">Copy</button></div>
        <a href="https://www.linkedin.com/in/gibinm" target="_blank" rel="noopener">linkedin.com/in/gibinm ↗</a>
        <a href="/">gibin.in, the full profile →</a>
      </div>
    </div>
    <p class="areas">I work on RPA and workflow automation, config-driven web automation, web scraping, data engineering and ETL, and AI-assisted data validation, mostly in Python, Playwright and Node.js. Based in Chennai, India.</p>
    <div class="foot"><span>Gibin Mathew · RPA &amp; workflow automation · Chennai, India</span><span><a href="/projects/" style="color:inherit">Projects</a> · <a href="/blog/" style="color:inherit">Writing</a></span></div>
  </div>
</footer>"""


OG_VERSION = "v2"   # bump to make WhatsApp/LinkedIn fetch fresh preview images


def og_path(p):
    return f"/og/{p.get('slug') or p['section']}-{OG_VERSION}.jpg"


def og_title(p):
    t = p.get("og_title", p["title"])
    return t if "Gibin Mathew" in t else f"{t} · Gibin Mathew"


def esc(s):
    return html.escape(s, quote=True)


def slugify(t):
    t = re.sub(r"<[^>]+>", "", t).lower()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-")[:60]


def load():
    pages = []
    for f in sorted(CONTENT.glob("*.html")):
        raw = f.read_text()
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->\s*(.*)", raw, re.S)
        meta = json.loads(m.group(1))
        meta["body"] = m.group(2)
        meta.setdefault("updated", meta.get("date"))
        pages.append(meta)
    return pages


def url_of(p):
    return f"/{p['section']}/{p['slug']}/" if p.get("slug") else f"/{p['section']}/"


def words(h):
    t = re.sub(r"<(pre|figure|script|style)[\s\S]*?</\1>", " ", h)
    return len(re.sub(r"<[^>]+>", " ", t).split())


def prep_body(body):
    toc = []
    # <pre data-raw="ts"> ... </pre>: code written as plain text, escaped here
    body = re.sub(r'<pre data-raw="(\w+)">\n?(.*?)</pre>',
                  lambda m: f'<pre><code class="language-{m.group(1)}">{html.escape(m.group(2).rstrip(), quote=False)}</code></pre>', body, flags=re.S)
    def h2(m):
        attrs, inner = m.group(1), m.group(2)
        hid = re.search(r'id="([^"]+)"', attrs)
        hid = hid.group(1) if hid else slugify(inner)
        toc.append((hid, re.sub(r"<[^>]+>", "", inner)))
        return f'<h2 id="{hid}">{inner}</h2>'
    body = re.sub(r"<h2([^>]*)>(.*?)</h2>", h2, body, flags=re.S)
    body = re.sub(r"<!--fig:(\w+)-->", lambda m: INLINE[m.group(1)], body)
    return body, toc


def card(p, by_url):
    m = f'<span class="m">{esc(p["metric"])}</span>' if p.get("metric") else ""
    where = p.get("where", "Writing" if p["section"] == "blog" else "")
    right = p.get("date_label") or (fmt_date(p["date"]) if p["section"] == "blog" else p.get("year", ""))
    return (f'<a class="pcard rv" href="{url_of(p)}"><span class="w"><span>{esc(where)}</span><span>{esc(right)}</span></span>'
            f'<h3>{p["card_title"] if p.get("card_title") else esc(p["h1_plain"])}</h3>{m}<p>{esc(p["summary"])}</p><span class="go">{"Read the case study" if p["section"]=="projects" else "Read the post"}</span></a>')


def fmt_date(d):
    return datetime.date.fromisoformat(d).strftime("%-d %b %Y")


def nav(active):
    # Same items, same order, same labels as the homepage menu.
    items = [("/#approach", "Approach", ""), ("/projects/", "Projects", "projects"), ("/blog/", "Writing", "blog"),
             ("/#recommendations", "Recommendations", ""), ("/#career", "Career", ""), ("#contact", "Contact", "")]
    return "".join(f'<a href="{h}"{" aria-current=\"page\"" if a and a == active else ""}>{t}</a>' for h, t, a in items)


def schema(p, url, all_pages):
    crumbs = [("Home", f"{SITE}/")]
    crumbs.append(("Projects" if p["section"] == "projects" else "Writing", f"{SITE}/{p['section']}/"))
    if p.get("slug"):
        crumbs.append((p["h1_plain"], SITE + url))
    bc = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(crumbs)]}
    img = f"{SITE}{og_path(p)}"
    if not p.get("slug"):
        kids = [q for q in all_pages if q["section"] == p["section"] and q.get("slug")]
        main = {"@type": "Blog" if p["section"] == "blog" else "CollectionPage", "@id": SITE + url + "#page", "url": SITE + url,
                "name": p["title"], "description": p["description"], "inLanguage": "en", "author": {"@id": f"{SITE}/#person"},
                "isPartOf": {"@id": f"{SITE}/#website"}}
        if p["section"] == "blog":
            main["blogPost"] = [{"@type": "BlogPosting", "headline": q["h1_plain"], "url": SITE + url_of(q), "datePublished": q["date"]} for q in kids]
        else:
            main["mainEntity"] = {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": SITE + url_of(q), "name": q["h1_plain"]} for i, q in enumerate(kids)]}
        graph = [main, bc]
    else:
        art = {"@type": "BlogPosting" if p["section"] == "blog" else "Article", "@id": SITE + url + "#article",
               "headline": p["h1_plain"][:110], "description": p["description"], "url": SITE + url,
               "mainEntityOfPage": SITE + url, "datePublished": p["date"], "dateModified": p["updated"],
               "author": PERSON, "publisher": {"@id": f"{SITE}/#person"}, "image": img, "inLanguage": "en",
               "keywords": ", ".join(p.get("keywords", [])), "wordCount": words(p["body"]),
               "isPartOf": {"@id": f"{SITE}/#website"}}
        if p.get("about"):
            art["about"] = [{"@type": "Thing", "name": a} for a in p["about"]]
        graph = [art, bc]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)


def render(p, all_pages):
    url = url_of(p)
    by_url = {url_of(q): q for q in all_pages}
    body, toc = prep_body(p["body"])
    hub = not p.get("slug")
    section_name = "Projects" if p["section"] == "projects" else "Writing"
    crumbs = f'<ol class="crumbs"><li><a href="/">gibin.in</a></li><li>{"<a href=\"/" + p["section"] + "/\">" + section_name + "</a>" if not hub else section_name}</li>{"" if hub else "<li>" + esc(p.get("crumb", p["h1_plain"])) + "</li>"}</ol>'
    rt = max(1, round(words(p["body"]) / 220))
    if p["section"] == "blog" and not hub:
        by = f'<div class="byline"><div class="avatar"><img src="/gibin-mathew.webp" alt="" width="40" height="40"></div><span>By <a href="/" rel="author">Gibin Mathew</a></span><span class="dot">·</span><time datetime="{p["date"]}">{fmt_date(p["date"])}</time><span class="dot">·</span><span>{rt} min read</span></div>'
    elif not hub:
        by = f'<div class="byline"><div class="avatar"><img src="/gibin-mathew.webp" alt="" width="40" height="40"></div><span>Case study by <a href="/" rel="author">Gibin Mathew</a></span><span class="dot">·</span><span>Updated <time datetime="{p["updated"]}">{fmt_date(p["updated"])}</time></span></div>'
    else:
        by = ""
    facts = "".join(f"<span>{f}</span>" for f in p.get("facts", []))
    facts = f'<div class="ph-facts">{facts}</div>' if facts else ""
    fig = HERO.get(p.get("fig", ""), "")
    head_grid = "ph" if fig else "ph solo"

    if hub:
        kids = [q for q in all_pages if q["section"] == p["section"] and q.get("slug")]
        kids.sort(key=lambda q: q.get("order", 99) if p["section"] == "projects" else q["date"], reverse=p["section"] == "blog")
        if p["section"] == "projects":
            listing = '<div class="cards">' + "".join(card(q, by_url) for q in kids) + "</div>"
        else:
            listing = '<div class="list">' + "".join(
                f'<a class="li rv" href="{url_of(q)}"><time datetime="{q["date"]}">{fmt_date(q["date"])}</time><div><h3>{esc(q["h1_plain"])}</h3><p>{esc(q["summary"])}</p></div><span class="rt">{max(1, round(words(q["body"]) / 220))} min</span></a>' for q in kids) + "</div>"
        main = f'<main><section class="sec"><div class="container">{body}{listing}</div></section>'
        if p.get("also"):
            main += f'<section class="sec"><div class="container">{p["also"]}</div></section>'
        main += "</main>"
    else:
        toc_html = "".join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i, t in toc)
        side = p.get("side", "")
        main = (f'<main><div class="container"><div class="doc"><nav class="toc" aria-label="On this page"><b>On this page</b><ol>{toc_html}</ol>'
                f'<div class="side">{side}<a href="/{p["section"]}/">← All {section_name.lower()}</a></div></nav>'
                f'<article class="prose">{body}</article></div></div>')
        rel = [by_url[r] for r in p.get("related", []) if r in by_url]
        if rel:
            main += f'<section class="related sec"><div class="container"><div class="sec-h"><div><span class="label">Keep reading</span><h2 class="h-sec">Related work</h2></div></div><div class="cards three">{"".join(card(q, by_url) for q in rel)}</div></div></section>'
        main += "</main>"

    og = f"{SITE}{og_path(p)}"
    ogtype = "article" if not hub else "website"
    art_meta = ""
    if not hub:
        art_meta = f'<meta property="article:published_time" content="{p["date"]}"><meta property="article:modified_time" content="{p["updated"]}"><meta property="article:author" content="{SITE}/">'
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(p["title"])}</title>
<meta name="description" content="{esc(p["description"])}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="author" content="Gibin Mathew">
<link rel="canonical" href="{SITE}{url}">
<meta property="og:type" content="{ogtype}">
<meta property="og:url" content="{SITE}{url}">
<meta property="og:title" content="{esc(og_title(p))}">
<meta property="og:description" content="{esc(p["description"])}">
<meta property="og:site_name" content="Gibin Mathew">
<meta property="og:locale" content="en_IN">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
{art_meta}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(og_title(p))}">
<meta name="twitter:description" content="{esc(p["description"])}">
<meta name="twitter:image" content="{og}">
<link rel="icon" href="{ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/pages.css">
<link rel="stylesheet" href="/assets/dock.css">
<script type="application/ld+json">{schema(p, url, all_pages)}</script>
<script>document.documentElement.classList.add('js');try{{var gmT=localStorage.getItem('gm-theme');if(gmT==='light'||gmT==='dark')document.documentElement.setAttribute('data-theme',gmT)}}catch(e){{}}</script>
</head>
<body>
<div class="progress" id="progress"></div>
<header class="band">
  <div class="container">
    <div class="topbar">
      <a class="mark" href="/" aria-label="Gibin Mathew, home">GM<span>.</span></a>
      <nav class="topnav" aria-label="Site">{nav(p["section"])}</nav>
      {CORD}
    </div>
    <div class="{head_grid}">
      <div>
        {crumbs}
        <span class="ph-kicker">{esc(p["kicker"])}</span>
        <h1 class="ph-title">{p["h1"]}</h1>
        <p class="ph-dek">{p["dek"]}</p>
        {facts}
        {by}
      </div>
      {fig}
    </div>
  </div>
</header>
{main}
{FOOTER}
<button class="totop" id="totop" type="button" aria-label="Back to top">↑</button>
<script src="/assets/site.js" defer></script>
<script src="/assets/dock.js" defer></script>
{GOAT}
</body>
</html>
"""


def main():
    pages = load()
    for p in pages:
        p["h1_plain"] = re.sub(r"<[^>]+>", "", p["h1"])
    for p in pages:
        out = ROOT / url_of(p).strip("/") / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(p, pages))
        print("built", url_of(p), words(p["body"]), "words")
    # sitemap: homepage entry kept as-is, subpages appended
    today = datetime.date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
          f'  <url>\n    <loc>{SITE}/</loc>\n    <lastmod>{HOME_LASTMOD}</lastmod>\n    <image:image><image:loc>{SITE}/gibin-mathew.jpg</image:loc></image:image>\n    <image:image><image:loc>{SITE}/og.jpg</image:loc></image:image>\n    <image:image><image:loc>{SITE}/certificate.webp</image:loc></image:image>\n  </url>']
    order = sorted(pages, key=lambda p: (p["section"], bool(p.get("slug")), p.get("order", 0)))
    for p in order:
        sm.append(f'  <url>\n    <loc>{SITE}{url_of(p)}</loc>\n    <lastmod>{p.get("updated") or today}</lastmod>\n    <image:image><image:loc>{SITE}{og_path(p)}</image:loc></image:image>\n  </url>')
    sm.append("</urlset>\n")
    (ROOT / "sitemap.xml").write_text("\n".join(sm))
    build_shortlinks()
    (ROOT / "_build" / "urls.txt").write_text("\n".join([SITE + "/"] + [SITE + url_of(p) for p in order]) + "\n")


HOME_LASTMOD = os.environ.get("HOME_LASTMOD", "2026-10-18")

SHORT_DESC = ("Data & Automation Manager in Chennai. Config-driven RPA across 70+ portals at 94% success, "
              "crawlers worth 168 FTE at S&P Global. Case studies, writing and contact.")


def build_shortlinks():
    """gibin.in/<company> links from resumes: a real 200 page with its own preview card, then on to the homepage."""
    data = json.loads((ROOT / "_build" / "shortlinks.json").read_text())
    for slug, v in data.items():
        if (ROOT / slug).exists() and not (ROOT / slug / ".shortlink").exists():
            continue  # never overwrite a real folder
        d = ROOT / slug; d.mkdir(exist_ok=True)
        (d / ".shortlink").write_text("generated by _build/build.py\n")
        title = "Gibin Mathew · Data & Automation Manager"
        img = f"{SITE}/og/home-{OG_VERSION}.jpg"
        (d / "index.html").write_text(f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="{SITE}/">
<meta name="description" content="{esc(SHORT_DESC)}">
<meta property="og:type" content="profile">
<meta property="og:url" content="{SITE}/{slug}">
<meta property="og:site_name" content="Gibin Mathew">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(SHORT_DESC)}">
<meta property="og:image" content="{img}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Gibin Mathew, Data and Automation Manager, Chennai">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(SHORT_DESC)}">
<meta name="twitter:image" content="{img}">
<style>html,body{{margin:0;height:100%;background:#0B1320;color:#8C99AD;font:14px/1.5 ui-monospace,Menlo,monospace}}body{{display:grid;place-items:center}}a{{color:#EEF2F8}}</style>
<script>location.replace('/?ref=resume&utm_campaign={slug}'+location.hash);</script>
</head>
<body><p>Taking you to <a href="/?ref=resume&amp;utm_campaign={slug}">gibin.in</a>…</p></body>
</html>
""")
    print("short links:", len(data))

if __name__ == "__main__":
    main()
