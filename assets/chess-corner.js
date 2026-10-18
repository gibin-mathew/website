/* Off the clock: two mate-in-2 finishes from Gibin's own chess.com games, playable on the page.
   Rules come from chess.js (vendored). Live numbers come from the public chess.com API. */
import { Chess } from '/assets/chess.js';

const USER = 'gibinmathew';
const PUZZLES = [
  { fen: 'rnbkr3/pp4Qp/3p4/2pBp3/3PP2P/8/PPq2P1P/R1B1K2R w KQ - 0 14', key: 'Bg5+', reply: 'Re7',
    game: 'https://www.chess.com/game/live/40686592083',
    hint: 'Your queen is already close. Which piece can check the king from far away?',
    win: 'Checkmate. Bg5+ forces Re7, then Qxe7#. That is exactly how the game ended.' },
  { fen: 'Q4nk1/8/6p1/5R2/5p2/7K/5P2/8 w - - 0 46', key: 'Qxf8+', reply: 'Kh7',
    game: 'https://www.chess.com/game/live/40372197737',
    hint: 'The knight on f8 is the only thing in the way. The rook covers the f-file.',
    win: 'Checkmate. Qxf8+ leaves only Kh7, then Rf7#. Same finish as the game.' },
];
const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const FILES = 'abcdefgh';

const root = document.getElementById('chess');
if (root) init();

function init() {
  const board = root.querySelector('.czb'), status = root.querySelector('.cp-status');
  const num = root.querySelector('[data-num]'), link = root.querySelector('[data-game]');
  let idx = 0, game, step, sel = null, last = [], busy = false;

  function say(t, cls) { status.textContent = t; status.className = 'cp-status' + (cls ? ' ' + cls : ''); }

  function load(i) {
    idx = i; const p = PUZZLES[i]; game = new Chess(p.fen); step = 0; sel = null; last = []; busy = false;
    num.textContent = i + 1; link.href = p.game;
    say('White to move. Find the move that forces mate in two.');
    draw();
  }

  function draw(extra = {}) {
    board.innerHTML = '';
    for (let r = 8; r >= 1; r--) for (let f = 0; f < 8; f++) {
      const sq = FILES[f] + r, cell = document.createElement('div');
      cell.className = 'czs ' + ((r + f) % 2 ? 'd' : 'l');
      cell.dataset.sq = sq;
      if (last.includes(sq)) cell.classList.add('last');
      if (sel === sq) cell.classList.add('sel');
      if (extra.hint === sq) cell.classList.add('hint');
      if (extra.mate === sq) cell.classList.add('mate');
      const pc = game.get(sq);
      if (pc) { const s = document.createElement('span'); s.className = 'czp ' + pc.color; s.textContent = GLYPH[pc.type] + '︎'; cell.appendChild(s); }
      if (f === 0) cell.insertAdjacentHTML('beforeend', `<span class="czc r">${r}</span>`);
      if (r === 1) cell.insertAdjacentHTML('beforeend', `<span class="czc f">${FILES[f]}</span>`);
      cell.setAttribute('aria-label', sq + (pc ? ' ' + (pc.color === 'w' ? 'white ' : 'black ') + name(pc.type) : ''));
      board.appendChild(cell);
    }
    if (sel) for (const m of game.moves({ square: sel, verbose: true })) {
      const c = board.querySelector(`[data-sq="${m.to}"]`); c.classList.add(m.captured ? 'cap' : 'dot');
    }
  }
  const name = t => ({ k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' })[t];

  function tryMove(from, to) {
    if (busy) return;
    let mv;
    try { mv = game.move({ from, to, promotion: 'q' }); } catch (e) { mv = null; }
    sel = null;
    if (!mv) { draw(); return; }
    const p = PUZZLES[idx];
    if (step === 0) {
      if (mv.san !== p.key) {
        busy = true; last = [from, to]; draw();
        say(game.isCheckmate() ? 'That is mate in one, but this position has none. Look again.' : 'Not this one. Black gets away. Try again.', 'bad');
        board.classList.add('wrong'); setTimeout(() => { board.classList.remove('wrong'); game.undo(); last = []; busy = false; draw(); }, 700);
        return;
      }
      last = [from, to]; step = 1; busy = true; draw();
      say('Good. ' + mv.san + ' and Black has only one reply…', 'ok');
      setTimeout(() => {
        const r = game.move(p.reply); last = [r.from, r.to]; busy = false; draw();
        say(r.san + '. Now finish it: mate in one.');
      }, 800);
      return;
    }
    if (game.isCheckmate()) {
      last = [from, to];
      const king = findKing('b'); draw({ mate: king });
      say(p.win, 'ok'); step = 2;
    } else {
      busy = true; last = [from, to]; draw();
      say('Close, but the king can still move. Try another.', 'bad');
      board.classList.add('wrong'); setTimeout(() => { board.classList.remove('wrong'); game.undo(); last = []; busy = false; draw(); }, 700);
    }
  }
  function findKing(c) { for (const row of game.board()) for (const x of row) if (x && x.type === 'k' && x.color === c) return x.square; }

  /* tap to select, tap to move; or drag */
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const cell = e.target.closest('.czs'); if (!cell || busy || step === 2) return;
    const sq = cell.dataset.sq, pc = game.get(sq);
    if (sel && sel !== sq && (cell.classList.contains('dot') || cell.classList.contains('cap'))) { tryMove(sel, sq); return; }
    if (pc && pc.color === game.turn()) {
      sel = sq; draw();
      const span = board.querySelector(`[data-sq="${sq}"] .czp`);
      drag = { from: sq, x: e.clientX, y: e.clientY, moved: false, span, ghost: null };
      board.setPointerCapture(e.pointerId);
    } else { sel = null; draw(); }
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
    if (!drag.moved) { drag.moved = true; drag.ghost = drag.span.cloneNode(true); drag.ghost.classList.add('czg'); drag.ghost.style.fontSize = getComputedStyle(drag.span).fontSize; document.body.appendChild(drag.ghost); drag.span.style.opacity = '.25'; }
    drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px';
  });
  board.addEventListener('pointerup', e => {
    if (!drag) return; const d = drag; drag = null;
    if (d.ghost) d.ghost.remove();
    if (!d.moved) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), cell = el && el.closest && el.closest('.czs');
    if (cell && cell.dataset.sq !== d.from) tryMove(d.from, cell.dataset.sq); else { if (d.span) d.span.style.opacity = ''; }
  });
  board.addEventListener('pointercancel', () => { if (drag && drag.ghost) drag.ghost.remove(); drag = null; draw(); });

  root.querySelector('[data-reset]').addEventListener('click', () => load(idx));
  root.querySelector('[data-next]').addEventListener('click', () => load((idx + 1) % PUZZLES.length));
  root.querySelector('[data-hint]').addEventListener('click', () => {
    if (step === 2) return;
    const p = PUZZLES[idx];
    if (step === 0) { const m = new Chess(p.fen).move(p.key); draw({ hint: m.from }); say(p.hint); }
    else { const m = game.moves({ verbose: true }).find(x => { game.move(x.san); const ok = game.isCheckmate(); game.undo(); return ok; }); if (m) { draw({ hint: m.from }); say('The highlighted piece delivers mate.'); } }
  });
  load(0);
}

/* live numbers from the public chess.com API; the HTML already holds fallbacks */
(async () => {
  const out = document.querySelectorAll('[data-chess]'); if (!out.length) return;
  try {
    const [stats, player] = await Promise.all([
      fetch(`https://api.chess.com/pub/player/${USER}/stats`).then(r => r.ok ? r.json() : Promise.reject()),
      fetch(`https://api.chess.com/pub/player/${USER}`).then(r => r.ok ? r.json() : Promise.reject()),
    ]);
    let games = 0;
    for (const k of ['chess_rapid', 'chess_blitz', 'chess_bullet', 'chess_daily']) if (stats[k]) { const r = stats[k].record; games += r.win + r.loss + r.draw; }
    const set = (k, v) => { const el = document.querySelector(`[data-chess="${k}"]`); if (el && v) { el.textContent = v; el.classList.add('live'); } };
    if (games) set('games', games.toLocaleString('en-IN'));
    if (stats.tactics && stats.tactics.highest) set('puzzle', stats.tactics.highest.rating.toLocaleString('en-IN'));
    if (player.joined) set('since', new Date(player.joined * 1000).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
    if (player.last_online) {
      const days = Math.floor((Date.now() / 1000 - player.last_online) / 86400);
      set('seen', days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 30 ? days + ' days ago' : 'A while ago');
    }
  } catch (e) { /* keep the fallback numbers */ }
})();
