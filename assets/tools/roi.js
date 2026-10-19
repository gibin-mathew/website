/* Automation savings and FTE calculator. gibin.in/tools/automation-roi-calculator/
   Plain-language inputs, everything optional except the work itself, money only if asked for. */
(function () {
  'use strict';
  var $ = T.$, tool = $('#tool');
  var CUR = { INR: ['₹', 'en-IN'], USD: ['$', 'en-US'], EUR: ['€', 'de-DE'], GBP: ['£', 'en-GB'], AED: ['AED ', 'en-US'], SGD: ['S$', 'en-US'], AUD: ['A$', 'en-AU'], CAD: ['C$', 'en-CA'] };
  var IDS = ['jobs', 'per', 'mins', 'unit', 'people', 'auto', 'check', 'hday', 'days', 'money', 'cur', 'mode', 'ctc', 'cjob', 'build', 'run'];
  var calculated = false;

  // sensible currency from the visitor's locale
  (function () {
    var l = (navigator.language || '').toLowerCase(), tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var c = /kolkata|calcutta/i.test(tz) || /-in$|^hi|^ta|^te|^ml|^kn|^mr|^bn/.test(l) ? 'INR' : /-gb$/.test(l) ? 'GBP' : /-ae$|^ar/.test(l) ? 'AED' : /-sg$/.test(l) ? 'SGD' :
      /-au$/.test(l) ? 'AUD' : /-ca$/.test(l) ? 'CAD' : /^(de|fr|es|it|nl|pt|fi|el|sk|sl|et|lv|lt)/.test(l) ? 'EUR' : 'USD';
    $('#cur').value = c;
  })();

  // a shared link fills the form
  (function () {
    var q = new URLSearchParams(location.search), any = false;
    IDS.forEach(function (k) {
      if (!q.has(k)) return; var el = $('#' + k); any = true;
      if (el.type === 'checkbox') el.checked = q.get(k) === '1'; else el.value = q.get(k);
    });
    if (any) setTimeout(function () { go(true); }, 0);
  })();

  function num(id) { var v = parseFloat(String($('#' + id).value).replace(/,/g, '')); return isFinite(v) ? v : null; }
  function fx(x, d) { return (Math.round(x * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('en-US'); }
  function hrs(h) { return h >= 100 ? fx(h, 0) : h >= 10 ? fx(h, 1) : fx(h, 2); }
  function money(x, short) {
    var c = $('#cur').value, cur = CUR[c], neg = x < 0, a = Math.abs(x), s;
    if (c === 'INR' && a >= 1e7) s = fx(a / 1e7, 2) + ' crore';
    else if (c === 'INR' && a >= 1e5) s = fx(a / 1e5, 2) + ' lakh';
    else if (a >= 1e6 && short) s = fx(a / 1e6, 2) + 'M';
    else s = Math.round(a).toLocaleString(cur[1]);
    return (neg ? '−' : '') + cur[0] + s;
  }

  function syncUI() {
    $('#money-box').hidden = !$('#money').checked;
    var ctc = $('#mode').value === 'ctc';
    $('#ctc-f').hidden = !ctc; $('#cjob-f').hidden = ctc;
    T.$$('[data-sym]', tool).forEach(function (s) { s.textContent = CUR[$('#cur').value][0].trim(); });
    $('#autov').textContent = $('#auto').value + '%';
    var hd = num('hday') || 8, dd = num('days') || 22;
    $('#fte-def').innerHTML = '1 FTE = ' + fx(hd, 1) + ' h × ' + fx(dd, 1) + ' days = <b>' + fx(hd * dd, 0) + ' hours a month</b>';
  }
  tool.addEventListener('input', function () { syncUI(); if (calculated) go(true); });
  tool.addEventListener('change', function () { syncUI(); if (calculated) go(true); });
  $('#calc').addEventListener('click', function () { go(false); });
  $('[data-sample]', tool).addEventListener('click', function () {
    var v = { jobs: 120, per: 'day', mins: 10, unit: 'min', people: 3, auto: 80, check: 1, hday: 8, days: 22, ctc: 600000, cjob: '', build: 400000, run: 15000 };
    Object.keys(v).forEach(function (k) { $('#' + k).value = v[k]; });
    $('#money').checked = true; $('#mode').value = 'ctc'; $('#cur').value = 'INR';
    syncUI(); go(false);
  });

  function err(id, msg) {
    var f = $('#' + id).closest('.fld'); f.classList.add('bad');
    var m = T.$('.ferr', f); if (!m) { m = document.createElement('em'); m.className = 'ferr'; f.appendChild(m); }
    m.textContent = msg;
  }
  function clearErr() { T.$$('.fld.bad', tool).forEach(function (f) { f.classList.remove('bad'); var m = T.$('.ferr', f); if (m) m.remove(); }); }

  var R = null;
  function go(quiet) {
    clearErr();
    var jobs = num('jobs'), mins = num('mins'), problems = [];
    if (jobs == null || jobs <= 0) { problems.push('jobs'); if (!quiet) err('jobs', 'Enter how many jobs, for example 120'); }
    if (mins == null || mins <= 0) { problems.push('mins'); if (!quiet) err('mins', 'Enter how long one job takes, for example 10'); }
    if (problems.length) { if (!quiet) { $('#' + problems[0]).focus(); $('#res').hidden = true; } return; }
    var per = $('#per').value, unit = $('#unit').value;
    var hday = Math.max(0.5, num('hday') || 8), days = Math.max(1, num('days') || 22), fteH = hday * days;
    var jobsMonth = per === 'day' ? jobs * days : per === 'week' ? jobs * 52 / 12 : jobs;
    var minJob = unit === 'hr' ? mins * 60 : mins;
    var auto = Math.min(100, Math.max(0, num('auto') || 0)) / 100, check = Math.max(0, num('check') || 0);
    var before = jobsMonth * minJob / 60, autoJobs = jobsMonth * auto, manualJobs = jobsMonth - autoJobs;
    var after = manualJobs * minJob / 60 + autoJobs * check / 60, saved = before - after;
    var people = num('people'); if (people != null && people <= 0) people = null;
    var r = { jobs: jobs, per: per, mins: mins, unit: unit, minJob: minJob, hday: hday, days: days, fteH: fteH, jobsMonth: jobsMonth, auto: auto, check: check,
      before: before, after: after, saved: saved, autoJobs: autoJobs, manualJobs: manualJobs, fteBefore: before / fteH, fteAfter: after / fteH, fteSaved: saved / fteH, people: people };
    if ($('#money').checked) {
      var mode = $('#mode').value, ctc = num('ctc'), cjob = num('cjob');
      var hourly = mode === 'ctc' ? (ctc ? ctc / (12 * fteH) : null) : (cjob ? cjob * 60 / minJob : null);
      if (hourly == null && !quiet) err(mode === 'ctc' ? 'ctc' : 'cjob', mode === 'ctc' ? 'Enter the yearly cost of one employee, or switch off money' : 'Enter the cost of one job, or switch off money');
      if (hourly != null) {
        r.money = { mode: mode, ctc: ctc, cjob: cjob, hourly: hourly, build: num('build') || 0, run: num('run') || 0 };
        r.money.gross = saved * hourly; r.money.net = r.money.gross - r.money.run;
        r.money.payback = r.money.net > 0 ? r.money.build / r.money.net : Infinity;
      }
    }
    R = r; calculated = true;
    render(); share();
    $('#res').hidden = false;
    if (!quiet) $('#res').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function render() {
    var r = R, m = r.money;
    // headline
    if (r.saved <= 0) {
      $('#headline').innerHTML = 'With these numbers automation <b class="neg">doesn\'t save time</b>: the work goes from ' + hrs(r.before) + ' to ' + hrs(r.after) + ' hours a month. Usually that means the checking time per automated job is too high, or very little of the work is automated.';
      $('#tiles').innerHTML = '<div class="bad"><b>' + hrs(r.saved) + '</b><span>hours a month (more work, not less)</span></div><div class="bad"><b>' + fx(r.fteSaved, 2) + '</b><span>FTE</span></div>';
      T.say($('#warn'), '', ''); bars(); team(); math(); $('#chart-w').hidden = true; return;
    }
    var head = 'Automation would save about <b>' + hrs(r.saved) + ' hours a month</b>, the work of <b>' + fx(r.fteSaved, r.fteSaved < 10 ? 1 : 0) + ' full-time ' + (Math.round(r.fteSaved * 10) / 10 === 1 ? 'person' : 'people') + '</b>.';
    if (r.people) head += ' That\'s <b>' + fx(100 * r.saved / (r.people * r.fteH), 0) + '%</b> of your ' + fx(r.people) + '-person team\'s working time.';
    if (m) head += ' In money, about <b>' + money(m.net * 12) + ' a year</b>' + (m.build ? (isFinite(m.payback) ? ', and the build pays for itself in <b>' + (m.payback < 1 ? 'under a month' : fx(m.payback, 1) + ' months') + '</b>' : ', but the running cost is higher than the saving, so it never pays back') : '') + '.';
    $('#headline').innerHTML = head;
    // tiles
    var t = '<div class="ok"><b>' + hrs(r.saved) + '</b><span>hours saved a month</span></div><div class="ok"><b>' + fx(r.fteSaved, 2) + '</b><span>FTE freed up</span></div>';
    if (r.people) t += '<div><b>' + fx(100 * r.saved / (r.people * r.fteH), 0) + '%</b><span>of the team\'s time freed</span></div>';
    if (m) {
      t += '<div class="' + (m.net > 0 ? 'ok' : 'bad') + '"><b>' + money(m.net * 12, true) + '</b><span>saved a year, after running costs</span></div>';
      if (m.build) t += '<div class="' + (isFinite(m.payback) ? 'ok' : 'bad') + '"><b>' + (isFinite(m.payback) ? (m.payback < 1 ? '< 1' : fx(m.payback, 1)) + ' mo' : 'never') + '</b><span>to pay back the build</span></div>' +
        '<div class="' + (m.net * 36 - m.build > 0 ? 'ok' : 'bad') + '"><b>' + money(m.net * 36 - m.build, true) + '</b><span>net gain over 3 years</span></div>';
    }
    $('#tiles').innerHTML = t;
    // warnings
    var w = [];
    if (r.people && r.before > r.people * r.fteH * 1.1) w.push('Today\'s workload (' + hrs(r.before) + ' hours a month) is more than ' + fx(r.people) + ' people can do in their ' + fx(r.people * r.fteH) + ' working hours. Check the job count or time per job, or they are working a lot of overtime.');
    if (r.auto >= 0.99) w.push('Almost no automation finishes 100% of jobs. Inputs arrive broken and systems change. 70 to 90% is a realistic plan.');
    if (r.check >= r.minJob) w.push('Checking each automated job takes as long as doing it by hand, so automation saves nothing on those jobs.');
    if (m && m.net <= 0) w.push('The monthly running cost is higher than the monthly saving.');
    T.say($('#warn'), w.join(' '), 'warn');
    bars(); team(); math();
    $('#chart-w').hidden = !(m && m.build);
    if (m && m.build) chart();
  }

  function bars() {
    var r = R, mx = Math.max(r.before, 0.0001);
    function bar(label, h, cls, d) { return '<div class="ba-r"><span>' + label + '</span><span class="ba-t"><i class="' + cls + '" style="width:' + (100 * h / mx) + '%"></i></span><b>' + hrs(h) + ' h</b></div>'; }
    $('#bars').innerHTML = '<div class="bd-t">Hours of work a month</div>' + bar('Today, by hand', r.before, 'warn') + bar('With automation', r.after, 'ok') +
      '<p class="ba-note">The green bar is what is left for people: the ' + fx(r.manualJobs, 0) + ' jobs the automation hands back' + (r.check ? ', plus ' + fx(r.check, 1) + ' min of checking on each automated one' : '') + '.</p>';
  }

  function team() {
    var r = R, n = r.people || Math.max(1, Math.ceil(r.fteBefore)), scale = 1;
    if (n > 30) { scale = Math.ceil(n / 30); }
    var icons = Math.ceil(n / scale), freed = r.fteSaved / scale, html = '';
    for (var i = 0; i < icons; i++) {
      var f = Math.max(0, Math.min(1, freed - i));
      html += '<span class="pp" style="--f:' + (f * 100).toFixed(0) + '%"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg></span>';
    }
    var label = r.people ? 'Your team of ' + fx(r.people) : 'The work today is about ' + fx(r.fteBefore, 1) + ' full-time ' + (r.fteBefore <= 1.05 ? 'person' : 'people');
    $('#team').innerHTML = '<div class="bd-t">' + label + (scale > 1 ? ' (each figure = ' + scale + ' people)' : '') + '</div><div class="pps" role="img" aria-label="' + fx(r.fteSaved, 1) + ' full-time people freed">' + html + '</div>' +
      '<div class="pp-key"><span><i class="g"></i>freed by automation: ' + fx(r.fteSaved, 2) + ' FTE</span><span><i></i>still needed</span></div>';
  }

  function math() {
    var r = R, m = r.money, L = [];
    var perTxt = r.per === 'day' ? fx(r.jobs) + ' jobs a day × ' + fx(r.days, 1) + ' working days' : r.per === 'week' ? fx(r.jobs) + ' jobs a week × 52 weeks ÷ 12 months' : fx(r.jobs) + ' jobs a month';
    L.push(['Jobs a month', perTxt + ' = <b>' + fx(r.jobsMonth, 0) + ' jobs</b>']);
    L.push(['Hours today', fx(r.jobsMonth, 0) + ' jobs × ' + fx(r.minJob, 2) + ' min ÷ 60 = <b>' + hrs(r.before) + ' hours a month</b>']);
    L.push(['Jobs the automation finishes', fx(r.jobsMonth, 0) + ' × ' + fx(r.auto * 100, 0) + '% = <b>' + fx(r.autoJobs, 0) + ' jobs</b>, so ' + fx(r.manualJobs, 0) + ' still go to a person']);
    L.push(['Hours still needed', fx(r.manualJobs, 0) + ' jobs × ' + fx(r.minJob, 2) + ' min' + (r.check ? ' + ' + fx(r.autoJobs, 0) + ' automated jobs × ' + fx(r.check, 2) + ' min of checking' : '') + ', ÷ 60 = <b>' + hrs(r.after) + ' hours a month</b>']);
    L.push(['Hours saved', hrs(r.before) + ' − ' + hrs(r.after) + ' = <b>' + hrs(r.saved) + ' hours a month</b> (' + fx(r.saved * 12, 0) + ' a year)']);
    L.push(['One FTE', fx(r.hday, 1) + ' hours a day × ' + fx(r.days, 1) + ' days = <b>' + fx(r.fteH, 0) + ' hours a month</b>']);
    L.push(['FTE freed', hrs(r.saved) + ' ÷ ' + fx(r.fteH, 0) + ' = <b>' + fx(r.fteSaved, 2) + ' FTE</b>']);
    if (r.people) L.push(['Share of the team', hrs(r.saved) + ' ÷ (' + fx(r.people) + ' people × ' + fx(r.fteH, 0) + ' h) = <b>' + fx(100 * r.saved / (r.people * r.fteH), 1) + '%</b>']);
    if (m) {
      L.push(['Cost of one hour of work', m.mode === 'ctc' ? money(m.ctc) + ' a year ÷ (12 × ' + fx(r.fteH, 0) + ' h) = <b>' + money(m.hourly) + ' an hour</b>' : money(m.cjob) + ' per job ÷ ' + fx(r.minJob, 2) + ' min × 60 = <b>' + money(m.hourly) + ' an hour</b>']);
      L.push(['Money saved a month', hrs(r.saved) + ' h × ' + money(m.hourly) + (m.run ? ' − ' + money(m.run) + ' running cost' : '') + ' = <b>' + money(m.net) + '</b>']);
      L.push(['A year', money(m.net) + ' × 12 = <b>' + money(m.net * 12) + '</b>']);
      if (m.build) {
        L.push(['Payback', money(m.build) + ' build ÷ ' + money(m.net) + ' a month = <b>' + (isFinite(m.payback) ? fx(m.payback, 1) + ' months' : 'never') + '</b>']);
        L.push(['Over 3 years', money(m.net) + ' × 36 − ' + money(m.build) + ' = <b>' + money(m.net * 36 - m.build) + '</b>']);
      }
    }
    $('#math').innerHTML = '<ol>' + L.map(function (x) { return '<li><span>' + x[0] + '</span><span>' + x[1] + '</span></li>'; }).join('') + '</ol>';
  }

  /* cumulative money position, one series, payback marked */
  function chart() {
    var r = R, m = r.money, n = 36, pts = [];
    for (var k = 0; k <= n; k++) pts.push(-m.build + m.net * k);
    var box = $('#chart'), W = Math.max(280, Math.round(box.clientWidth || 700)), H = W < 520 ? 220 : 260, pl = W < 520 ? 70 : 84, pr = 14, pt = 18, pb = 30;
    var lo = Math.min(0, Math.min.apply(null, pts)), hi = Math.max(0, Math.max.apply(null, pts)); if (hi === lo) hi = lo + 1;
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var x = function (i) { return pl + (W - pl - pr) * i / n; }, y = function (v) { return pt + (H - pt - pb) * (hi - v) / (hi - lo); };
    var g = '', xt = '';
    ticks(lo, hi).forEach(function (t) { g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(t) + '" y2="' + y(t) + '" class="g' + (t === 0 ? ' z' : '') + '"/><text x="' + (pl - 8) + '" y="' + (y(t) + 4) + '" class="yl">' + T.esc(money(t, true)) + '</text>'; });
    for (var q = 0; q <= n; q += (W < 520 ? 12 : 6)) xt += '<text x="' + x(q) + '" y="' + (H - 9) + '" class="xl"' + (q === n ? ' text-anchor="end"' : q === 0 ? ' text-anchor="start"' : '') + '>' + (q ? (W < 520 ? 'm' : 'month ') + q : 'start') + '</text>';
    var d = pts.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var pbm = '';
    if (isFinite(m.payback) && m.payback <= n) {
      var px = x(m.payback), anchor = m.payback > n * 0.6 ? 'end' : 'start';
      pbm = '<circle cx="' + px + '" cy="' + y(0) + '" r="5" class="pb"/><text x="' + (px + (anchor === 'end' ? -8 : 8)) + '" y="' + (y(0) - 10) + '" class="pbl" text-anchor="' + anchor + '">pays back in month ' + fx(m.payback, 1) + '</text>';
    }
    box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Money position over 36 months: starts at ' + T.esc(money(-m.build)) + ', ends at ' + T.esc(money(pts[n])) + '.">' + g + xt +
      '<path d="' + d + '" class="ln"/>' + pbm + '<line class="hx" x1="0" x2="0" y1="' + pt + '" y2="' + (H - pb) + '" visibility="hidden"/><circle class="hd" r="5" visibility="hidden"/>' +
      '<rect x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + (H - pt - pb) + '" fill="transparent" class="hit"/></svg><div class="ctip" hidden></div>';
    var svg = $('svg', box), tip = $('.ctip', box), hx = $('.hx', svg), hd = $('.hd', svg);
    $('.hit', svg).addEventListener('pointermove', function (ev) {
      var b = svg.getBoundingClientRect(), i = Math.max(0, Math.min(n, Math.round(((ev.clientX - b.left) * W / b.width - pl) / (W - pl - pr) * n)));
      hx.setAttribute('x1', x(i)); hx.setAttribute('x2', x(i)); hx.setAttribute('visibility', 'visible');
      hd.setAttribute('cx', x(i)); hd.setAttribute('cy', y(pts[i])); hd.setAttribute('visibility', 'visible');
      tip.hidden = false; tip.innerHTML = '<b>' + (i ? 'Month ' + i : 'Start') + '</b>' + T.esc(money(pts[i])) + (pts[i] < 0 ? ' still to recover' : ' ahead');
      tip.style.left = Math.min(b.width - 160, Math.max(0, x(i) / W * b.width - 70)) + 'px'; tip.style.top = (y(pts[i]) / H * b.height - 54) + 'px';
    });
    $('.hit', svg).addEventListener('pointerleave', function () { hx.setAttribute('visibility', 'hidden'); hd.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  }
  function ticks(lo, hi) {
    var span = hi - lo, step = Math.pow(10, Math.floor(Math.log10(span / 4))), e = span / 4 / step;
    if (e >= 7.5) step *= 10; else if (e >= 3.5) step *= 5; else if (e >= 1.5) step *= 2;
    var out = []; for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.abs(v) < step / 1e6 ? 0 : v);
    return out;
  }
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (R && R.money && R.money.build) chart(); }, 150); });

  function share() {
    var q = new URLSearchParams();
    IDS.forEach(function (k) { var el = $('#' + k); var v = el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value; if (v !== '') q.set(k, v); });
    R.url = location.origin + location.pathname + '?' + q.toString();
  }
  $('#share').addEventListener('click', function (e) { if (R) T.copy(R.url, e.currentTarget); });
  $('#summary').addEventListener('click', function (e) {
    if (!R) return;
    var tmp = document.createElement('div'); tmp.innerHTML = $('#headline').innerHTML;
    var lines = T.$$('#math li').map(function (li) { return '- ' + li.children[0].textContent + ': ' + li.children[1].textContent; });
    T.copy('Automation business case\n' + tmp.textContent + '\n\nHow it was worked out\n' + lines.join('\n') + '\n\n' + R.url + '\n', e.currentTarget);
  });
  syncUI();
})();
