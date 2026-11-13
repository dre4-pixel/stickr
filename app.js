// ===== CONFIG =====
// Leave empty for demo mode. Set to your backend once it's hosted, e.g. "https://api.yoursite.com"
const API_BASE = "";
const AD_SECONDS = 5;
// Stripe Payment Link for Premium (create in your Stripe dashboard, paste here)
const PREMIUM_LINK = "";

const $ = s => document.querySelector(s);
if (location.hash === '#pricing') setTimeout(() => openPricing(), 0);
window.addEventListener('hashchange', () => { if (location.hash === '#pricing') openPricing(); });

const input = $('#url'), send = $('#send'), chat = $('#chat'), hero = $('#hero'), scroller = $('#scroller');
let premium = false;           // TODO: set from your backend once payments are live
let current = null;            // { url, items, hasMore, mode, body }
const selected = new Set();

input.addEventListener('input', () => send.disabled = !input.value.trim());
$('#form').addEventListener('submit', e => { e.preventDefault(); go(input.value.trim()); });

function isTikTok(u) { return /(^|\.)tiktok\.com\//i.test(u.replace(/^https?:\/\//, '')); }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2200); }
function scrollDown() { scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' }); }
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const wait = ms => new Promise(r => setTimeout(r, ms));

async function go(url, opts = {}) {
  if (!url) return;
  hero.style.display = 'none';
  const seo = document.getElementById('seo'); if (seo) seo.style.display = 'none';
  const ft = document.querySelector('footer'); if (ft) ft.style.display = 'none';
  chat.style.display = 'flex';
  if (!opts.all) chat.insertAdjacentHTML('beforeend', `<div class="msg-user">${esc(url)}</div>`);
  input.value = ''; send.disabled = true;
  selected.clear(); updateBar();

  const bot = document.createElement('div');
  bot.className = 'msg-bot';
  bot.innerHTML = `<div class="avatar">✨</div><div class="bot-body"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chat.appendChild(bot); scrollDown();
  const body = bot.querySelector('.bot-body');

  if (!isTikTok(url)) {
    await wait(600);
    body.innerHTML = `<p class="err">That doesn't look like a TikTok link. Paste a video link, or share a single comment and paste that.</p>`;
    return;
  }
  try {
    const data = await fetchPage(url, 0, opts.all);
    current = { url, items: data.items, hasMore: data.hasMore, mode: data.mode, note: data.note, demo: data.demo, body };
    render();
  } catch (err) {
    body.innerHTML = `<p class="err">Couldn't read that. The video might be private, deleted, or have comments turned off.</p>`;
  }
  scrollDown();
}

// mode: "comment" = a single shared comment, "video" = every sticker on the video
async function fetchPage(url, offset, all) {
  if (!API_BASE) return fetchDemo(url, offset, all);
  const r = await fetch(`${API_BASE}/api/stickers?url=${encodeURIComponent(url)}&offset=${offset}${all ? '&all=1' : ''}`, { credentials: 'include' });
  if (!r.ok) throw new Error('bad');
  return r.json(); // { mode, items:[{id,type,src}], hasMore, note? }
}

const DEMO = ['😭','💀','🫠','🤣','😳','🥹','🙏','👀','🔥','😩','🤡','💅','😤','🥴','🫡','😂','😮‍💨','🤯','😈','🙃','🤌','🫶','😬','🗿',
              '🐸','🐶','🐱','🦆','🍿','💯','🚩','🧢','👑','🤝','😴','🥲','😎','🤓','😜','🙄','😇','🫣','🤫','😵','🤠','👻','💩','🎉'];
async function fetchDemo(url, offset, all) {
  await wait(offset ? 700 : 1200);
  // Demo can't open short links, so a link containing "comment" pretends to be a shared comment
  if (!all && /comment/i.test(url)) return { demo: true, mode: 'comment', hasMore: false, items: [{ id: 's0', type: 'gif', emoji: '🤣' }] };
  const batch = DEMO.slice(offset, offset + 24);
  return { demo: true, mode: 'video', hasMore: offset + 24 < DEMO.length,
    items: batch.map((e, i) => { const n = offset + i; return { id: n, type: n % 3 ? 'sticker' : 'gif', emoji: e }; }) };
}

function mediaHTML(it) {
  return it.src ? `<img src="${esc(it.src.startsWith('/') ? API_BASE + it.src : it.src)}" alt="" loading="lazy">` : `<div class="emoji">${it.emoji}</div>`;
}

function cardHTML(it) {
  const sel = selected.has(String(it.id));
  return `<div class="card ${sel ? 'sel' : ''}" data-id="${esc(it.id)}" onclick="tapCard(this)">
    ${it.type === 'gif' ? '<div class="kind">GIF</div>' : ''}
    ${mediaHTML(it)}
    <div class="check">✓</div>
    <button class="dl" onclick="event.stopPropagation();downloadIds(['${esc(it.id)}'])" aria-label="Download"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 4v12M6 11l6 6 6-6M5 20h14"/></svg></button>
  </div>`;
}

function render() {
  const { items, hasMore, demo, body, mode, note } = current;
  const demoNote = demo ? `<p style="color:var(--muted);font-size:12px;margin-top:10px">Demo mode: showing sample stickers.</p>` : '';

  if (mode === 'comment' && items.length) {
    const it = items[0];
    body.innerHTML = `
      <p>Here's the ${it.type === 'gif' ? 'GIF' : 'sticker'} from that comment 👇</p>
      <div class="single">${mediaHTML(it)}</div>
      <div class="row">
        <button class="btn btn-white" onclick="downloadIds(['${esc(it.id)}'])">Download</button>
        <button class="btn btn-dark" onclick="go(current.url,{all:true})">See all from this video</button>
      </div>${demoNote}`;
    return;
  }
  if (!items.length) { body.innerHTML = `<p>No stickers or GIFs in this video's comments.</p>`; return; }
  body.innerHTML = `
    ${note ? `<p style="color:var(--muted)">${esc(note)}</p>` : ''}
    <p>Found <b>${items.length}${hasMore ? '+' : ''} stickers & GIFs</b>. Tap to download, or tap a few and grab them together.</p>
    <div class="grid">${items.map(cardHTML).join('')}</div>
    ${hasMore ? `<button class="btn btn-dark more" onclick="loadMore(this)">Load more</button>` : `<p class="end">That's every sticker in the comments.</p>`}
    ${!premium ? `<div class="unlock"><div><b>Free, with a short ad</b><br><span style="color:var(--muted);font-size:13px">Go Premium to skip ads forever</span></div>
      <button class="btn btn-white" onclick="openPricing()">£3.99/mo</button></div>` : ''}
    ${demoNote}`;
}

async function loadMore(btn) {
  btn.disabled = true; btn.textContent = 'Loading…';
  try {
    const data = await fetchPage(current.url, current.items.length, true);
    current.items.push(...data.items);
    current.hasMore = data.hasMore;
  } catch (e) { toast("Couldn't load more, try again"); }
  render();
}

// Tapping a card selects it; the download button on each card grabs just that one
function tapCard(el) {
  const id = el.dataset.id;
  if (selected.has(id)) selected.delete(id); else selected.add(id);
  el.classList.toggle('sel');
  updateBar();
}

function updateBar() {
  let bar = $('#selbar');
  if (!bar) {
    bar = document.createElement('div'); bar.id = 'selbar';
    bar.innerHTML = `<button class="btn btn-dark" onclick="clearSel()">Clear</button><button class="btn btn-white" id="selbtn" onclick="downloadIds([...selected])"></button>`;
    document.body.appendChild(bar);
  }
  bar.classList.toggle('show', selected.size > 0);
  const b = $('#selbtn'); if (b) b.textContent = `Download ${selected.size} selected`;
}
function clearSel() { selected.clear(); document.querySelectorAll('.card.sel').forEach(c => c.classList.remove('sel')); updateBar(); }

// ===== Ads =====
// Placeholder ad. Once you're approved by an ad network (e.g. Google AdSense),
// put their ad code inside #adslot in the page and keep this countdown.
function showAd() {
  return new Promise(resolve => {
    const ov = $('#ad');
    let n = AD_SECONDS;
    const count = $('#adcount'), skip = $('#adskip');
    skip.disabled = true; count.textContent = n; ov.classList.add('show');
    skip.textContent = `Download in ${n}s`;
    const t = setInterval(() => {
      n--; count.textContent = Math.max(n, 0);
      if (n > 0) { skip.textContent = `Download in ${n}s`; return; }
      clearInterval(t); skip.disabled = false; skip.textContent = 'Download now';
      skip.onclick = () => { ov.classList.remove('show'); resolve(); };
    }, 1000);
  });
}

function fileUrl(id) { return `${API_BASE}/api/file?id=${encodeURIComponent(id)}`; }
function triggerDownload(id) { const a = document.createElement('a'); a.href = fileUrl(id); a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }

// One ad per download, whether it's 1 file or 20
async function downloadIds(ids) {
  if (!ids.length) return;
  if (!premium) await showAd();
  if (!API_BASE) { toast(ids.length > 1 ? `Would download ${ids.length} files (demo)` : 'Downloads work once the backend is live'); clearSel(); return; }
  for (const id of ids) { triggerDownload(id); await wait(400); }
  clearSel();
}

function openPricing() { $('#pricing').classList.add('show'); }
function closePricing() { $('#pricing').classList.remove('show'); if (location.hash === '#pricing') location.hash = ''; }
function checkout() {
  if (!PREMIUM_LINK) {
    premium = true; closePricing();
    if (current) render();
    toast('Demo: Premium on, no more ads');
    return;
  }
  window.location.href = PREMIUM_LINK;
}
