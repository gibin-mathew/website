#!/usr/bin/env python3
"""Renders the 1200x630 link-preview cards.

  og/<page>-v2.jpg   one per case study, post and index: title on the left, the page's own figure on the right
  og/home-v2.jpg     the homepage and channel short links (/cv, /linkedin ...): photo card

Needs: Playwright (Python), the site served locally, local copies of the fonts.
  python3 -m http.server 8765          (from the repo root, in another terminal)
  FONTS=/path/to/node_modules BASE=http://localhost:8765 python3 _build/og.py
"""
import os, re, sys, json, html, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import build
from playwright.sync_api import sync_playwright

ROOT = build.ROOT
V = build.OG_VERSION
BASE = os.environ.get("BASE", "http://localhost:8765")
NM = pathlib.Path(os.environ.get("FONTS", "node_modules"))
TMP = ROOT / "_build" / "_og"
FACES = f"""
@font-face{{font-family:Archivo;src:url(file://{NM}/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2) format('woff2');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'Instrument Serif';font-style:italic;src:url(file://{NM}/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2)}}
@font-face{{font-family:'JetBrains Mono';src:url(file://{NM}/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2)}}
@font-face{{font-family:'Public Sans';font-weight:500;src:url(file://{NM}/@fontsource/public-sans/files/public-sans-latin-500-normal.woff2)}}
@font-face{{font-family:'Public Sans';font-weight:700;src:url(file://{NM}/@fontsource/public-sans/files/public-sans-latin-600-normal.woff2)}}
"""
BASE_CSS = FACES + """
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;color:#EEF2F8;font-family:'Public Sans',sans-serif;position:relative;
  background:radial-gradient(760px 480px at 100% 0%,#1C3263 0%,transparent 62%),radial-gradient(520px 340px at 0% 100%,#132036 0%,transparent 70%),#0B1320}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(140,153,173,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(140,153,173,.07) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(90deg,transparent 20%,#000 70%)}
.mark{font:900 30px Archivo;font-stretch:125%;letter-spacing:-.01em}.mark span{color:#6F95FF}
.kick{font:500 17px 'JetBrains Mono';letter-spacing:.14em;text-transform:uppercase;color:#F2A93B}
h1{font-family:Archivo;font-stretch:125%;font-weight:800;letter-spacing:-.025em;line-height:1.03}
h1 em{font-family:'Instrument Serif';font-style:italic;font-weight:400;font-stretch:100%;color:#F2A93B;letter-spacing:-.01em}
.who{display:flex;align-items:center;gap:14px;font-size:19px;color:#8C99AD}.who b{color:#EEF2F8;font-weight:700}
.who img{width:50px;height:50px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #22304A}
.url{font:500 18px 'JetBrains Mono';color:#6F95FF}
"""

def fit_title(t):
    n = len(re.sub(r"<[^>]+>", "", t))
    return 64 if n < 34 else 56 if n < 52 else 48 if n < 72 else 42


def page_card(p, fig_png, extra_right=""):
    avatar = (ROOT / "gibin-mathew.jpg").as_uri()
    url = "gibin.in" + build.url_of(p).rstrip("/")
    right = f'<div class="shot"><img src="{fig_png.as_uri()}"></div>' if fig_png else extra_right
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
.wrap{{position:relative;display:grid;grid-template-columns:600px 1fr;gap:40px;height:100%;padding:56px 0 48px 64px}}
.l{{display:flex;flex-direction:column;min-width:0}}
.l h1{{margin-top:34px;font-size:{fit_title(p['h1'])}px}}
.l .who{{margin-top:auto}}
.l .url{{margin-top:14px}}
.shot{{align-self:center;margin-right:-40px;border-radius:22px;overflow:hidden;box-shadow:0 40px 90px -20px rgba(0,0,0,.75),0 0 0 1px #22304A;transform:perspective(1400px) rotateY(-9deg) rotateX(2deg);transform-origin:left center;max-height:540px}}
.shot img{{display:block;width:560px}}
.list{{align-self:center;display:grid;gap:14px;margin-right:56px}}
.list div{{border:1px solid #22304A;border-radius:16px;padding:18px 20px;background:rgba(255,255,255,.035)}}
.list span{{display:block;font:500 13px 'JetBrains Mono';color:#8C99AD;letter-spacing:.06em;text-transform:uppercase}}
.list b{{display:block;margin-top:6px;font:700 21px/1.25 'Public Sans'}}
</style></head><body><div class="grid"></div>
<div class="wrap"><div class="l"><div class="mark">GM<span>.</span></div><div class="kick" style="margin-top:28px">{html.escape(p['kicker'])}</div>
<h1>{p['h1']}</h1>
<div class="who"><img src="{avatar}"><span><b>Gibin Mathew</b> · RPA &amp; data automation · Chennai</span></div>
<div class="url">{url}</div></div>{right}</div></body></html>"""


def person_card(url, company=None):
    photo = (ROOT / "gibin-mathew.jpg").as_uri()
    shared = f'<div class="for">Shared with the <b>{html.escape(company)}</b> team</div>' if company else ""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE_CSS}
.wrap{{position:relative;display:grid;grid-template-columns:1fr 360px;gap:40px;height:100%;padding:58px 72px 52px}}
.l{{display:flex;flex-direction:column}}
h1{{font-size:76px;margin-top:40px}}
.role{{margin-top:12px;font-size:28px;color:#B7C2D3}}
.chips{{display:flex;flex-direction:column;gap:12px;margin-top:34px}}
.chips span{{align-self:flex-start;font:500 19px 'JetBrains Mono';border:1.5px solid #22304A;border-radius:999px;padding:9px 18px;background:rgba(255,255,255,.035)}}
.chips b{{color:#4FD08F;font-weight:500}}
.foot{{margin-top:auto;display:flex;align-items:center;gap:18px}}
.for{{font-size:19px;color:#8C99AD;border-left:2px solid #F2A93B;padding-left:14px}}.for b{{color:#EEF2F8}}
.ph{{align-self:center;width:340px;height:340px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px #22304A,0 0 0 12px rgba(111,149,255,.12),0 40px 90px -20px rgba(0,0,0,.7)}}
.ph img{{width:100%;height:100%;object-fit:cover}}
</style></head><body><div class="grid"></div>
<div class="wrap"><div class="l"><div class="mark">GM<span>.</span></div>
<h1>Gibin Mathew</h1><div class="role">Data &amp; Automation Manager · Chennai, India</div>
<div class="chips"><span><b>3,000+</b> portal submissions · <b>94%</b> success</span><span><b>168 FTE</b> automated at S&amp;P Global</span><span><b>9 yrs</b> RPA · data pipelines · AI in production</span></div>
<div class="foot"><div class="url">{html.escape(url)}</div>{shared}</div></div>
<div class="ph"><img src="{photo}"></div></div></body></html>"""


def main():
    pages = build.load()
    for p in pages:
        p["h1_plain"] = re.sub(r"<[^>]+>", "", p["h1"])
    TMP.mkdir(exist_ok=True)
    posts = sorted([q for q in pages if q["section"] == "blog" and q.get("slug")], key=lambda q: q.get("order", 0))
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        site = b.new_page(viewport={"width": 1366, "height": 1000}, color_scheme="dark", reduced_motion="reduce", device_scale_factor=2)
        # serve the Google Fonts stylesheet from local copies so the figure renders in the real fonts
        fd = TMP / "fonts"; fd.mkdir(exist_ok=True)
        import shutil
        files = {"arch.woff2": "@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
                 "serif.woff2": "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
                 "mono4.woff2": "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
                 "mono5.woff2": "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
                 "ps4.woff2": "@fontsource/public-sans/files/public-sans-latin-400-normal.woff2",
                 "ps5.woff2": "@fontsource/public-sans/files/public-sans-latin-500-normal.woff2",
                 "ps6.woff2": "@fontsource/public-sans/files/public-sans-latin-600-normal.woff2"}
        for k, v in files.items(): shutil.copy(NM / v, fd / k)
        u = BASE + "/_build/_og/fonts/"
        css = (f"@font-face{{font-family:Archivo;src:url({u}arch.woff2);font-weight:100 900;font-stretch:62% 125%}}"
               f"@font-face{{font-family:'Instrument Serif';font-style:italic;src:url({u}serif.woff2)}}"
               f"@font-face{{font-family:'JetBrains Mono';font-weight:400;src:url({u}mono4.woff2)}}"
               f"@font-face{{font-family:'JetBrains Mono';font-weight:500;src:url({u}mono5.woff2)}}"
               f"@font-face{{font-family:'Public Sans';font-weight:400;src:url({u}ps4.woff2)}}"
               f"@font-face{{font-family:'Public Sans';font-weight:500;src:url({u}ps5.woff2)}}"
               f"@font-face{{font-family:'Public Sans';font-weight:600 700;src:url({u}ps6.woff2)}}")
        site.route("**/fonts.googleapis.com/**", lambda r: r.fulfill(status=200, content_type="text/css", body=css))
        site.route("**/fonts.gstatic.com/**", lambda r: r.abort())
        site.route("**/gc.zgo.at/**", lambda r: r.abort())
        card = b.new_page(viewport={"width": 1200, "height": 630})
        def shoot(markup, out):
            f = TMP / "card.html"; f.write_text(markup)
            card.goto(f.as_uri()); card.wait_for_timeout(250)
            card.screenshot(path=str(out), type="jpeg", quality=88)
        for p in pages:
            name = p.get("slug") or p["section"]
            fig_png, right = None, ""
            site.goto(BASE + build.url_of(p), wait_until="networkidle")
            el = site.query_selector("header .fig")
            if el:
                fig_png = TMP / f"{name}.png"; el.screenshot(path=str(fig_png))
            elif p["section"] == "blog":
                right = '<div class="list">' + "".join(f'<div><span>{html.escape(q["kicker"])}</span><b>{html.escape(q["h1_plain"])}</b></div>' for q in posts[:3]) + "</div>"
            shoot(page_card(p, fig_png, right), ROOT / "og" / f"{name}-{V}.jpg")
            print("og", name)
        shoot(person_card("gibin.in"), ROOT / "og" / f"home-{V}.jpg"); print("og home")
        b.close()
    import shutil
    shutil.rmtree(TMP, ignore_errors=True)


if __name__ == "__main__":
    main()
