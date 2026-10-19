/* String matching for the gibin.in tools. No DOM, so it runs in the page and in a Web Worker.
   Scores are 0-100. Everything happens in the browser; nothing is sent anywhere. */
(function (root) {
  'use strict';

  function normalize(s, o) {
    o = o || {};
    s = s == null ? '' : String(s);
    if (o.accents !== false) s = s.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    s = s.toLowerCase();
    if (o.punct !== false) s = s.replace(/&/g, ' and ').replace(/[^\p{L}\p{N}]+/gu, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    if (o.abbr !== false && s) s = s.split(' ').map(function (t) { return ABBR[t] || t; }).join(' ');
    if (o.stop && o.stop.size) s = s.split(' ').filter(function (t) { return t && !o.stop.has(t); }).join(' ');
    return s;
  }

  // Common business and institution abbreviations, expanded so "Globex Corp" meets "Globex Corporation".
  var ABBR = { corp: 'corporation', co: 'company', inc: 'incorporated', incorp: 'incorporated', ltd: 'limited',
    intl: 'international', univ: 'university', dept: 'department', mgmt: 'management', mfg: 'manufacturing',
    assn: 'association', assoc: 'association', natl: 'national', govt: 'government', svc: 'services', svcs: 'services',
    bros: 'brothers', lab: 'laboratory', labs: 'laboratories', hq: 'headquarters', inst: 'institute', ctr: 'center', centre: 'center', pvt: 'private', pte: 'private', tech: 'technology' };

  function stopSet(text) {
    var set = new Set();
    String(text || '').split(/[,\n]/).forEach(function (w) {
      w = normalize(w);
      if (w) w.split(' ').forEach(function (t) { set.add(t); });
    });
    return set;
  }

  var MAXLEN = 256; // longer strings are compared on their first 256 characters
  var row0 = new Int32Array(MAXLEN + 1), row1 = new Int32Array(MAXLEN + 1);

  // Myers' bit-parallel edit distance when the shorter string fits in 32 bits, plain DP otherwise.
  var PEQ = new Int32Array(0x10000);
  function myers32(a, b) {
    var m = a.length, n = b.length, i;
    for (i = 0; i < m; i++) PEQ[a.charCodeAt(i)] |= 1 << i;
    var pv = -1, mv = 0, sc = m, last = 1 << (m - 1);
    for (i = 0; i < n; i++) {
      var eq = PEQ[b.charCodeAt(i)], xv = eq | mv, xh = (((eq & pv) + pv) ^ pv) | eq;
      var ph = mv | ~(xh | pv), mh = pv & xh;
      if (ph & last) sc++;
      if (mh & last) sc--;
      ph = (ph << 1) | 1; mh = mh << 1;
      pv = mh | ~(xv | ph); mv = ph & xv;
    }
    for (i = 0; i < m; i++) PEQ[a.charCodeAt(i)] = 0;
    return sc;
  }

  function levDP(a, b) {
    var la = a.length, lb = b.length, prev = row0, cur = row1, i, j, t;
    for (j = 0; j <= lb; j++) prev[j] = j;
    for (i = 1; i <= la; i++) {
      cur[0] = i;
      var ca = a.charCodeAt(i - 1);
      for (j = 1; j <= lb; j++) {
        var v = prev[j - 1] + (ca === b.charCodeAt(j - 1) ? 0 : 1), d = prev[j] + 1, ins = cur[j - 1] + 1;
        if (d < v) v = d;
        if (ins < v) v = ins;
        cur[j] = v;
      }
      t = prev; prev = cur; cur = t;
    }
    return prev[lb];
  }

  function levenshtein(a, b) {
    if (a.length > MAXLEN) a = a.slice(0, MAXLEN);
    if (b.length > MAXLEN) b = b.slice(0, MAXLEN);
    if (a === b) return 0;
    if (a.length > b.length) { var t = a; a = b; b = t; }
    if (!a.length) return b.length;
    return a.length <= 32 ? myers32(a, b) : levDP(a, b);
  }

  function ratio(a, b) {
    if (!a.length && !b.length) return 100;
    if (!a.length || !b.length) return 0;
    var m = Math.max(Math.min(a.length, MAXLEN), Math.min(b.length, MAXLEN));
    return 100 * (1 - levenshtein(a, b) / m);
  }

  function sortTokens(s) { return s ? s.split(' ').sort().join(' ') : ''; }

  function tokenSort(a, b) { return ratio(sortTokens(a), sortTokens(b)); }

  function tokenSet(a, b) {
    if (!a || !b) return a === b ? 100 : 0;
    var A = new Set(a.split(' ')), B = new Set(b.split(' '));
    var inter = [], da = [], db = [];
    A.forEach(function (t) { (B.has(t) ? inter : da).push(t); });
    B.forEach(function (t) { if (!A.has(t)) db.push(t); });
    inter.sort(); da.sort(); db.sort();
    var t0 = inter.join(' ');
    var t1 = (t0 + ' ' + da.join(' ')).trim(), t2 = (t0 + ' ' + db.join(' ')).trim();
    if (!t0) return ratio(t1, t2);
    return Math.max(ratio(t0, t1), ratio(t0, t2), ratio(t1, t2));
  }

  function jaroWinkler(a, b) {
    if (a === b) return 100;
    var la = a.length, lb = b.length;
    if (!la || !lb) return 0;
    var range = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
    var ma = new Uint8Array(la), mb = new Uint8Array(lb), m = 0, i, j;
    for (i = 0; i < la; i++) {
      var lo = Math.max(0, i - range), hi = Math.min(lb - 1, i + range);
      for (j = lo; j <= hi; j++) {
        if (!mb[j] && a.charCodeAt(i) === b.charCodeAt(j)) { ma[i] = mb[j] = 1; m++; break; }
      }
    }
    if (!m) return 0;
    var k = 0, tr = 0;
    for (i = 0; i < la; i++) {
      if (!ma[i]) continue;
      while (!mb[k]) k++;
      if (a.charCodeAt(i) !== b.charCodeAt(k)) tr++;
      k++;
    }
    var jaro = (m / la + m / lb + (m - tr / 2) / m) / 3;
    var p = 0;
    while (p < 4 && p < la && p < lb && a.charCodeAt(p) === b.charCodeAt(p)) p++;
    return 100 * (jaro + p * 0.1 * (1 - jaro));
  }

  /* Token similarity used by "smart": numbers must match exactly, short tokens must match exactly,
     a 3+ letter prefix counts as an abbreviation, everything else uses Jaro-Winkler. */
  function tokenSim(x, y) {
    if (x === y) return 1;
    if (/\d/.test(x) || /\d/.test(y)) return 0;
    if (x.length >= 3 && y.length > x.length && y.indexOf(x) === 0) return 0.9;
    if (y.length >= 3 && x.length > y.length && x.indexOf(y) === 0) return 0.9;
    if (x.length <= 2 || y.length <= 2) return 0;
    if (abbrev(x, y) || abbrev(y, x)) return 0.8;
    if (x.length <= 3 || y.length <= 3) return 0;
    var j = jaroWinkler(x, y) / 100;
    return j >= 0.86 ? j : 0;
  }



  /* Smart: rare words count for more than common ones (weights come from the lists themselves),
     blended with whole-string edit distance so typos and word order both get credit.
     Works on prepared items {s, t, st}: string, tokens, sorted-token string. */
  function smartPrepared(A, B, idf, maxIdf, need, cache) {
    if (A.s === B.s) return 100;
    if (!A.s || !B.s) return 0;
    var soft = (softDirC(A.t, B.t, idf, maxIdf, cache) + softDirC(B.t, A.t, idf, maxIdf, cache)) / 2;
    var hi = 65 * soft + 35;
    if (need && hi < need) return hi;           // cannot win, skip the edit-distance work
    var base = A.st === B.st ? 100 : Math.max(ratio(A.st, B.st), A.s === A.st && B.s === B.st ? 0 : ratio(A.s, B.s));
    return 65 * soft + 0.35 * base;
  }

  // "mgmt" in "management": same first and last letter, every letter in order
  function abbrev(x, y) {
    if (x.length < 3 || y.length <= x.length + 1 || x[0] !== y[0] || x[x.length - 1] !== y[y.length - 1]) return false;
    for (var i = 1, j = 1; i < x.length; i++) { j = y.indexOf(x[i], j); if (j < 0) return false; j++; }
    return true;
  }

  function softDirC(ta, tb, idf, maxIdf, cache) {
    // ta, tb: arrays of token ids; idf: Float64Array by id; cache.sim(x, y) gives tokenSim by id
    var sw = 0, s = 0;
    for (var i = 0; i < ta.length; i++) {
      var x = ta[i], w = idf ? idf[x] : 1, best = 0;
      for (var j = 0; j < tb.length && best < 1; j++) {
        var y = tb[j], v = x === y ? 1 : cache.sim(x, y);
        if (v > best) best = v;
      }
      sw += w; s += w * best;
    }
    return sw ? s / sw : 0;
  }

  function Vocab() { this.ids = new Map(); this.words = []; this.memo = new Map(); }
  Vocab.prototype.id = function (w) { var i = this.ids.get(w); if (i === undefined) { i = this.words.length; this.ids.set(w, i); this.words.push(w); } return i; };
  Vocab.prototype.sim = function (x, y) {
    var k = x < y ? x * 4194304 + y : y * 4194304 + x, v = this.memo.get(k);
    if (v === undefined) { v = tokenSim(this.words[x], this.words[y]); if (this.memo.size < 2000000) this.memo.set(k, v); }
    return v;
  };

  function prepItem(s, vocab) {
    var w = s ? s.split(' ') : [], t = new Array(w.length);
    for (var i = 0; i < w.length; i++) t[i] = vocab.id(w[i]);
    return { s: s, t: t, st: w.slice().sort().join(' ') };
  }

  function smart(a, b) {
    var v = new Vocab(), A = prepItem(a, v), B = prepItem(b, v);
    return smartPrepared(A, B, null, 1, 0, v);
  }

  function idfOf(items, vocab) {
    var df = new Int32Array(vocab.words.length), n = 0;
    items.forEach(function (L) {
      for (var i = 0; i < L.length; i++) {
        if (!L[i].s) continue;
        n++;
        var seen = new Set(L[i].t);
        seen.forEach(function (id) { df[id]++; });
      }
    });
    var idf = new Float64Array(df.length);
    for (var k = 0; k < df.length; k++) idf[k] = Math.max(0.1, Math.log((n + 1) / (df[k] + 0.5)));
    return idf;
  }

  var METHODS = { smart: smart, ratio: ratio, token_sort: tokenSort, token_set: tokenSet, jaro_winkler: jaroWinkler };

  function score(a, b, method) { return (METHODS[method] || smart)(a, b); }

  // Prepares both lists and returns {pa, pb, f(A, B, need)} for the chosen method.
  function scorerFor(method, na, nb) {
    var vocab = new Vocab(), pa = na.map(function (x) { return prepItem(x, vocab); });
    var pb = nb === na ? pa : nb.map(function (x) { return prepItem(x, vocab); });
    var f;
    if (method === 'ratio') f = function (A, B) { return ratio(A.s, B.s); };
    else if (method === 'token_sort') f = function (A, B) { return ratio(A.st, B.st); };
    else if (method === 'token_set') f = function (A, B) { return tokenSet(A.s, B.s); };
    else if (method === 'jaro_winkler') f = function (A, B) { return jaroWinkler(A.s, B.s); };
    else {
      var idf = idfOf(pb === pa ? [pa] : [pa, pb], vocab);
      f = function (A, B, need) { return smartPrepared(A, B, idf, 0, need, vocab); };
    }
    return { pa: pa, pb: pb, f: f };
  }

  /* ---------- candidate index: character trigrams, rarest first ---------- */
  function grams(s) {
    var t = ' ' + s + ' ', out = new Set();
    for (var i = 0; i + 3 <= t.length; i++) out.add(t.substr(i, 3));
    // whole words too: a rare word (or a number) finds its partner faster than any trigram
    if (s) s.split(' ').forEach(function (w) { if (w.length > 1) out.add('\u0001' + w); });
    return out;
  }

  function buildIndex(list) {
    var post = new Map(), sizes = new Int32Array(list.length);
    for (var id = 0; id < list.length; id++) {
      var g = grams(list[id]);
      sizes[id] = g.size;
      g.forEach(function (k) { var a = post.get(k); if (a) a.push(id); else post.set(k, [id]); });
    }
    return { post: post, sizes: sizes, n: list.length, counts: new Int32Array(list.length), touched: new Int32Array(list.length) };
  }

  // Returns up to k candidate ids that share the most rare trigrams with s.
  function candidates(ix, s, k, budget) {
    var g = Array.from(grams(s)).map(function (x) { return ix.post.get(x); }).filter(Boolean);
    g.sort(function (x, y) { return x.length - y.length; });
    var counts = ix.counts, touched = ix.touched, nt = 0, spent = 0, i, j;
    for (i = 0; i < g.length; i++) {
      var p = g[i];
      if (i >= 2 && spent + p.length > budget) break;
      spent += p.length;
      for (j = 0; j < p.length; j++) {
        var id = p[j];
        if (counts[id] === 0) touched[nt++] = id;
        counts[id]++;
      }
    }
    var qs = g.length || 1, cand = [], maxSh = 0;
    for (i = 0; i < nt; i++) if (counts[touched[i]] > maxSh) maxSh = counts[touched[i]];
    var floor = nt > k * 4 ? Math.max(1, Math.ceil(maxSh * 0.4)) : 1;
    for (i = 0; i < nt; i++) {
      var c = touched[i], sh = counts[c];
      counts[c] = 0;
      if (sh < floor) continue;
      var jac = sh / (qs + ix.sizes[c] - sh), ov = sh / Math.min(qs, ix.sizes[c] || 1);
      cand.push([c, Math.max(jac, ov * 0.8)]);
    }
    if (cand.length > k) {
      cand.sort(function (x, y) { return y[1] - x[1]; });
      cand.length = k;
    }
    return cand.map(function (x) { return x[0]; });
  }

  function prep(list, o) {
    var out = new Array(list.length);
    for (var i = 0; i < list.length; i++) out[i] = normalize(list[i], o);
    return out;
  }

  /* Best `top` matches in B for every item in A.
     Returns an array (one per A item) of [[bIndex, score], ...] sorted by score. */
  function matchAll(A, B, o, onProgress) {
    o = o || {};
    var opt = { accents: o.accents, punct: o.punct, abbr: o.abbr, stop: o.stop instanceof Set ? o.stop : stopSet(o.stop) };
    var top = o.top || 3;
    var na = prep(A, opt), nb = prep(B, opt), sf = scorerFor(o.method, na, nb), score = sf.f, pa = sf.pa, pb = sf.pb;
    var exact = new Map();
    nb.forEach(function (s, i) { if (!exact.has(s)) exact.set(s, i); });
    var brute = A.length * B.length <= (o.bruteLimit == null ? 150000 : o.bruteLimit);
    var ix = brute ? null : buildIndex(nb);
    var out = new Array(A.length), step = Math.max(1, Math.floor(A.length / 100));
    for (var i = 0; i < na.length; i++) {
      var s = na[i], best = [];
      if (s === '') { out[i] = best; continue; }
      var ids;
      if (brute) { ids = null; }
      else ids = candidates(ix, s, o.k || 24, o.budget || 6000);
      var push = function (id) {
        if (nb[id] === '') return;
        var need = best.length < top ? 0 : best[best.length - 1][1];
        var sc = nb[id] === s ? 100 : score(pa[i], pb[id], need);
        if (best.length < top || sc > best[best.length - 1][1]) {
          best.push([id, sc]);
          best.sort(function (x, y) { return y[1] - x[1] || x[0] - y[0]; });
          if (best.length > top) best.length = top;
        }
      };
      if (ids) {
        var ex = exact.get(s);
        if (ex !== undefined && ids.indexOf(ex) < 0) ids.push(ex);
        for (var j = 0; j < ids.length; j++) push(ids[j]);
      } else {
        for (var j2 = 0; j2 < nb.length; j2++) push(j2);
      }
      for (var r = 0; r < best.length; r++) best[r][1] = Math.round(best[r][1] * 10) / 10;
      out[i] = best;
      if (onProgress && i % step === 0) onProgress(i + 1, na.length);
    }
    if (onProgress) onProgress(na.length, na.length);
    return out;
  }

  /* Pairs inside one list that score at or above threshold: [[i, j, score], ...] with i < j. */
  function selfPairs(L, o, onProgress) {
    o = o || {};
    var opt = { accents: o.accents, punct: o.punct, abbr: o.abbr, stop: o.stop instanceof Set ? o.stop : stopSet(o.stop) };
    var th = o.threshold == null ? 90 : o.threshold;
    var n = prep(L, opt), pairs = [], seen = new Set(), sf = scorerFor(o.method, n, n), score = sf.f, pn = sf.pa;
    var brute = L.length * L.length / 2 <= (o.bruteLimit == null ? 150000 : o.bruteLimit);
    var ix = brute ? null : buildIndex(n), step = Math.max(1, Math.floor(n.length / 100));
    for (var i = 0; i < n.length; i++) {
      if (n[i] === '') continue;
      var ids;
      if (brute) { ids = []; for (var x = i + 1; x < n.length; x++) ids.push(x); }
      else ids = candidates(ix, n[i], o.k || 20, o.budget || 6000);
      for (var j = 0; j < ids.length; j++) {
        var c = ids[j];
        if (c === i || n[c] === '') continue;
        var a = Math.min(i, c), b = Math.max(i, c), key = a * 4294967296 + b;
        if (seen.has(key)) continue;
        var sc = n[a] === n[b] ? 100 : score(pn[a], pn[b], th);
        if (sc >= th) { seen.add(key); pairs.push([a, b, Math.round(sc * 10) / 10]); }
      }
      if (onProgress && i % step === 0) onProgress(i + 1, n.length);
    }
    if (onProgress) onProgress(n.length, n.length);
    return pairs;
  }

  root.Fuzz = { normalize: normalize, stopSet: stopSet, levenshtein: levenshtein, ratio: ratio, tokenSort: tokenSort,
    tokenSet: tokenSet, jaroWinkler: jaroWinkler, smart: smart, score: score, METHODS: METHODS,
    matchAll: matchAll, selfPairs: selfPairs, grams: grams, scorerFor: scorerFor, ABBR: ABBR, _levDP: levDP };
})(typeof self !== 'undefined' ? self : this);
