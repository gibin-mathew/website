# How the case studies and blog are built

Everything under `projects/`, `blog/`, `og/`, the company short-link folders and
`sitemap.xml` is generated. Don't edit those by hand. Edit the sources here.

## Add a blog post or case study
1. Copy an existing file in `_build/content/` (`b0x-...` for posts, `p0x-...` for case studies).
2. Change the JSON header at the top: `slug`, `title`, `description` (under 160 chars),
   `h1`, `dek`, `summary`, `date`, `updated`, `keywords`, `related`, and `fig` for the
   animation at the top (see `figures.py`).
3. Write the article below the header in plain HTML. `<!--fig:NAME-->` drops in a figure.
4. Commit and push. The **Build pages and preview cards** GitHub Action then builds the
   page, its link-preview card (`og/<slug>-v2.jpg`), the sitemap and the IndexNow list,
   and commits them back. Pull before your next edit.

## Preview cards
- New pages get their own card automatically: title on the left, the page's figure on the right.
- The homepage, `/cv`, `/linkedin` and every company short link use the shared photo card `og/home-v2.jpg`.
- If you change a card design, bump `OG_VERSION` in `build.py` so WhatsApp and LinkedIn fetch the new image.

## Company short links (gibin.in/ust, /pwc ...)
Add the slug to `shortlinks.json` and push. It becomes a real page that forwards to the
homepage with `?ref=resume&utm_campaign=<slug>`. Slugs not in the list still forward via `404.html`.

## Run it on your Mac (optional)
```
python3 _build/build.py
python3 -m http.server 8765 &          # in the repo root
FONTS=/path/to/node_modules BASE=http://localhost:8765 python3 _build/og.py
```
