# Figure markup. Each figure reads fine as static HTML; assets/site.js animates it.
# Hero figures sit in the dark band (band tokens). Inline figures sit in the article (surface tokens).

HERO = {}
INLINE = {}

HERO["config"] = """
<div class="fig" data-scene="config" role="img" aria-label="Animation: one engine fills three different portal forms from the same record. Each portal is a small config file.">
  <div class="fig-h"><span class="live"><b data-file>portal-a.json</b></span><div class="tabs" aria-hidden="true"><span class="on">Portal A</span><span>Portal B</span><span>Portal C</span></div></div>
  <div class="cfg">
    <div class="panel"><div class="panel-k"><span>config</span><span>data, not code</span></div>
<pre>{ "portal": "Portal A",
  "steps": [
  { "#first": "name.first" },
  { "#last": "name.last" },
  { "#dob": "dob | DD/MM/YYYY" },
  { "#country": "country.name" },
  { "otp": "person" },
] }</pre></div>
    <div class="panel"><div class="panel-k"><span>portal form</span><span class="tag blue">live</span></div>
      <div class="ff"><label>Given name<span class="in done">Asha</span></label><label>Family name<span class="in done">Rao</span></label><label>Date of birth<span class="in done">14/07/1999</span></label><label>Country<span class="in done">India</span></label><label>One-time code<span class="in done">done by a person</span></label></div>
    </div>
  </div>
  <div class="fig-f"><span data-status>Portal A submitted, engine unchanged</span><span>sample data</span></div>
</div>"""

HERO["tokens"] = """
<div class="fig" data-scene="tokens" role="img" aria-label="Animation: two differently written listing names are lower-cased, stripped of symbols, split into words, sorted and joined. Both produce the same key, so they match.">
  <div class="fig-h"><span class="live"><b>token sort matching</b></span><span>website ↔ database</span></div>
  <div class="tk-step" aria-hidden="true"><span>lower-case</span><span>strip symbols</span><span>split</span><span>sort</span><span>join</span><span>compare</span></div>
  <div class="tk">
    <div class="panel tk-row"><div class="panel-k"><span>on the website</span></div><div class="tk-src">MSc Data Science (Full Time)</div><div class="tk-chips"></div><div class="tk-key ok">datafullmscsciencetime</div></div>
    <div class="panel tk-row"><div class="panel-k"><span>in the database</span></div><div class="tk-src">Data Science MSc - Full Time</div><div class="tk-chips"></div><div class="tk-key ok">datafullmscsciencetime</div></div>
  </div>
  <div class="verdict ok"><span>same key + same intake</span><span>MATCHED</span></div>
  <div class="fig-f"><span>no similarity threshold, no library</span><span>sample listing</span></div>
</div>"""

HERO["md"] = """
<div class="fig" data-scene="md" role="img" aria-label="Animation: an agent-written scraper reads a messy web page, dismisses the cookie banner and writes the content out as clean Markdown. A second agent then answers a plain-language question from those files.">
  <div class="fig-h"><span class="live"><b>page → Markdown → answers</b></span><span>Hermes-written scraper</span></div>
  <div class="mdx">
    <div class="panel wire"><div class="panel-k"><span>web page</span></div><i class="w8"></i><i class="w6"></i><i class="tall"></i><i></i><i class="w8"></i><i class="w4"></i><i class="tall"></i><span class="cookie">Accept cookies?</span></div>
    <div class="arr" aria-hidden="true">→</div>
    <div class="panel"><div class="panel-k"><span>listing.md</span><span>S3</span></div>
<pre class="mdlines"><span class="m in">---</span><span class="m in">source: example.com/listings/42</span><span class="m in">fetched: 2026-10-12</span><span class="m in">---</span><span class="h in"># Sample listing</span><span class="in">- Duration: 12 months</span><span class="in">- Starts: September, January</span><span class="in">- Fees: see fees page</span></pre></div>
  </div>
  <div class="chat"><div class="bub q in">Which listings start in January?</div><div class="bub a in">Two pages mention a January start. Here they are, with links to the source.</div></div>
  <div class="fig-f"><span>one format for every website</span><span>sample page</span></div>
</div>"""

HERO["subject"] = """
<div class="fig" data-scene="subject" role="img" aria-label="Animation: the AI highlights subject requirements on a page and maps each to a master list. Exact matches publish on their own. A near match goes to a person, who picks the right subject.">
  <div class="fig-h"><span class="live"><b>AI reads, a person signs off</b></span><span class="models"><span class="tag blue">Gemini</span><span class="tag">DeepSeek</span></span></div>
  <div class="panel"><div class="panel-k"><span>source page</span><span>highlighted</span></div>
    <p class="src">Entry requirements: A-level <mark class="on">Mathematics</mark> and <mark class="on">Physics</mark>. Applicants with <mark class="on">Further Maths</mark> are also considered.</p></div>
  <div class="rows">
    <div class="row in ok"><span>Mathematics<small>exact match · 1.0</small></span><span class="tag ok">publish</span></div>
    <div class="row in ok"><span>Physics<small>exact match · 1.0</small></span><span class="tag ok">publish</span></div>
    <div class="row in ok"><span>Further Maths<small data-pick>picked by a person: Further Mathematics</small></span><span class="tag amber">review</span></div>
  </div>
  <span class="btnf" aria-hidden="true">Save &amp; Verify</span>
  <div class="fig-f"><span>exact matches publish, the rest go to a person</span><span>sample page</span></div>
</div>"""

HERO["fees"] = """
<div class="fig" data-scene="fees" role="img" aria-label="Animation: the AI summariser highlights the fee and the word may on a fee page. A reviewer checks it once and applies it to every full-time intake. The part-time intake is left alone.">
  <div class="fig-h"><span class="live"><b>check once, apply everywhere</b></span><span>Shift + A: summarise</span></div>
  <div class="panel"><div class="panel-k"><span>fee page</span><span>AI highlights</span></div>
    <p class="src">Tuition for 2026 entry is <mark class="on">£18,500</mark> per year for full-time study. Fees <mark class="w on">may</mark> rise each year.</p></div>
  <div class="rows">
    <div class="row in ok" data-ft><span>Sep 2026 · Full-time<small>Main campus</small></span><span data-v>£18,500 ✓</span></div>
    <div class="row in ok" data-ft><span>Jan 2027 · Full-time<small>Main campus</small></span><span data-v>£18,500 ✓</span></div>
    <div class="row in ok" data-ft><span>Sep 2026 · Full-time<small>City campus</small></span><span data-v>£18,500 ✓</span></div>
    <div class="row in"><span>Sep 2026 · Part-time<small>Main campus</small></span><span data-v>not set</span></div>
  </div>
  <span class="btnf" aria-hidden="true">Apply to all full-time intakes</span>
  <div class="fig-f"><span data-who>verified once, applied to 3 intakes</span><span>sample data</span></div>
</div>"""

def _ticker():
    rows = [("northwind-trading.com","@northwindtrading"),("acme-holdings.com","@acmeholdings"),("blue-harbor.io","—"),("contoso-group.com","@contosogroup"),("fabrikam.co","@fabrikam"),("globex-corp.com","@globex"),("initech.net","—"),("umbrella-labs.com","@umbrellalabs"),("tailspin-air.com","@tailspinair"),("wingtip-toys.com","@wingtiptoys")]
    li = "".join(f"<li><span>{d}</span>{'<i>none found</i>' if h=='—' else '<b>'+h+'</b>'}</li>" for d,h in rows)
    return li + li

HERO["crawl"] = f"""
<div class="fig" data-scene="crawl" role="img" aria-label="Animation: a crawler works through company websites and records each company's official social handle. A counter climbs to 3.4 million websites, and a grid of 160 figures fills in for the full-time research it replaced.">
  <div class="fig-h"><span class="live"><b>social handle crawler</b></span><span>S&amp;P Global · Python + Selenium</span></div>
  <div class="crawl">
    <div class="panel"><div class="panel-k"><span>domain</span><span>handle</span></div><div class="ticker"><ul>{_ticker()}</ul></div></div>
    <div class="panel"><div class="panel-k"><span>websites crawled</span></div><div class="big" data-count>3.4M+</div>
      <div class="panel-k" style="margin-top:14px"><span>research replaced</span><span>160 FTE</span></div>
      <div class="ppl" aria-hidden="true">{''.join('<i class="on"></i>' for _ in range(160))}</div></div>
  </div>
  <div class="fig-f"><span>one clean handle per company</span><span>sample domains</span></div>
</div>"""

HERO["rate"] = """
<div class="fig" data-scene="rate" role="img" aria-label="Animation: a bar splits roughly 3,400 jobs into successful, failed and stopped by the user. Counting user stops as failures gives about 90 percent. Measuring only what the platform controls gives 94 percent.">
  <div class="fig-h"><span class="live"><b>what counts as a failure?</b></span><span>3,400+ jobs · Oct 2026</span></div>
  <div class="rate">
    <div class="stack"><i class="s" style="width:94.6%">success</i><i class="f" style="width:5.4%"></i><i class="t" style="width:0"></i></div>
    <div class="legend2"><span style="--c:var(--band-ok)">succeeded</span><span style="--c:var(--band-bad)">failed</span><span style="--c:var(--band-muted)">stopped by a user</span></div>
    <div class="formula dim"><span class="lbl">all jobs</span><code>success ÷ every job</code><b>~90%</b></div>
    <div class="formula on"><span class="lbl">platform</span><code>success ÷ (success + failed)</code><b>94%</b></div>
  </div>
  <div class="fig-f"><span>same jobs, two honest-looking numbers</span><span>dashboard, Oct 2026</span></div>
</div>"""

HERO["human"] = """
<div class="fig" data-scene="human" role="img" aria-label="Animation: a bot fills a portal page by page. When it reaches a one-time code or a document upload it pauses, a person does that step, and the bot carries on to submit.">
  <div class="fig-h"><span class="live"><b data-status>submitted and logged</b></span><span>one job</span></div>
  <ol class="tl">
    <li class="done">Open the portal and sign in<span class="tag ok">bot</span></li>
    <li class="done">Fill personal details<span class="tag ok">bot</span></li>
    <li class="done">Repeat the education section until the list runs out<span class="tag ok">bot</span></li>
    <li class="done" data-wait>One-time code arrives by email<span class="tag amber">person</span></li>
    <li class="done">Fill the remaining pages<span class="tag ok">bot</span></li>
    <li class="done" data-wait>Upload signed documents<span class="tag amber">person</span></li>
    <li class="done">Review and submit<span class="tag ok">bot</span></li>
  </ol>
  <div class="fig-f"><span>the bot waits, it doesn't guess</span><span>sample job</span></div>
</div>"""

HERO["versus"] = """
<div class="fig" data-scene="versus" role="img" aria-label="Animation: adding a new portal two ways. One bot per site means writing, testing and deploying a script, then doing it again after every redesign. Config-driven means writing a config, a dry run, and going live.">
  <div class="fig-h"><span class="live"><b>adding portal #41</b></span><span>two ways</span></div>
  <div class="vs">
    <div class="panel"><h4>One bot per site</h4><ol class="tl">
      <li class="done">Write a new script</li><li class="done">Test it</li><li class="done">Deploy it</li><li class="done">Site redesign: fix the code</li><li class="done">Test again</li><li class="done">Deploy again</li></ol>
      <div class="meter"><i style="width:100%"></i></div></div>
    <div class="panel ok"><h4>Config-driven</h4><ol class="tl">
      <li class="done">Write a config</li><li class="done">Dry run</li><li class="done">Live</li></ol>
      <div class="meter"><i style="width:100%"></i></div></div>
  </div>
  <div class="fig-f"><span>the engine never moves</span><span>illustration</span></div>
</div>"""

HERO["gate"] = """
<div class="fig" data-scene="gate" role="img" aria-label="Animation: pages flow through a model, a draft, a check and a match against the master list. Exact matches publish on their own; everything else goes to a person.">
  <div class="fig-h"><span class="live"><b>what the AI may do alone</b></span><span class="models"><span class="tag blue">Gemini</span><span class="tag">Gemma</span><span class="tag">DeepSeek</span></span></div>
  <div class="gate">
    <div class="gate-l"><div><b>Page</b>scraped</div><div><b>Model</b>picked per run</div><div><b>Draft</b>summary + table</div><div><b>Match</b>master list</div></div>
    <div class="outs"><div class="ok"><span>exact → publishes</span><b>6</b></div><div class="amber"><span>else → a person</span><b>2</b></div></div>
  </div>
  <div class="panel"><div class="panel-k"><span>prompt</span><span>shared · versioned</span></div><p class="src" style="font-size:12.5px">Last edited by a reviewer, with the change and the time on record.</p></div>
  <div class="fig-f"><span>calling the model was the easy part</span><span>illustration</span></div>
</div>"""

def net(links=False):
    def node(x, y, t, s, href, i):
        body = f'<g class="n" data-n="{i}"><rect x="{x}" y="{y}" width="220" height="74" rx="12"/><text x="{x+16}" y="{y+31}">{t}</text><text class="s" x="{x+16}" y="{y+53}">{s}</text></g>'
        return f'<a href="{href}">{body}</a>' if links else body
    return f"""
<div class="fig" style="min-height:0" role="img" aria-label="Diagram: how the projects connect. Collect the data with crawlers and the Markdown Extractor, reconcile it with token-sort matching, check it with AI validators and people, then act on it with config-driven RPA.">
  <div class="fig-h"><span class="live"><b>how the pieces connect</b></span><span>Edvoy + S&amp;P Global</span></div>
  <svg class="net" viewBox="0 0 520 290" aria-hidden="true">
    <path id="p1" d="M240 57 H280"/><path id="p2" d="M390 94 C390 150 130 120 130 196"/><path id="p3" d="M240 233 H280"/>
    {node(20,20,'Collect','crawlers · Markdown Extractor','/projects/markdown-extractor/',1)}
    {node(280,20,'Reconcile','token-sort matching','/projects/token-sort-matching/',2)}
    {node(20,196,'Check','AI validators + people','/projects/subject-validator/',3)}
    {node(280,196,'Act','config-driven RPA','/projects/config-driven-rpa/',4)}
    <circle class="pk" r="4"><animateMotion dur="2.2s" repeatCount="indefinite"><mpath href="#p1"/></animateMotion></circle>
    <circle class="pk" r="4"><animateMotion dur="3.4s" begin=".6s" repeatCount="indefinite"><mpath href="#p2"/></animateMotion></circle>
    <circle class="pk" r="4"><animateMotion dur="3.4s" begin="2.3s" repeatCount="indefinite"><mpath href="#p2"/></animateMotion></circle>
    <circle class="pk g" r="4"><animateMotion dur="2.2s" begin="1.1s" repeatCount="indefinite"><mpath href="#p3"/></animateMotion></circle>
  </svg>
  <div class="fig-f"><span>collect → reconcile → check → act</span><span>select a box to open it</span></div>
</div>"""

HERO["net"] = net(True)

# ---------- inline (article) figures ----------
INLINE["arch"] = """
<figure class="bfig" data-scene="arch">
  <div class="bk"><span>How one job moves through the system</span><span>production stack</span></div>
  <div class="arch">
    <div><b>Side panel</b><span>operator picks record + portal</span></div>
    <div><b>API</b><span>FastAPI · validates the job</span></div>
    <div><b>Queue</b><span>Celery + RabbitMQ</span></div>
    <div><b>Engine</b><span>Node.js + Playwright · reads the config</span></div>
    <div><b>Portal</b><span>fills, pauses for people, submits</span></div>
  </div>
  <div class="arch-sub"><div><b>Redis</b> sessions and results</div><div><b>MongoDB</b> configs, jobs, step logs</div><div><b>AWS ECS Fargate</b> staging + production, in Docker</div></div>
  <figcaption>Simplified. The engine is the only part that touches a portal, and it reads its instructions from config.</figcaption>
</figure>"""

INLINE["bins"] = """
<figure class="bfig" data-scene="bins">
  <div class="bk"><span>Every failed job gets one label</span><span>illustration</span></div>
  <div class="bins">
    <div class="bin" style="--c:var(--accent)"><b>Config error</b><span>our mistake in the config</span><div class="dots"><i></i><i></i><i></i></div></div>
    <div class="bin" style="--c:var(--amber)"><b>Site changed</b><span>the portal moved something</span><div class="dots"><i></i><i></i></div></div>
    <div class="bin" style="--c:#8a63d2"><b>Connection</b><span>timeouts, network, slow pages</span><div class="dots"><i></i><i></i></div></div>
    <div class="bin" style="--c:var(--ok)"><b>Needs a person</b><span>blocked, attention required</span><div class="dots"><i></i><i></i></div></div>
    <div class="bin x" style="--c:var(--muted)"><b>User stopped it</b><span>not counted against the platform</span><div class="dots"><i></i><i></i><i></i></div></div>
  </div>
  <figcaption>The dots are an illustration, not the real split. What matters is that each label sends the fix to a different person.</figcaption>
</figure>"""

INLINE["cmp"] = """
<figure class="bfig" data-scene="cmp">
  <div class="bk"><span>One reconciliation run</span><span>sample listings</span></div>
  <div class="cmp">
    <div><h4>Website</h4><ul>
      <li data-r="m">MSc Data Science · Sep 2026<span data-o>matched</span></li>
      <li data-r="c">BA Economics · Jan 2027<span data-o>modified</span></li>
      <li data-r="n">MSc Robotics · Sep 2026<span data-o>new</span></li>
    </ul></div>
    <div><h4>Database</h4><ul>
      <li data-r="m">Data Science MSc · Sep 2026<span data-o>matched</span></li>
      <li data-r="c">Economics BA · Jan 2027 · fee changed<span data-o>modified</span></li>
      <li data-r="d">MA History of Art · Sep 2026<span data-o>deleted</span></li>
    </ul></div>
  </div>
  <figcaption>New: on the website, not in the database. Deleted: in the database, gone from the website. Matched: in both. Modified: in both, but something like the fee or campus changed.</figcaption>
</figure>"""

INLINE["keys"] = """
<figure class="bfig" data-scene="keys" data-hit="3">
  <div class="bk"><span>Strictest key first, then fall back</span><span>sample run</span></div>
  <ol class="keys">
    <li data-why="campus missing on website">name + intake + campus + study mode + duration<span class="r"></span></li>
    <li data-why="campus missing on website">name + intake + campus + study mode<span class="r"></span></li>
    <li data-why="no duration in database">name + intake + study mode + duration<span class="r"></span></li>
    <li>name + intake + study mode<span class="r"></span></li>
    <li>…<span class="r"></span></li>
    <li>name + intake<span class="r"></span></li>
  </ol>
  <figcaption>A field only joins the key when both sides have it. The most specific key that both sides can build wins, so a vague match never beats a precise one.</figcaption>
</figure>"""

# ---------- blog inline figures ----------
INLINE["maint"] = """
<figure class="bfig" data-scene="maint">
  <div class="bk"><span>Same 40 portals, one redesign at a time</span><span>illustration</span></div>
  <div class="mt-two">
    <div class="mt-side"><div class="mt-h"><b>One bot per site</b><span>deploys <em data-dep="a">0</em></span></div>
      <div class="mt-grid">""" + "".join('<i></i>' for _ in range(40)) + """</div>
      <p class="mt-note" data-note="a">40 scripts to keep alive</p></div>
    <div class="mt-side"><div class="mt-h"><b>One engine, 40 configs</b><span>deploys <em data-dep="b">0</em></span></div>
      <div class="mt-engine">engine</div>
      <div class="mt-grid cfgs">""" + "".join('<i></i>' for _ in range(40)) + """</div>
      <p class="mt-note" data-note="b">1 engine, 40 small files</p></div>
  </div>
  <figcaption>Each flash is a portal changing its layout. On the left that's a code fix, a test and a release. On the right it's a config edit, and the engine stays as it is.</figcaption>
</figure>"""

INLINE["anatomy"] = """
<figure class="bfig" data-scene="anatomy">
  <div class="bk"><span>Three things every step says</span><span>anatomy of a config</span></div>
  <div class="an">
    <pre class="an-code"><span data-a="0">{ "fill": <b>"#first-name"</b>,</span><span data-a="1">  "from": <b>"name.first"</b> }</span><span>…</span><span data-a="2">"done_when": { "visible": <b>"text=Education history"</b> }</span></pre>
    <ol class="an-list">
      <li data-a="0"><b>Where it lives</b><span>a selector the engine can find on the page</span></li>
      <li data-a="1"><b>What goes in</b><span>a path into the record, already cleaned</span></li>
      <li data-a="2"><b>What "done" looks like</b><span>the marker that proves the page moved on</span></li>
    </ol>
  </div>
</figure>"""

INLINE["time"] = """
<figure class="bfig" data-scene="time">
  <div class="bk"><span>Where the minutes go in one job</span><span>illustration, not to scale</span></div>
  <div class="tm">
    <div class="tm-row"><span>By hand</span><div class="tm-bar"><i class="hand" style="--w:100%"></i></div><b>~30 min</b></div>
    <div class="tm-row"><span>One job, wall clock</span><div class="tm-bar"><i class="bot" style="--w:14%"></i><i class="wait" style="--w:22%"></i><i class="bot" style="--w:10%"></i><i class="wait" style="--w:30%"></i><i class="bot" style="--w:6%"></i></div><b>varies</b></div>
    <div class="tm-row"><span>Bot time only</span><div class="tm-bar"><i class="bot" style="--w:17%"></i></div><b>~5 min avg</b></div>
  </div>
  <div class="legend2 lg-s"><span style="--c:var(--accent)">bot working</span><span style="--c:var(--amber)">waiting for a person</span><span style="--c:var(--muted)">done by hand</span></div>
  <figcaption>I quote the last row. The amber gaps are people entering codes or getting documents ready. They aren't the bot's time, and they aren't counted as savings.</figcaption>
</figure>"""

def _scores():
    rows = [("MSc Data Science (Full Time)", "Data Science MSc - Full Time", 84, 100, 100, True),
            ("Data Science MSc", "MSc in Data Science", 69, 91, 100, False),
            ("Data Science", "Data Science and AI", 77, 77, 100, False),
            ("MSc Data Science", "MSc Data Sciences", 97, 97, 97, False),
            ("MSc Data Science", "Master of Science in Data Science", 65, 65, 86, False)]
    out = []
    for a, b, r, ts, tset, same in rows:
        flag = '<span class="sc-flag ok">same course</span>' if same else ('<span class="sc-flag bad">different course, scored 100</span>' if b.endswith("and AI") else '')
        out.append(f'''<div class="sc-row"><div class="sc-pair"><b>{a}</b><span>vs {b}</span>{flag}</div>
          <div class="sc-bars"><div class="sc-b r"><i style="--v:{r}%"></i><em>{r}</em></div><div class="sc-b s"><i style="--v:{ts}%"></i><em>{ts}</em></div><div class="sc-b t"><i style="--v:{tset}%"></i><em>{tset}</em></div></div>
          <div class="sc-key {'y' if same else 'n'}">{'key ✓' if same else 'key ✗'}</div></div>''')
    return "".join(out)

INLINE["scores"] = f"""
<figure class="bfig" data-scene="scores">
  <div class="bk"><span>RapidFuzz scores vs an exact sorted key</span><span>real scores, sample names</span></div>
  <div class="legend2 lg-s"><span style="--c:#9aa6b8">ratio</span><span style="--c:var(--accent)">token sort</span><span style="--c:var(--amber)">token set</span></div>
  <div class="sc">{_scores()}</div>
  <figcaption>Token set gives a perfect 100 to two different courses. The exact key never says yes to the wrong pair. It does miss row two, which is what the alias names are for.</figcaption>
</figure>"""

INLINE["decide"] = """
<figure class="bfig" data-scene="decide">
  <div class="bk"><span>A quick way to pick</span><span data-case>scenario</span></div>
  <div class="dt">
    <div class="dt-q" data-n="q1">Is all the work inside a browser?</div>
    <div class="dt-r">
      <div class="dt-o" data-n="o1">No: desktop, Citrix, legacy apps<b>Platform RPA</b></div>
      <div class="dt-q" data-n="q2">Many sites doing the same job differently?</div>
    </div>
    <div class="dt-r">
      <div class="dt-o" data-n="o2">Yes<b>Playwright, config-driven</b></div>
      <div class="dt-q" data-n="q3">Who will maintain the bots?</div>
    </div>
    <div class="dt-r">
      <div class="dt-o" data-n="o3">Engineers<b>Playwright</b></div>
      <div class="dt-o" data-n="o4">Business users<b>Platform RPA</b></div>
    </div>
  </div>
  <figcaption>Not a rule, a starting point. The table above has the longer version.</figcaption>
</figure>"""

INLINE["stack"] = """
<figure class="bfig" data-scene="stack">
  <div class="bk"><span>Playwright drives the browser. The rest is yours.</span><span>what we built around it</span></div>
  <div class="stk2">
    <div class="given"><b>Playwright</b><span>browser control, auto-waiting, selectors</span></div>
    <div><b>Job API + queue</b><span>FastAPI, Celery, RabbitMQ</span></div>
    <div><b>Sessions + results</b><span>Redis</span></div>
    <div><b>Step log</b><span>MongoDB</span></div>
    <div><b>Human handover</b><span>OTP, CAPTCHA, uploads</span></div>
    <div><b>Failure labels</b><span>who fixes what</span></div>
    <div><b>Dashboard</b><span>honest success rate</span></div>
    <div><b>Deploy + scale</b><span>Docker, AWS ECS</span></div>
  </div>
</figure>"""

INLINE["states"] = """
<figure class="bfig" data-scene="states">
  <div class="bk"><span>Two ways a job can go</span><span data-case>a person steps in</span></div>
  <div class="st">
    <div class="st-n" data-s="run">Bot running</div><i class="st-a"></i>
    <div class="st-n" data-s="pause">Paused for a person</div><i class="st-a"></i>
    <div class="st-n" data-s="resume">Bot resumes</div><i class="st-a"></i>
    <div class="st-n ok" data-s="done">Submitted</div>
  </div>
  <div class="st">
    <div class="st-n" data-s="stuck">Can't find next section</div><i class="st-a"></i>
    <div class="st-n" data-s="r1">Retry 1/3</div><i class="st-a"></i>
    <div class="st-n" data-s="r2">Retry 2/3</div><i class="st-a"></i>
    <div class="st-n" data-s="r3">Retry 3/3</div><i class="st-a"></i>
    <div class="st-n bad" data-s="fail">Failed, with a label</div>
  </div>
  <figcaption>Bounded on purpose. A stuck job becomes a labelled failure someone can fix, not a loop that runs all night.</figcaption>
</figure>"""

INLINE["apply"] = """
<figure class="bfig" data-scene="apply">
  <div class="bk"><span>Verify once, choose the scope, apply</span><span>sample intakes</span></div>
  <div class="ap">
    <div class="ap-src"><span>verified fee</span><b>£18,500</b><em data-scope>every full-time intake</em></div>
    <ul class="ap-list">
      <li data-ft data-c="main">Sep 2026 · Full-time · Main campus</li>
      <li data-ft data-c="main">Jan 2027 · Full-time · Main campus</li>
      <li data-ft data-c="city">Sep 2026 · Full-time · City campus</li>
      <li data-c="main">Sep 2026 · Part-time · Main campus</li>
      <li data-ft data-c="city">Jan 2027 · Full-time · City campus</li>
      <li data-c="city">Jan 2027 · Part-time · City campus</li>
    </ul>
  </div>
  <figcaption>Three scopes: every intake, every full-time intake, or every intake at the same campus. One check, the right rows, a name and a time on each.</figcaption>
</figure>"""

# ---------------------------------------------------------------------------------------------
# Tool figures: a before -> after story per tool, animated with CSS only (assets/tools/tools.css).
# Each element fades in on its own delay (--d) and the whole scene loops. Reduced motion shows the end state.
# ---------------------------------------------------------------------------------------------
def _d(sec):
    return f' style="--d:{sec:.2f}s"'

_pairs = [("Acme Corp", "ACME Corporation", "100", "ok"), ("Northfield Univ.", "Northfield University", "100", "ok"),
          ("Jonh Smith", "John Smith", "91", "ok"), ("Orchid Health Care", "Orchid Healthcare", "84", "amber"),
          ("Hooli Labs", "no good match", "31", "bad")]
HERO["t-fuzzy"] = ('<div class="fig tf" role="img" aria-label="Animation: each name in list A is joined to its closest name in list B with a score. '
    'Exact and near matches score high, a borderline pair is flagged for review, and a name with no partner scores low.">'
    '<div class="fig-h"><span class="live"><b>list A → closest in list B</b></span><span>score 0 to 100</span></div>'
    '<div class="tf-pairs"><div class="tf-ph"><span>List A (yours)</span><span></span><span>List B (reference)</span><span>score</span></div>' +
    "".join(f'<div class="tf-pair"><span class="tf-in"{_d(.3+i*.7)}>{a}</span><span class="tf-ln {c}"{_d(.55+i*.7)}><i></i></span>'
            f'<span class="tf-in {"tf-dim" if c=="bad" else ""}"{_d(.8+i*.7)}>{b}</span><span class="tag {c} tf-pop"{_d(1.0+i*.7)}>{s}</span></div>'
            for i, (a, b, s, c) in enumerate(_pairs)) +
    '</div><div class="tf-key tf-in"' + _d(4.6) + '><span><i class="ok"></i>match</span><span><i class="amber"></i>check by hand</span><span><i class="bad"></i>no match</span></div>'
    '<div class="fig-f"><span>typos, word order, Corp vs Corporation</span><span>sample data</span></div></div>')

_groups = [(["UK", "U.K.", "united kingdom", "Untied Kingdom", "Great Britain"], ["exact", "exact", "exact", "fuzzy", "alias"], "United Kingdom"),
           (["USA", "U.S.A.", "United States of America"], ["alias", "alias", "fuzzy"], "United States")]
_g = ""
for gi, (msgs, how, canon) in enumerate(_groups):
    base = .3 + gi * 2.6
    chips = "".join(f'<span class="tf-chip tf-in"{_d(base + k*.25)}>{m}<em>{h}</em></span>' for k, (m, h) in enumerate(zip(msgs, how)))
    _g += (f'<div class="tf-grp"><div class="tf-chips">{chips}</div><span class="tf-arrow tf-in"{_d(base+1.5)}>→</span>'
           f'<span class="tf-canon tf-pop"{_d(base+1.8)}>{canon}<small>{len(msgs)} spellings → 1</small></span></div>')
HERO["t-std"] = ('<div class="fig tf" role="img" aria-label="Animation: different spellings of the same country, like UK, U.K. and Untied Kingdom, are each mapped onto one standard value, United Kingdom, by exact match, an alias rule or fuzzy matching.">'
    '<div class="fig-h"><span class="live"><b>many spellings → one standard value</b></span><span>exact · alias · fuzzy</span></div>'
    f'<div class="tf-std">{_g}</div>'
    '<div class="fig-f"><span>decide each spelling once, every row follows</span><span>sample data</span></div></div>')

_rows = [("Priya Raman", "priya@example.com", ""), ("Arjun Mehta", "arjun@example.com", ""), ("&nbsp;Priya Raman&nbsp;", "PRIYA@example.com", "dup of row 1"),
         ("Sara Thomas", "sara@example.com", ""), ("Sara Thomas", "sara@example.com", "dup of row 4"), ("", "", "empty row")]
HERO["t-dedupe"] = ('<div class="fig tf" role="img" aria-label="Animation: a six-row table is cleaned. Two rows that repeat earlier rows once spaces and capital letters are ignored are marked as duplicates, an empty row is marked, and all three are removed, leaving three clean rows.">'
    '<div class="fig-h"><span class="live"><b>clean, then drop the repeats</b></span><span>compared on: name, email</span></div><div class="tf-tbl">' +
    "".join(f'<div class="tf-row{" tf-gone" if t else ""}"{_d(.2+i*.25)}><span class="tf-n">{i+1}</span><span>{n or "&nbsp;"}</span><span>{e}</span>'
            f'{f"<span class={chr(34)}tag amber tf-pop{chr(34)}{_d(2.4+i*.2)}>{t}</span>" if t else "<span></span>"}</div>' for i, (n, e, t) in enumerate(_rows)) +
    '</div><div class="tf-count"><span class="tf-in"' + _d(.2) + '>6 rows in</span><b class="tf-pop"' + _d(5.0) + '>3 clean rows out</b></div>'
    '<div class="fig-f"><span>trailing spaces and capitals no longer hide duplicates</span><span>sample data</span></div></div>')

_cols = [("order_id", 100, "1 ID repeats", "bad"), ("email", 92, "1 missing, 1 broken", "amber"), ("amount", 92, "N/A stored as text", "amber"), ("order_date", 100, "3 date formats", "amber"), ("city", 100, "Chennai vs chennai", "amber")]
HERO["t-profile"] = ('<div class="fig tf" role="img" aria-label="Animation: each column of a CSV gets a bar showing how full it is, then the problems in it pop up: a repeating ID, a missing email, N/A stored as text, mixed date formats and inconsistent capitals.">'
    '<div class="fig-h"><span class="live"><b>every column, checked</b></span><span>orders.csv · 12 rows</span></div><div class="tf-prof">' +
    "".join(f'<div class="tf-pc"><span class="tf-pn">{n}</span><span class="tf-bar"><i class="tf-fill"{_d(.3+i*.35)} data-w="{w}" style="--d:{.3+i*.35:.2f}s;--w:{w}%"></i></span>'
            f'<span class="tag {c} tf-pop"{_d(2.4+i*.4)}>{t}</span></div>' for i, (n, w, t, c) in enumerate(_cols)) +
    '</div><div class="tf-count"><span class="tf-in"' + _d(.2) + '>12 rows · 8 columns</span><b class="tf-pop"' + _d(4.6) + '>16 things to check before you load it</b></div>'
    '<div class="fig-f"><span>what breaks imports, joins and dashboards</span><span>sample data</span></div></div>')

_sql = ['CREATE TABLE "orders" (', '  "id" INTEGER,', '  "name" TEXT,', '  "amount" NUMERIC(6,2),', '  "pin" TEXT <c>-- keeps 060001</c>', ');',
        'INSERT INTO "orders" VALUES', "  (1001, 'Priya', 1250.00, '600042'),", "  (1004, 'O''Neil', 760.25, '060001');"]
HERO["t-sql"] = ('<div class="fig tf" role="img" aria-label="Animation: three lines of a CSV turn into a CREATE TABLE statement with sensible column types and an INSERT statement, with the apostrophe in O\'Neil escaped and the leading zero in a pincode kept.">'
    '<div class="fig-h"><span class="live"><b>CSV → ready-to-run SQL</b></span><span class="models"><span class="tag blue">PostgreSQL</span><span class="tag">MySQL</span><span class="tag">SQLite</span><span class="tag">SQL Server</span></span></div>'
    '<div class="tf-two"><div class="panel"><div class="panel-k"><span>orders.csv</span></div><pre class="tf-pre">id,name,amount,pin\n1001,Priya,1250.00,600042\n1004,O\'Neil,760.25,060001</pre></div>'
    '<div class="panel"><div class="panel-k"><span>orders.sql</span></div><pre class="tf-pre">' +
    "".join(f'<span class="tf-type"{_d(.5+i*.45)}>{l.replace("<c>", "<i>").replace("</c>", "</i>")}</span>' for i, l in enumerate(_sql)) +
    '</pre></div></div><div class="fig-f"><span>types picked from every row, quotes escaped</span><span>sample data</span></div></div>')

HERO["t-json"] = ('<div class="fig tf" role="img" aria-label="Animation: a nested JSON order with a customer object and a list of two items becomes a flat table with columns like customer.city, one row per item.">'
    '<div class="fig-h"><span class="live"><b>nested JSON → flat table</b></span><span>one row per item</span></div>'
    '<div class="tf-two"><div class="panel"><div class="panel-k"><span>api-response.json</span></div><pre class="tf-pre">{ "id": 1001,\n  "customer": {\n    "name": "Priya",\n    <b class="k1">"city": "Chennai"</b> },\n  "items": [\n    { <b class="k2">"sku": "TEA-250"</b> },\n    { <b class="k2">"sku": "MUG-01"</b> } ] }</pre></div>'
    '<div class="panel"><div class="panel-k"><span>data.csv</span></div><div class="tf-mini">'
    '<div class="tf-mh tf-in"' + _d(.6) + '><span>id</span><span class="k1">customer.city</span><span class="k2">items.sku</span></div>'
    '<div class="tf-mr tf-in"' + _d(1.6) + '><span>1001</span><span>Chennai</span><span>TEA-250</span></div>'
    '<div class="tf-mr tf-in"' + _d(2.4) + '><span>1001</span><span>Chennai</span><span>MUG-01</span></div>'
    '</div><p class="tf-note tf-in"' + _d(3.4) + '>Opens straight in Excel, Sheets or a database</p></div></div>'
    '<div class="fig-f"><span>API responses, exports, logs</span><span>sample data</span></div></div>')

HERO["t-mrz"] = ('<div class="fig tf" role="img" aria-label="Animation: the two lines of a passport machine-readable zone are split into fields, and each check digit is recalculated and confirmed.">'
    '<div class="fig-h"><span class="live"><b>passport MRZ, decoded and checked</b></span><span>ICAO 9303</span></div>'
    '<div class="tf-mrz"><div>P&lt;UTO<span class="m-name">ERIKSSON&lt;&lt;ANNA&lt;MARIA</span>&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>'
    '<div><span class="tf-hl" style="--d:.4s">L898902C3</span><b class="tf-ck" style="--d:.9s">6</b>UTO<span class="tf-hl" style="--d:1.5s">740812</span><b class="tf-ck" style="--d:2.0s">2</b>F<span class="tf-hl" style="--d:2.6s">120415</span><b class="tf-ck" style="--d:3.1s">9</b>ZE184226B&lt;&lt;&lt;&lt;&lt;1<b class="tf-ck" style="--d:3.8s">0</b></div></div>'
    '<div class="rows">' +
    "".join(f'<div class="row in ok tf-in"{_d(d)}><span>{k}<small>{v}</small></span><span class="tag ok">check {c} ✓</span></div>'
            for k, v, c, d in [("Document number", "L898902C3", "6", 1.0), ("Date of birth", "12 Aug 1974", "2", 2.1), ("Date of expiry", "15 Apr 2012", "9", 3.2), ("Whole line", "composite", "0", 3.9)]) +
    '</div><div class="fig-f"><span>catches OCR misreads like O for 0</span><span>ICAO specimen</span></div></div>')

HERO["t-sel"] = ('<div class="fig tf" role="img" aria-label="Animation: a CSS selector is typed, the matching product names and prices light up inside the page HTML, and they come out as rows of a table.">'
    '<div class="fig-h"><span class="live"><b>selector → the data you want</b></span><span>CSS or XPath</span></div>'
    '<div class="tf-selq"><span class="tf-type" style="--d:.2s">div.product → h2, .price</span></div>'
    '<div class="tf-two"><div class="panel"><div class="panel-k"><span>page HTML</span></div><pre class="tf-pre">&lt;div class="product"&gt;\n  &lt;h2&gt;<b class="tf-glow" style="--d:1.2s">Masala Chai</b>&lt;/h2&gt;\n  &lt;span class="price"&gt;<b class="tf-glow" style="--d:1.5s">₹ 320</b>&lt;/span&gt;\n&lt;/div&gt;\n&lt;div class="product"&gt;\n  &lt;h2&gt;<b class="tf-glow" style="--d:1.8s">Filter Coffee</b>&lt;/h2&gt;\n  &lt;span class="price"&gt;<b class="tf-glow" style="--d:2.1s">₹ 899</b>&lt;/span&gt;\n&lt;/div&gt;</pre></div>'
    '<div class="panel"><div class="panel-k"><span>extracted</span></div><div class="tf-mini tf-mini2">'
    '<div class="tf-mh tf-in"' + _d(2.5) + '><span>title</span><span>price</span></div>'
    '<div class="tf-mr tf-in"' + _d(2.9) + '><span>Masala Chai</span><span>₹ 320</span></div>'
    '<div class="tf-mr tf-in"' + _d(3.3) + '><span>Filter Coffee</span><span>₹ 899</span></div>'
    '</div><p class="tf-note tf-in"' + _d(3.9) + '>Then copy it as Python or Playwright code</p></div></div>'
    '<div class="fig-f"><span>test before you write the scraper</span><span>sample page</span></div></div>')

_dates = [("15/01/2026", "2026-01-15", "", ""), ("Jan 15, 2026", "2026-01-15", "", ""), ("20260115", "2026-01-15", "", ""), ("46037", "2026-01-15", "Excel date", ""),
          ("03/04/2026", "2026-04-03", "ambiguous", "amber"), ("31/02/2026", "no such date", "", "bad")]
HERO["t-dates"] = ('<div class="fig tf" role="img" aria-label="Animation: dates written six different ways are rewritten as one ISO format. One that could be April or March is flagged as ambiguous, and 31 February is rejected.">'
    '<div class="fig-h"><span class="live"><b>any format in → one format out</b></span><span>YYYY-MM-DD</span></div><div class="tf-dates">' +
    "".join(f'<div class="tf-dr"><span class="tf-in"{_d(.3+i*.45)}>{a}</span><span class="tf-arrow tf-in"{_d(.5+i*.45)}>→</span>'
            f'<b class="tf-in {c}"{_d(.7+i*.45)}>{b}</b>{f"<span class={chr(34)}tag {c or chr(98)+chr(108)+chr(117)+chr(101)} tf-pop{chr(34)}{_d(.9+i*.45)}>{t}</span>" if t else "<span></span>"}</div>'
            for i, (a, b, t, c) in enumerate(_dates)) +
    '</div><div class="fig-f"><span>checks the real calendar, flags what could go either way</span><span>sample data</span></div></div>')

HERO["t-fte"] = ('<div class="fig tf" role="img" aria-label="Animation: a team of three spends 20 hours a day on a task. After automation handles 80% of the jobs, only 5.6 hours a day are left, which frees about 1.8 full-time people.">'
    '<div class="fig-h"><span class="live"><b>time today vs with automation</b></span><span>120 jobs a day · 10 min each</span></div>'
    '<div class="tf-fte"><div class="tf-hb"><span>Today</span><span class="tf-bar2"><i class="tf-fill" style="--d:.3s;--w:100%"></i></span><b class="tf-in"' + _d(1.0) + '>20 h a day</b></div>'
    '<div class="tf-hb"><span>With automation</span><span class="tf-bar2"><i class="tf-fill ok" style="--d:1.4s;--w:28%"></i></span><b class="tf-in"' + _d(2.1) + '>5.6 h a day</b></div>'
    '<div class="tf-team"><span class="tf-lbl tf-in"' + _d(2.6) + '>Your team of 3</span><div class="tf-ppl">' +
    "".join(f'<span class="tf-p{" free" if k < 2 else ""}"{_d(2.8+k*.3)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>' for k in range(3)) +
    '</div><b class="tf-big tf-pop"' + _d(3.9) + '>≈ 1.8 FTE freed</b></div></div>'
    '<div class="fig-f"><span>1 FTE = one person working full time</span><span>example numbers</span></div></div>')
