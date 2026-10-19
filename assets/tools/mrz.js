/* Passport and ID card MRZ parser with ICAO 9303 check digits. gibin.in/tools/mrz-parser/ */
(function () {
  'use strict';
  var COUNTRY = {"ABW":"Aruba","AFG":"Afghanistan","AGO":"Angola","AIA":"Anguilla","ALA":"Åland Islands","ALB":"Albania","AND":"Andorra","ARE":"United Arab Emirates","ARG":"Argentina","ARM":"Armenia","ASM":"American Samoa","ATA":"Antarctica","ATF":"French Southern Territories","ATG":"Antigua and Barbuda","AUS":"Australia","AUT":"Austria","AZE":"Azerbaijan","BDI":"Burundi","BEL":"Belgium","BEN":"Benin","BES":"Bonaire, Sint Eustatius and Saba","BFA":"Burkina Faso","BGD":"Bangladesh","BGR":"Bulgaria","BHR":"Bahrain","BHS":"Bahamas","BIH":"Bosnia and Herzegovina","BLM":"Saint Barthélemy","BLR":"Belarus","BLZ":"Belize","BMU":"Bermuda","BOL":"Bolivia","BRA":"Brazil","BRB":"Barbados","BRN":"Brunei Darussalam","BTN":"Bhutan","BVT":"Bouvet Island","BWA":"Botswana","CAF":"Central African Republic","CAN":"Canada","CCK":"Cocos (Keeling) Islands","CHE":"Switzerland","CHL":"Chile","CHN":"China","CIV":"Côte d'Ivoire","CMR":"Cameroon","COD":"Congo, The Democratic Republic of the","COG":"Congo","COK":"Cook Islands","COL":"Colombia","COM":"Comoros","CPV":"Cabo Verde","CRI":"Costa Rica","CUB":"Cuba","CUW":"Curaçao","CXR":"Christmas Island","CYM":"Cayman Islands","CYP":"Cyprus","CZE":"Czechia","DEU":"Germany","DJI":"Djibouti","DMA":"Dominica","DNK":"Denmark","DOM":"Dominican Republic","DZA":"Algeria","ECU":"Ecuador","EGY":"Egypt","ERI":"Eritrea","ESH":"Western Sahara","ESP":"Spain","EST":"Estonia","ETH":"Ethiopia","FIN":"Finland","FJI":"Fiji","FLK":"Falkland Islands (Malvinas)","FRA":"France","FRO":"Faroe Islands","FSM":"Micronesia, Federated States of","GAB":"Gabon","GBR":"United Kingdom","GEO":"Georgia","GGY":"Guernsey","GHA":"Ghana","GIB":"Gibraltar","GIN":"Guinea","GLP":"Guadeloupe","GMB":"Gambia","GNB":"Guinea-Bissau","GNQ":"Equatorial Guinea","GRC":"Greece","GRD":"Grenada","GRL":"Greenland","GTM":"Guatemala","GUF":"French Guiana","GUM":"Guam","GUY":"Guyana","HKG":"Hong Kong","HMD":"Heard Island and McDonald Islands","HND":"Honduras","HRV":"Croatia","HTI":"Haiti","HUN":"Hungary","IDN":"Indonesia","IMN":"Isle of Man","IND":"India","IOT":"British Indian Ocean Territory","IRL":"Ireland","IRN":"Iran","IRQ":"Iraq","ISL":"Iceland","ISR":"Israel","ITA":"Italy","JAM":"Jamaica","JEY":"Jersey","JOR":"Jordan","JPN":"Japan","KAZ":"Kazakhstan","KEN":"Kenya","KGZ":"Kyrgyzstan","KHM":"Cambodia","KIR":"Kiribati","KNA":"Saint Kitts and Nevis","KOR":"South Korea","KWT":"Kuwait","LAO":"Laos","LBN":"Lebanon","LBR":"Liberia","LBY":"Libya","LCA":"Saint Lucia","LIE":"Liechtenstein","LKA":"Sri Lanka","LSO":"Lesotho","LTU":"Lithuania","LUX":"Luxembourg","LVA":"Latvia","MAC":"Macao","MAF":"Saint Martin (French part)","MAR":"Morocco","MCO":"Monaco","MDA":"Moldova","MDG":"Madagascar","MDV":"Maldives","MEX":"Mexico","MHL":"Marshall Islands","MKD":"North Macedonia","MLI":"Mali","MLT":"Malta","MMR":"Myanmar","MNE":"Montenegro","MNG":"Mongolia","MNP":"Northern Mariana Islands","MOZ":"Mozambique","MRT":"Mauritania","MSR":"Montserrat","MTQ":"Martinique","MUS":"Mauritius","MWI":"Malawi","MYS":"Malaysia","MYT":"Mayotte","NAM":"Namibia","NCL":"New Caledonia","NER":"Niger","NFK":"Norfolk Island","NGA":"Nigeria","NIC":"Nicaragua","NIU":"Niue","NLD":"Netherlands","NOR":"Norway","NPL":"Nepal","NRU":"Nauru","NZL":"New Zealand","OMN":"Oman","PAK":"Pakistan","PAN":"Panama","PCN":"Pitcairn","PER":"Peru","PHL":"Philippines","PLW":"Palau","PNG":"Papua New Guinea","POL":"Poland","PRI":"Puerto Rico","PRK":"North Korea","PRT":"Portugal","PRY":"Paraguay","PSE":"Palestine, State of","PYF":"French Polynesia","QAT":"Qatar","REU":"Réunion","ROU":"Romania","RUS":"Russian Federation","RWA":"Rwanda","SAU":"Saudi Arabia","SDN":"Sudan","SEN":"Senegal","SGP":"Singapore","SGS":"South Georgia and the South Sandwich Islands","SHN":"Saint Helena, Ascension and Tristan da Cunha","SJM":"Svalbard and Jan Mayen","SLB":"Solomon Islands","SLE":"Sierra Leone","SLV":"El Salvador","SMR":"San Marino","SOM":"Somalia","SPM":"Saint Pierre and Miquelon","SRB":"Serbia","SSD":"South Sudan","STP":"Sao Tome and Principe","SUR":"Suriname","SVK":"Slovakia","SVN":"Slovenia","SWE":"Sweden","SWZ":"Eswatini","SXM":"Sint Maarten (Dutch part)","SYC":"Seychelles","SYR":"Syria","TCA":"Turks and Caicos Islands","TCD":"Chad","TGO":"Togo","THA":"Thailand","TJK":"Tajikistan","TKL":"Tokelau","TKM":"Turkmenistan","TLS":"Timor-Leste","TON":"Tonga","TTO":"Trinidad and Tobago","TUN":"Tunisia","TUR":"Türkiye","TUV":"Tuvalu","TWN":"Taiwan","TZA":"Tanzania","UGA":"Uganda","UKR":"Ukraine","UMI":"United States Minor Outlying Islands","URY":"Uruguay","USA":"United States","UZB":"Uzbekistan","VAT":"Holy See (Vatican City State)","VCT":"Saint Vincent and the Grenadines","VEN":"Venezuela","VGB":"Virgin Islands, British","VIR":"Virgin Islands, U.S.","VNM":"Vietnam","VUT":"Vanuatu","WLF":"Wallis and Futuna","WSM":"Samoa","YEM":"Yemen","ZAF":"South Africa","ZMB":"Zambia","ZWE":"Zimbabwe","D":"Germany","GBD":"British Overseas Territories Citizen","GBN":"British National (Overseas)","GBO":"British Overseas Citizen","GBP":"British Protected Person","GBS":"British Subject","UNO":"United Nations (official)","UNA":"United Nations (specialized agency)","UNK":"Kosovo (UNMIK)","RKS":"Kosovo","XXA":"Stateless person","XXB":"Refugee (1951 Convention)","XXC":"Refugee (other)","XXX":"Nationality not specified","EUE":"European Union","XOM":"Sovereign Military Order of Malta","XPO":"Interpol","XCC":"Caribbean Community","XES":"Organisation of Eastern Caribbean States","UTO":"Utopia (ICAO specimen)","XBA":"African Development Bank","XIM":"African Export-Import Bank","XCE":"Council of Europe","XEC":"ECOWAS"};
  var MRZ = {};
  var W = [7, 3, 1];
  function val(c) {
    if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
    return 0; // '<' and anything else
  }
  MRZ.check = function (s) { var t = 0; for (var i = 0; i < s.length; i++) t += val(s[i]) * W[i % 3]; return String(t % 10); };

  MRZ.clean = function (text) {
    var t = String(text).toUpperCase().replace(/[«‹]/g, '<').replace(/\r/g, '');
    var lines = t.split('\n').map(function (l) { return l.replace(/[\s]/g, ''); }).filter(Boolean);
    if (lines.length === 1) {
      var L = lines[0];
      if (L.length === 88) lines = [L.slice(0, 44), L.slice(44)];
      else if (L.length === 72) lines = [L.slice(0, 36), L.slice(36)];
      else if (L.length === 90) lines = [L.slice(0, 30), L.slice(30, 60), L.slice(60)];
    }
    return lines;
  };

  function name(f) {
    var trunc = f[f.length - 1] !== '<';
    var parts = f.replace(/<+$/, '').split('<<');
    return { surname: parts[0].replace(/</g, ' ').trim(), given: parts.slice(1).join(' ').replace(/</g, ' ').replace(/\s+/g, ' ').trim(), truncated: trunc };
  }

  function date(s, kind, today) {
    if (!/^[0-9<]{6}$/.test(s)) return { ok: false, text: s, note: 'not a date' };
    var yy = s.slice(0, 2), mm = s.slice(2, 4), dd = s.slice(4, 6);
    if (yy.indexOf('<') >= 0) return { ok: false, text: s, note: 'year unknown' };
    var cy = today.getUTCFullYear() % 100, y = +yy;
    var full = kind === 'birth' ? (y > cy ? 1900 + y : 2000 + y) : (y >= 70 && y > cy + 30 ? 1900 + y : 2000 + y);
    var mUnknown = mm === '<<', dUnknown = dd === '<<';
    if (!mUnknown && (+mm < 1 || +mm > 12)) return { ok: false, text: s, note: 'month ' + mm + ' does not exist' };
    if (!mUnknown && !dUnknown) {
      var d = new Date(Date.UTC(full, +mm - 1, +dd));
      if (d.getUTCMonth() !== +mm - 1 || +dd < 1) return { ok: false, text: s, note: 'day ' + dd + ' does not exist in that month' };
      return { ok: true, iso: full + '-' + mm + '-' + dd, date: d };
    }
    return { ok: true, iso: full + '-' + (mUnknown ? 'XX' : mm) + '-XX', partial: true };
  }

  var OCR = { 'O': '0', '0': 'O', 'I': '1', '1': 'I', 'B': '8', '8': 'B', 'S': '5', '5': 'S', 'Z': '2', '2': 'Z', 'G': '6', '6': 'G', 'D': '0', 'Q': '0' };
  // one-character OCR swaps that would make the check digit pass
  function suggest(value, digit) {
    var out = [];
    for (var i = 0; i < value.length; i++) {
      var r = OCR[value[i]]; if (!r) continue;
      var v = value.slice(0, i) + r + value.slice(i + 1);
      if (MRZ.check(v) === digit) out.push(v);
    }
    return out;
  }

  MRZ.parse = function (text, today) {
    today = today || new Date();
    var lines = MRZ.clean(text), res = { lines: lines, fields: [], checks: [], errors: [], warnings: [] };
    var lens = lines.map(function (l) { return l.length; });
    var fmt = null;
    if (lines.length === 3 && lens.every(function (n) { return n === 30; })) fmt = 'TD1';
    else if (lines.length === 2 && lens[0] === 44 && lens[1] === 44) fmt = lines[0][0] === 'V' ? 'MRV-A' : 'TD3';
    else if (lines.length === 2 && lens[0] === 36 && lens[1] === 36) fmt = lines[0][0] === 'V' ? 'MRV-B' : 'TD2';
    if (!fmt) {
      if (!lines.length) return null;
      var exp = lines.length === 3 ? 30 : lines.some(function (n) { return n.length > 40; }) ? 44 : 36;
      res.errors.push('Expected ' + (lines.length === 3 ? '3 lines of 30 characters (ID card, TD1)' : '2 lines of 44 (passport, TD3) or 2 lines of 36 (TD2)') + '. Got ' +
        lines.length + ' line' + (lines.length === 1 ? '' : 's') + ' of ' + lens.join(', ') + ' characters.' +
        (lens.some(function (n) { return n === exp - 1 || n === exp + 1; }) ? ' One character is missing or extra, often a "<" at the end.' : ''));
      return res;
    }
    res.format = fmt;
    var bad = [];
    lines.forEach(function (l, i) { for (var j = 0; j < l.length; j++) if (!/[A-Z0-9<]/.test(l[j])) bad.push('line ' + (i + 1) + ', position ' + (j + 1) + ' ("' + l[j] + '")'); });
    if (bad.length) res.errors.push('Characters that can\'t appear in an MRZ: ' + bad.slice(0, 5).join('; ') + (bad.length > 5 ? '…' : '') + '. Only A to Z, 0 to 9 and < are allowed.');

    var f = {}, ck = [];
    function chk(label, value, digit, spans) {
      var comp = MRZ.check(value), ok = comp === digit || (digit === '<' && /^<*$/.test(value));
      var item = { label: label, value: value, given: digit, computed: comp, ok: ok, spans: spans };
      if (!ok && label.indexOf('Composite') < 0) item.fix = suggest(value, digit);
      ck.push(item);
      return ok;
    }
    var l1 = lines[0], l2 = lines[1], l3 = lines[2], H = [];
    function mark(line, a, b, cls, title) { H.push({ line: line, a: a, b: b, cls: cls, title: title }); }
    if (fmt === 'TD1') {
      f.type = l1.slice(0, 2); f.state = l1.slice(2, 5);
      var dn = l1.slice(5, 14), dnc = l1[14], opt1 = l1.slice(15, 30), dnSpans = [[0, 5, 14], [0, 14, 15]];
      if (dnc === '<') { // long document number continues in the optional field
        var k = opt1.indexOf('<'); if (k < 0) k = opt1.length;
        dn = dn + opt1.slice(0, k - 1); dnc = opt1[k - 1]; opt1 = opt1.slice(k + 1); f.longDoc = true;
      }
      f.doc = dn.replace(/<+$/, ''); f.opt1 = opt1.replace(/<+$/, '');
      f.dob = l2.slice(0, 6); f.sex = l2[7]; f.exp = l2.slice(8, 14); f.nat = l2.slice(15, 18); f.opt2 = l2.slice(18, 29).replace(/<+$/, '');
      f.name = name(l3);
      chk('Document number', dn, dnc);
      chk('Date of birth', l2.slice(0, 6), l2[6]);
      chk('Date of expiry', l2.slice(8, 14), l2[14]);
      chk('Composite (whole MRZ)', l1.slice(5, 30) + l2.slice(0, 7) + l2.slice(8, 15) + l2.slice(18, 29), l2[29]);
      mark(0, 0, 2, 'm-type', 'Document type'); mark(0, 2, 5, 'm-state', 'Issuing state'); mark(0, 5, 14, 'm-doc', 'Document number'); mark(0, 14, 15, 'm-ck', 'Check digit');
      mark(0, 15, 30, 'm-opt', 'Optional data'); mark(1, 0, 6, 'm-date', 'Date of birth'); mark(1, 6, 7, 'm-ck', 'Check digit'); mark(1, 7, 8, 'm-sex', 'Sex');
      mark(1, 8, 14, 'm-date', 'Date of expiry'); mark(1, 14, 15, 'm-ck', 'Check digit'); mark(1, 15, 18, 'm-state', 'Nationality'); mark(1, 18, 29, 'm-opt', 'Optional data');
      mark(1, 29, 30, 'm-ck', 'Composite check digit'); mark(2, 0, 30, 'm-name', 'Name');
    } else {
      var w = fmt === 'TD3' || fmt === 'MRV-A' ? 44 : 36;
      f.type = l1.slice(0, 2); f.state = l1.slice(2, 5); f.name = name(l1.slice(5));
      f.doc = l2.slice(0, 9).replace(/<+$/, ''); f.nat = l2.slice(10, 13); f.dob = l2.slice(13, 19); f.sex = l2[20]; f.exp = l2.slice(21, 27);
      chk('Document number', l2.slice(0, 9), l2[9]);
      chk('Date of birth', l2.slice(13, 19), l2[19]);
      chk('Date of expiry', l2.slice(21, 27), l2[27]);
      mark(0, 0, 2, 'm-type', 'Document type'); mark(0, 2, 5, 'm-state', 'Issuing state'); mark(0, 5, w, 'm-name', 'Name');
      mark(1, 0, 9, 'm-doc', 'Document number'); mark(1, 9, 10, 'm-ck', 'Check digit'); mark(1, 10, 13, 'm-state', 'Nationality');
      mark(1, 13, 19, 'm-date', 'Date of birth'); mark(1, 19, 20, 'm-ck', 'Check digit'); mark(1, 20, 21, 'm-sex', 'Sex');
      mark(1, 21, 27, 'm-date', 'Date of expiry'); mark(1, 27, 28, 'm-ck', 'Check digit');
      if (fmt === 'TD3') {
        f.opt2 = l2.slice(28, 42).replace(/<+$/, '');
        chk('Personal number', l2.slice(28, 42), l2[42]);
        chk('Composite (whole MRZ)', l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43), l2[43]);
        mark(1, 28, 42, 'm-opt', 'Personal number'); mark(1, 42, 43, 'm-ck', 'Check digit'); mark(1, 43, 44, 'm-ck', 'Composite check digit');
      } else if (fmt === 'TD2') {
        f.opt2 = l2.slice(28, 35).replace(/<+$/, '');
        chk('Composite (whole MRZ)', l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 35), l2[35]);
        mark(1, 28, 35, 'm-opt', 'Optional data'); mark(1, 35, 36, 'm-ck', 'Composite check digit');
      } else {
        f.opt2 = l2.slice(28, w).replace(/<+$/, '');
        mark(1, 28, w, 'm-opt', 'Optional data');
      }
    }
    f.dobP = date(f.dob, 'birth', today); f.expP = date(f.exp, 'expiry', today);
    res.f = f; res.checks = ck; res.marks = H;
    if (!COUNTRY[f.state.replace(/<+$/, '')]) res.warnings.push('Issuing state "' + f.state + '" is not a known ICAO code.');
    if (!COUNTRY[f.nat.replace(/<+$/, '')]) res.warnings.push('Nationality "' + f.nat + '" is not a known ICAO code.');
    if (!/^[MFX<]$/.test(f.sex)) res.warnings.push('Sex should be M, F, X or <. Found "' + f.sex + '".');
    if (!f.dobP.ok) res.warnings.push('Date of birth: ' + f.dobP.note + '.');
    if (!f.expP.ok) res.warnings.push('Date of expiry: ' + f.expP.note + '.');
    if (f.name.truncated) res.warnings.push('The name fills the whole field, so it may have been cut short on the document.');
    if (fmt === 'TD3' && f.type[0] !== 'P') res.warnings.push('A 2 × 44 MRZ is a passport (type P) or visa (type V). This one starts with "' + f.type[0] + '".');
    return res;
  };
  MRZ.country = function (c) { return COUNTRY[c.replace(/<+$/, '')] || null; };
  window.MRZ = MRZ;
  if (typeof module !== 'undefined') module.exports = MRZ;

  /* ---------- page ---------- */
  if (!document.getElementById('tool')) return;
  var $ = T.$, input = $('#mrz'), outEl = $('#out'), say = $('#say');
  var SAMPLES = {
    td3: 'P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<\nL898902C36UTO7408122F1204159ZE184226B<<<<<10',
    td1: 'I<UTOD231458907<<<<<<<<<<<<<<<\n7408122F1204159UTO<<<<<<<<<<<6\nERIKSSON<<ANNA<MARIA<<<<<<<<<<'
  };
  $('[data-sample]').addEventListener('click', function () { input.value = SAMPLES.td3; show(); });
  $('#s-td1').addEventListener('click', function () { input.value = SAMPLES.td1; show(); });
  $('#clear').addEventListener('click', function () { input.value = ''; show(); input.focus(); });
  var t; input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(show, 150); });

  var SEX = { M: 'Male', F: 'Female', X: 'Unspecified', '<': 'Unspecified' };
  var TYPES = { P: 'Passport', V: 'Visa', I: 'Identity card', A: 'Identity card', C: 'Identity card' };

  function render(r) {
    var html = '<div class="mrzbox" aria-label="MRZ with fields marked">' + r.lines.map(function (l, i) {
      var spans = r.marks.filter(function (m) { return m.line === i; }), s = '', pos = 0;
      spans.forEach(function (m) {
        if (m.a > pos) s += T.esc(l.slice(pos, m.a));
        var failed = m.cls === 'm-ck' && r.checks.some(function (c) { return !c.ok && c.given === l[m.a] && isFor(c, i, m.a); });
        s += '<span class="' + m.cls + (failed ? ' m-bad' : '') + '" title="' + m.title + '">' + T.esc(l.slice(m.a, m.b)) + '</span>';
        pos = m.b;
      });
      return '<div>' + s + T.esc(l.slice(pos)) + '</div>';
    }).join('') + '</div>';
    return html;
  }
  // which check digit position belongs to which check (for red marking)
  function isFor(c, line, pos) {
    var map = { TD3: { 'Document number': [1, 9], 'Date of birth': [1, 19], 'Date of expiry': [1, 27], 'Personal number': [1, 42], 'Composite (whole MRZ)': [1, 43] },
      'MRV-A': { 'Document number': [1, 9], 'Date of birth': [1, 19], 'Date of expiry': [1, 27] },
      TD2: { 'Document number': [1, 9], 'Date of birth': [1, 19], 'Date of expiry': [1, 27], 'Composite (whole MRZ)': [1, 35] },
      'MRV-B': { 'Document number': [1, 9], 'Date of birth': [1, 19], 'Date of expiry': [1, 27] },
      TD1: { 'Document number': [0, 14], 'Date of birth': [1, 6], 'Date of expiry': [1, 14], 'Composite (whole MRZ)': [1, 29] } }[cur.format] || {};
    var p = map[c.label]; return p && p[0] === line && p[1] === pos;
  }
  var cur = null;

  function show() {
    var text = input.value;
    if (!text.trim()) { outEl.hidden = true; T.say(say, ''); return; }
    var r = MRZ.parse(text); cur = r;
    if (!r) { outEl.hidden = true; return; }
    if (!r.format) { outEl.hidden = true; T.say(say, T.esc(r.errors.join(' ')), 'err'); return; }
    var f = r.f, fails = r.checks.filter(function (c) { return !c.ok; }).length, today = new Date();
    var verdict = fails ? '<div class="tsay err"><b>' + fails + ' of ' + r.checks.length + ' check digits fail.</b> The MRZ was misread or mistyped, or the document isn\'t genuine. See the table below for where.</div>'
      : '<div class="tsay ok"><b>All ' + r.checks.length + ' check digits pass.</b> The MRZ is internally consistent. That proves it was read correctly, not that the document is genuine.</div>';
    var exp = '';
    if (f.expP.ok && f.expP.date) {
      var days = Math.round((f.expP.date - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 864e5);
      exp = days < 0 ? '<span class="tag2 bad">expired ' + T.n(-days) + ' days ago</span>' : days < 183 ? '<span class="tag2 warn">expires in ' + T.n(days) + ' days</span>' : '<span class="tag2 ok">valid for ' + (days > 730 ? Math.floor(days / 365) + ' more years' : T.n(days) + ' more days') + '</span>';
    }
    var age = '';
    if (f.dobP.ok && f.dobP.date) { var a = today.getUTCFullYear() - f.dobP.date.getUTCFullYear(); if (today < new Date(Date.UTC(today.getUTCFullYear(), f.dobP.date.getUTCMonth(), f.dobP.date.getUTCDate()))) a--; age = '<small>age ' + a + '</small>'; }
    function kv(k, v, small) { return '<div><span>' + k + '</span><b>' + (v || '<span class="dim">—</span>') + '</b>' + (small ? '<small>' + small + '</small>' : '') + '</div>'; }
    var cty = function (c) { return T.esc(c.replace(/<+$/, '')); };
    var kvs = '<div class="kvs">' +
      kv('Surname', T.esc(f.name.surname)) + kv('Given names', T.esc(f.name.given)) +
      kv('Document', T.esc(TYPES[f.type[0]] || 'Travel document'), 'type ' + T.esc(f.type.replace(/<+$/, '')) + ' · ' + r.format) +
      kv('Document number', T.esc(f.doc), f.longDoc ? 'long number, continued in optional data' : '') +
      kv('Issuing state', cty(f.state), T.esc(MRZ.country(f.state) || 'unknown code')) +
      kv('Nationality', cty(f.nat), T.esc(MRZ.country(f.nat) || 'unknown code')) +
      kv('Date of birth', f.dobP.ok ? f.dobP.iso + ' ' + age : '<span class="dim">' + T.esc(f.dob) + '</span>', f.dobP.ok ? '' : f.dobP.note) +
      kv('Sex', T.esc(SEX[f.sex] || f.sex), T.esc(f.sex)) +
      kv('Date of expiry', f.expP.ok ? f.expP.iso + ' ' + exp : '<span class="dim">' + T.esc(f.exp) + '</span>', f.expP.ok ? '' : f.expP.note) +
      (f.opt1 ? kv('Optional data (line 1)', T.esc(f.opt1)) : '') + (f.opt2 ? kv(r.format === 'TD3' ? 'Personal number' : 'Optional data', T.esc(f.opt2)) : '') +
      '</div>';
    var rows = r.checks.map(function (c) {
      return '<tr class="' + (c.ok ? '' : 'bad') + '"><td>' + c.label + '</td><td style="word-break:break-all">' + T.esc(c.value) + '</td><td class="num">' + T.esc(c.given) + '</td><td class="num">' + c.computed + '</td><td>' +
        (c.ok ? '<span class="tag2 ok">pass</span>' : '<span class="tag2 bad">fail</span>' + (c.fix && c.fix.length ? '<small>Possible misread: ' + c.fix.slice(0, 2).map(T.esc).join(' or ') + '</small>' : '')) + '</td></tr>';
    }).join('');
    var warn = r.errors.concat(r.warnings);
    outEl.innerHTML = render(r) + verdict + (warn.length ? '<div class="tsay warn">' + warn.map(T.esc).join('<br>') + '</div>' : '') + kvs +
      '<div class="tgrid-wrap" style="max-height:none"><table class="tgrid"><thead><tr><th>Check</th><th>Characters checked</th><th class="num">On document</th><th class="num">Calculated</th><th>Result</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    outEl.hidden = false; T.say(say, '');
  }

  // check digit calculator
  var calc = $('#calc'), calcOut = $('#calc-out');
  calc.addEventListener('input', function () {
    var v = calc.value.toUpperCase().replace(/\s/g, '');
    if (!v) { calcOut.textContent = ''; return; }
    if (/[^A-Z0-9<]/.test(v)) { calcOut.textContent = 'Only A–Z, 0–9 and <'; return; }
    calcOut.innerHTML = 'Check digit: <b>' + MRZ.check(v) + '</b>';
  });
})();
