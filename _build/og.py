#!/usr/bin/env python3
"""Renders a 1200x630 social card per page into og/<slug>.jpg.
Needs Playwright (Python) and local copies of the site fonts:
  FONTS=/path/to/node_modules python3 _build/og.py
"""
import os, re, sys, pathlib, html
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import build
from playwright.sync_api import sync_playwright

ROOT = build.ROOT
NM = pathlib.Path(os.environ.get("FONTS", "node_modules"))
FACES = f"""
@font-face{{font-family:Archivo;src:url(file://{NM}/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2) format('woff2');font-weight:100 900;font-stretch:62% 125%}}
@font-face{{font-family:'Instrument Serif';font-style:italic;src:url(file://{NM}/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2)}}
@font-face{{font-family:'JetBrains Mono';src:url(file://{NM}/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2)}}
@font-face{{font-family:'Public Sans';src:url(file://{NM}/@fontsource/public-sans/files/public-sans-latin-500-normal.woff2)}}
"""

def card(p):
    facts = "".join(f"<span>{f}</span>" for f in p.get("facts", [])[:3])
    url = "gibin.in" + build.url_of(p).rstrip("/")
    avatar = (ROOT / "gibin-mathew.jpg").as_uri()
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FACES}
*{{box-sizing:border-box;margin:0}}
body{{width:1200px;height:630px;overflow:hidden;background:radial-gradient(700px 420px at 92% 0%,#1B2E57 0%,transparent 65%),radial-gradient(500px 300px at 0% 100%,#121D2E 0%,transparent 70%),#0B1320;color:#EEF2F8;font-family:'Public Sans',sans-serif;padding:64px 72px;display:flex;flex-direction:column;position:relative}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(rgba(140,153,173,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(140,153,173,.07) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(90deg,transparent 35%,#000 100%)}}
.top{{display:flex;justify-content:space-between;align-items:center;position:relative}}
.mark{{font:900 30px Archivo;font-stretch:125%}}.mark span{{color:#6F95FF}}
.kick{{font:500 20px 'JetBrains Mono';letter-spacing:.12em;text-transform:uppercase;color:#F2A93B}}
h1{{position:relative;margin-top:44px;font-family:Archivo;font-stretch:125%;font-weight:800;font-size:{60 if len(p['h1_plain'])<60 else 50}px;line-height:1.04;letter-spacing:-.025em;max-width:1000px}}
h1 em{{font-family:'Instrument Serif';font-style:italic;font-weight:400;font-stretch:100%;color:#F2A93B}}
.facts{{position:relative;display:flex;gap:12px;margin-top:30px}}
.facts span{{font:500 20px 'JetBrains Mono';border:1.5px solid #22304A;border-radius:999px;padding:8px 18px;color:#EEF2F8;background:rgba(255,255,255,.03)}}
.facts b{{color:#4FD08F;font-weight:500}}
.foot{{position:relative;margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:1.5px solid #22304A;padding-top:24px}}
.who{{display:flex;align-items:center;gap:16px;font-size:22px;color:#8C99AD}}.who b{{color:#EEF2F8;font-weight:600}}
.who img{{width:56px;height:56px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px #22304A}}
.url{{font:500 20px 'JetBrains Mono';color:#6F95FF}}
</style></head><body><div class="grid"></div>
<div class="top"><div class="mark">GM<span>.</span></div><div class="kick">{html.escape(p['kicker'])}</div></div>
<h1>{p['h1']}</h1><div class="facts">{facts}</div>
<div class="foot"><div class="who"><img src="{avatar}"><span><b>Gibin Mathew</b> · RPA &amp; data automation · Chennai</span></div><div class="url">{url}</div></div>
</body></html>"""

def main():
    pages = build.load()
    for p in pages:
        p["h1_plain"] = re.sub(r"<[^>]+>", "", p["h1"])
    out = ROOT / "og"; out.mkdir(exist_ok=True)
    tmp = ROOT / "_build" / "_og.html"
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 1200, "height": 630})
        for p in pages:
            tmp.write_text(card(p))
            pg.goto(tmp.as_uri()); pg.wait_for_timeout(250)
            name = p.get("slug") or p["section"]
            pg.screenshot(path=str(out / f"{name}.jpg"), type="jpeg", quality=86)
            print("og", name)
        b.close()
    tmp.unlink()

if __name__ == "__main__":
    main()
