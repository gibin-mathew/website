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
  <div class="fig-f"><span data-status>Portal A submitted, same engine</span><span>sample data</span></div>
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
  <div class="fig-f"><span>logic stays in one engine</span><span>illustration</span></div>
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
