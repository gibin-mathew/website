/* Visit tracking for gibin.in, on top of GoatCounter (privacy-friendly: no cookies, no personal data).

   1. Where did this visit come from? The first page of a visit is classified once:
        AI · ChatGPT / Perplexity / Claude / Gemini / Copilot ...
        Search · Google / Bing / DuckDuckGo ...
        Social · LinkedIn / X / Reddit / Hacker News ...
        Resume · <company>   (gibin.in/<company> short links on resumes)
        Email · Gmail / Outlook,  Jobs · Naukri ...,  Dev · GitHub / dev.to ...
        Referral · <site>,  Direct
      ?utm_source / ?ref / ?source in the landing URL win over the browser referrer.
   2. The label is kept in sessionStorage, so every later page of the same visit
      is credited to the same source (GoatCounter's "Top referrers" then shows,
      under each source, which pages that visit went on to read).
   3. Events (GoatCounter "events", same source label):
        click/email, click/copy-email, click/linkedin, click/github, click/chess.com,
        out/<host>, tool/<slug>/used, tool/<slug>/download, chess/solved-<n>
   Off the live domain nothing is sent; calls are printed to the console instead. */
(function () {
  'use strict';
  var d = document, w = window, L = location;
  var live = /(^|\.)gibin\.in$/.test(L.hostname);
  var KEY = 'gm-src';

  var AI = [['chatgpt.com', 'ChatGPT'], ['chat.openai.com', 'ChatGPT'], ['openai.com', 'ChatGPT'], ['perplexity.ai', 'Perplexity'],
    ['claude.ai', 'Claude'], ['anthropic.com', 'Claude'], ['gemini.google.com', 'Gemini'], ['bard.google.com', 'Gemini'],
    ['copilot.microsoft.com', 'Copilot'], ['copilot.cloud.microsoft', 'Copilot'], ['edgeservices.bing.com', 'Copilot'],
    ['chat.deepseek.com', 'DeepSeek'], ['deepseek.com', 'DeepSeek'], ['meta.ai', 'Meta AI'], ['grok.com', 'Grok'], ['x.ai', 'Grok'],
    ['you.com', 'You.com'], ['phind.com', 'Phind'], ['poe.com', 'Poe'], ['chat.mistral.ai', 'Mistral'], ['kagi.com/assistant', 'Kagi Assistant']];
  var SEARCH = [[/(^|\.)google\.[a-z.]+$/, 'Google'], [/(^|\.)bing\.com$/, 'Bing'], [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
    [/(^|\.)yahoo\.[a-z.]+$/, 'Yahoo'], [/(^|\.)ecosia\.org$/, 'Ecosia'], [/(^|\.)baidu\.com$/, 'Baidu'], [/(^|\.)yandex\.[a-z.]+$/, 'Yandex'],
    [/^search\.brave\.com$/, 'Brave Search'], [/(^|\.)startpage\.com$/, 'Startpage'], [/(^|\.)qwant\.com$/, 'Qwant'], [/(^|\.)naver\.com$/, 'Naver'],
    [/(^|\.)kagi\.com$/, 'Kagi']];
  var SOCIAL = [[/(^|\.)linkedin\.com$|^lnkd\.in$/, 'LinkedIn'], [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, 'X'],
    [/(^|\.)facebook\.com$|^fb\.me$/, 'Facebook'], [/(^|\.)instagram\.com$/, 'Instagram'], [/(^|\.)reddit\.com$/, 'Reddit'],
    [/^news\.ycombinator\.com$/, 'Hacker News'], [/(^|\.)youtube\.com$|^youtu\.be$/, 'YouTube'], [/(^|\.)whatsapp\.com$|^wa\.me$/, 'WhatsApp'],
    [/(^|\.)t\.me$|(^|\.)telegram\.org$/, 'Telegram'], [/(^|\.)threads\.net$/, 'Threads'], [/(^|\.)quora\.com$/, 'Quora'], [/(^|\.)slack\.com$/, 'Slack']];
  var EMAIL = [[/^mail\.google\.com$/, 'Gmail'], [/(^|\.)outlook\.(live|office|office365)\.com$/, 'Outlook'], [/^mail\.yahoo\.com$/, 'Yahoo Mail'],
    [/(^|\.)proton\.me$/, 'Proton Mail']];
  var JOBS = [[/(^|\.)naukri\.com$/, 'Naukri'], [/(^|\.)indeed\.[a-z.]+$/, 'Indeed'], [/(^|\.)glassdoor\.[a-z.]+$/, 'Glassdoor'],
    [/(^|\.)instahyre\.com$/, 'Instahyre'], [/(^|\.)iimjobs\.com$/, 'iimjobs'], [/(^|\.)hirist\.(tech|com)$/, 'hirist'], [/(^|\.)foundit\.(in|com)$/, 'foundit'],
    [/(^|\.)wellfound\.com$/, 'Wellfound'], [/(^|\.)bayt\.com$/, 'Bayt'], [/(^|\.)naukrigulf\.com$/, 'NaukriGulf']];
  var DEV = [[/(^|\.)github\.com$/, 'GitHub'], [/^dev\.to$/, 'dev.to'], [/(^|\.)medium\.com$/, 'Medium'], [/(^|\.)stackoverflow\.com$/, 'Stack Overflow'],
    [/(^|\.)hashnode\.(com|dev)$/, 'Hashnode'], [/(^|\.)chess\.com$/, 'Chess.com']];
  /* Android apps send "android-app://<package>" as the referrer */
  var APPS = { 'com.google.android.gm': 'Email · Gmail', 'com.google.android.googlequicksearchbox': 'Search · Google',
    'com.google.android.gemini': 'AI · Gemini', 'com.openai.chatgpt': 'AI · ChatGPT', 'ai.perplexity.app.android': 'AI · Perplexity',
    'com.anthropic.claude': 'AI · Claude', 'com.linkedin.android': 'Social · LinkedIn', 'com.twitter.android': 'Social · X',
    'com.whatsapp': 'Social · WhatsApp', 'org.telegram.messenger': 'Social · Telegram', 'com.reddit.frontpage': 'Social · Reddit',
    'com.microsoft.office.outlook': 'Email · Outlook', 'com.slack': 'Social · Slack', 'naukriApp.appModules.login': 'Jobs · Naukri' };
  /* ?ref= values used on gibin.in short links and in shared links */
  var REF = { resume: 'Resume', cv: 'Resume', linkedin: 'Social · LinkedIn', github: 'Dev · GitHub', whatsapp: 'Social · WhatsApp',
    email: 'Email', instagram: 'Social · Instagram', x: 'Social · X', twitter: 'Social · X', naukri: 'Jobs · Naukri', reddit: 'Social · Reddit',
    hn: 'Social · Hacker News', devto: 'Dev · dev.to', medium: 'Dev · Medium', qr: 'QR code', chatgpt: 'AI · ChatGPT', perplexity: 'AI · Perplexity' };

  function pick(list, host) { for (var i = 0; i < list.length; i++) if (list[i][0].test(host)) return list[i][1]; return ''; }
  function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } }

  /* classify a host (or a source name from utm_source) into "Channel · Name" */
  function classify(host, full) {
    if (!host) return '';
    var h = host.replace(/^www\./, '').toLowerCase(), f = (full || h).toLowerCase(), i;
    for (i = 0; i < AI.length; i++) if (h === AI[i][0] || h.slice(-AI[i][0].length - 1) === '.' + AI[i][0] || f.indexOf(AI[i][0]) === 0) return 'AI · ' + AI[i][1];
    var n;
    if ((n = pick(EMAIL, h))) return 'Email · ' + n;
    if ((n = pick(SEARCH, h))) return 'Search · ' + n;
    if ((n = pick(SOCIAL, h))) return 'Social · ' + n;
    if ((n = pick(JOBS, h))) return 'Jobs · ' + n;
    if ((n = pick(DEV, h))) return 'Dev · ' + n;
    return '';
  }

  function sourceFromUrl() {
    var q; try { q = new URLSearchParams(L.search); } catch (e) { return ''; }
    var ref = (q.get('ref') || '').toLowerCase().trim();
    var src = (q.get('utm_source') || q.get('source') || '').toLowerCase().trim();
    var camp = (q.get('utm_campaign') || '').trim();
    var label = '';
    if (ref) label = REF[ref] || classify(ref) || ('Referral · ' + ref);
    else if (src) label = REF[src] || classify(src.indexOf('.') > -1 ? src : src + '.com') || ('Campaign · ' + src);
    if (label && camp) label += ' · ' + camp;
    else if (!label && camp) label = 'Campaign · ' + camp;
    return label.slice(0, 120);
  }

  function sourceFromReferrer() {
    var r = d.referrer || '';
    if (!r) return 'Direct';
    var m = /^android-app:\/\/([^/]+)/.exec(r);
    if (m) return APPS[m[1]] || ('App · ' + m[1]);
    var host = hostOf(r);
    if (!host) return 'Direct';
    if (/(^|\.)gibin\.in$/.test(host) || host === L.hostname) return 'Direct';   /* own site, no stored visit (e.g. new tab) */
    var path = ''; try { path = new URL(r).pathname; } catch (e) {}
    return classify(host, host + path) || ('Referral · ' + host);
  }

  function store(get, v) {
    try { if (get) return sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, v); } catch (e) { return null; }
  }

  /* the visit's source: a tagged URL starts a new attribution, otherwise keep what this visit started with */
  var fromUrl = sourceFromUrl();
  var label = fromUrl || store(true) || sourceFromReferrer();
  store(false, label);

  /* ---------- sending ---------- */
  var queue = [], ready = false;
  function send(o) {
    o.referrer = label;
    if (!live) { if (w.console) console.log('[track]', o); return; }
    if (ready && w.goatcounter && w.goatcounter.count) { try { w.goatcounter.count(o); } catch (e) {} }
    else queue.push(o);
  }
  var sent = {};
  function event(path, title, once) {
    if (once) { if (sent[path]) return; sent[path] = 1; }
    send({ path: path, title: title || path, event: true });
  }
  w.gmTrack = event;

  if (live) {
    w.goatcounter = { no_onload: true };
    var g = d.createElement('script');
    g.async = true; g.src = 'https://gc.zgo.at/count.js';
    g.setAttribute('data-goatcounter', 'https://gibin.goatcounter.com/count');
    g.onload = function () {
      ready = true;
      var q = queue; queue = [];
      q.forEach(function (o) { try { w.goatcounter.count(o); } catch (e) {} });
    };
    d.head.appendChild(g);
  }

  /* page view: the path without query, credited to the visit's source */
  send({ path: L.pathname });
  /* tidy ?ref / utm tags out of the address bar once they've been read */
  if (/[?&](ref|source|utm_[a-z]+)=/.test(L.search)) { try { history.replaceState(null, '', L.pathname + L.hash); } catch (e) {} }

  /* ---------- events ---------- */
  d.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#copyBtn')) { event('click/copy-email', 'Copied email address'); return; }
    var a = t.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) { event('click/email', 'Email link'); return; }
    if (/^tel:/i.test(href)) { event('click/phone', 'Phone link'); return; }
    var host = hostOf(a.href);
    if (!host || /(^|\.)gibin\.in$/.test(host) || host === L.hostname) return;
    if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(host)) event('click/linkedin', 'LinkedIn: ' + (a.textContent || '').trim().slice(0, 60));
    else if (/(^|\.)github\.com$/.test(host)) event('click/github', 'GitHub');
    else if (/(^|\.)chess\.com$/.test(host)) event('click/chess.com', 'Chess.com profile');
    else event('out/' + host, 'Outbound: ' + host);
  }, true);

  /* tools: first real use, and downloads/copies of the result */
  var tm = /^\/tools\/([a-z0-9-]+)\/?$/.exec(L.pathname);
  if (tm) {
    var slug = tm[1];
    var inTool = function (el) { return el && el.closest && el.closest('.toolsec'); };
    d.addEventListener('click', function (e) {
      var b = e.target && e.target.closest && e.target.closest('button, [role="button"], a[download]');
      if (!b || !inTool(b)) return;
      var txt = ((b.id || '') + ' ' + (b.textContent || '')).toLowerCase();
      if (/\b(dl|download|export|save)\b/.test(txt) || b.hasAttribute('download')) event('tool/' + slug + '/download', 'Tool download: ' + slug);
      else if (/\bcopy\b/.test(txt)) event('tool/' + slug + '/copy', 'Tool copy: ' + slug);
      else event('tool/' + slug + '/used', 'Tool used: ' + slug, true);
    }, true);
    ['change', 'drop', 'paste'].forEach(function (ev) {
      d.addEventListener(ev, function (e) { if (inTool(e.target)) event('tool/' + slug + '/used', 'Tool used: ' + slug, true); }, true);
    });
    /* typing into a tool counts once the text is substantial (a pasted list, an MRZ line) */
    d.addEventListener('input', function (e) {
      var el = e.target;
      if (inTool(el) && el.value && String(el.value).length > 20) event('tool/' + slug + '/used', 'Tool used: ' + slug, true);
    }, true);
  }
})();
