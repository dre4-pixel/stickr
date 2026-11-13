// Stickr backend – STARTER CODE, NOT TESTED AGAINST TIKTOK.
// TikTok has no public comments API. This calls the same internal endpoints the
// website uses. It can break or get blocked at any time; expect to debug it live.
//
// Run: npm install && npm start   (Node 18+)

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const HEADERS = { "User-Agent": UA, Referer: "https://www.tiktok.com/" };

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true, credentials: true }));

// In-memory caches. Swap for Redis if it grows.
const cache = new Map();   // videoId -> { items, seen, cursor, hasMore, at }
const single = new Map();  // `${videoId}:${commentId}` -> item
const CACHE_MS = 30 * 60 * 1000;

const BATCH = 24;               // stickers per "Load more"
const MAX_PAGES_PER_CALL = 10;  // comment pages (50 each) to scan per request
const MAX_PAGES_FIND = 20;      // pages to scan when hunting for one shared comment

// Only ever fetch from TikTok hosts (stops people using your server as an open proxy)
const okHost = h => /(^|\.)(tiktok\.com|tiktokcdn\.com|tiktokcdn-us\.com|tiktokv\.com|ibyteimg\.com|byteimg\.com)$/i.test(h);

// Works with full links, vm./vt. short links, and shared-comment links
async function resolveLink(input) {
  let url = new URL(input);
  if (!okHost(url.hostname)) throw new Error("not tiktok");
  if (!/\/video\/\d+/.test(url.pathname)) {
    const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": UA } });
    url = new URL(r.url);
  }
  const m = url.pathname.match(/\/video\/(\d+)/);
  if (!m) throw new Error("no video id");
  // Shared comment links carry the comment id as a query param. Name has varied, so check a few.
  const p = url.searchParams;
  const commentId = p.get("share_comment_id") || p.get("comment_id") || p.get("cid") || null;
  return { videoId: m[1], commentId };
}

// Pull image/sticker/GIF URLs out of a comment. Field names are TikTok's and may change.
function extractMedia(c) {
  const out = [];
  for (const img of c.image_list || []) {
    const u = img?.origin_url?.url_list?.[0] || img?.crop_url?.url_list?.[0];
    if (u) out.push({ type: "image", src: u });
  }
  const s = c.cmt_sticker_struct || c.sticker || c.sticker_info;
  const anim = s?.animated_url?.high_resolution_url?.url_list?.[0] || s?.animate_url?.url_list?.[0]; const stat = s?.static_url?.high_resolution_url?.url_list?.[0] || s?.static_url?.url_list?.[0];
  if (anim || stat) out.push({ type: anim ? "gif" : "sticker", src: anim || stat });
  return out;
}

async function getCommentPage(videoId, cursor) {
  const api = `https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id=${videoId}&count=50&cursor=${cursor}`;
  const r = await fetch(api, { headers: HEADERS });
  if (!r.ok) return null;
  return r.json().catch(() => null);
}

async function getReplies(videoId, commentId) {
  const api = `https://www.tiktok.com/api/comment/list/reply/?aid=1988&item_id=${videoId}&comment_id=${commentId}&count=50&cursor=0`;
  const r = await fetch(api, { headers: HEADERS });
  if (!r.ok) return [];
  const d = await r.json().catch(() => null);
  return d?.comments || [];
}

function videoEntry(videoId) {
  let e = cache.get(videoId);
  if (!e || Date.now() - e.at > CACHE_MS) {
    e = { items: [], seen: new Set(), cursor: 0, hasMore: true, at: Date.now() };
    cache.set(videoId, e);
  }
  return e;
}

function addMedia(entry, comment) {
  for (const m of extractMedia(comment))
    if (!entry.seen.has(m.src)) { entry.seen.add(m.src); entry.items.push(m); }
}

// Fetches more comment pages into the cache until we have `need` stickers or run out
async function fillTo(entry, videoId, need) {
  let pages = 0;
  while (entry.items.length < need && entry.hasMore && pages < MAX_PAGES_PER_CALL) {
    pages++;
    const data = await getCommentPage(videoId, entry.cursor);
    if (!data?.comments?.length) { entry.hasMore = false; break; }
    for (const c of data.comments) { addMedia(entry, c); for (const rc of c.reply_comment || []) addMedia(entry, rc); }
    entry.hasMore = !!data.has_more;
    entry.cursor = data.cursor;
  }
}

// Finds one shared comment. Checks top-level comments, plus the reply previews TikTok includes.
// Pages it scans are also saved into the video cache, so "See all" is quicker afterwards.
async function findComment(videoId, commentId) {
  const key = `${videoId}:${commentId}`;
  if (single.has(key)) return single.get(key);
  const entry = videoEntry(videoId);
  let cursor = 0;
  for (let page = 0; page < MAX_PAGES_FIND; page++) {
    const data = await getCommentPage(videoId, cursor);
    if (!data?.comments?.length) break;
    for (const c of data.comments) {
      addMedia(entry, c);
      const candidates = [c, ...(c.reply_comment || [])];
      const hit = candidates.find(x => String(x.cid) === String(commentId));
      if (hit) { const m = extractMedia(hit)[0] || null; single.set(key, m); return m; }
      // Shared comment might be a deeper reply: check this thread if it has replies
      if (c.reply_comment_total > (c.reply_comment?.length || 0) && page < 3) {
        const replies = await getReplies(videoId, c.cid);
        const r = replies.find(x => String(x.cid) === String(commentId));
        if (r) { const m = extractMedia(r)[0] || null; single.set(key, m); return m; }
      }
    }
    if (!data.has_more) break;
    cursor = data.cursor;
  }
  return null;
}

function itemOut(videoId, i, it) {
  return { id: `${videoId}:${i}`, type: it.type, src: `/api/file?id=${videoId}:${i}` };
}

app.get("/api/stickers", async (req, res) => {
  try {
    const { videoId, commentId } = await resolveLink(String(req.query.url || ""));
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    let note;

    // Single shared comment
    if (commentId && !req.query.all) {
      const m = await findComment(videoId, commentId);
      if (m) {
        return res.json({ mode: "comment", hasMore: false,
          items: [{ id: `c:${videoId}:${commentId}`, type: m.type, src: `/api/file?id=c:${videoId}:${commentId}` }] });
      }
      note = "Couldn't find a GIF in that exact comment, so here's everything from the video.";
    }

    // Whole video
    const entry = videoEntry(videoId);
    await fillTo(entry, videoId, offset + BATCH);
    const slice = entry.items.slice(offset, offset + BATCH);
    res.json({
      mode: "video", note,
      hasMore: entry.hasMore || entry.items.length > offset + BATCH,
      items: slice.map((it, j) => itemOut(videoId, offset + j, it)),
    });
  } catch (e) {
    res.status(400).json({ error: "Couldn't read that link" });
  }
});

// Streams the file through your server so the browser can download it (TikTok's CDN blocks direct cross-site use)
app.get("/api/file", async (req, res) => {
  const id = String(req.query.id || "");
  let item, name;
  if (id.startsWith("c:")) {
    const [, videoId, commentId] = id.split(":");
    item = single.get(`${videoId}:${commentId}`); name = `stickr-${commentId}`;
  } else {
    const [videoId, idx] = id.split(":");
    item = cache.get(videoId)?.items?.[Number(idx)]; name = `stickr-${videoId}-${idx}`;
  }
  if (!item) return res.status(404).end();
  const u = new URL(item.src);
  if (!okHost(u.hostname)) return res.status(400).end();
  const r = await fetch(u, { headers: HEADERS });
  if (!r.ok) return res.status(502).end();
  const type = r.headers.get("content-type") || "image/gif";
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("jpeg") ? "jpg" : "gif";
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Disposition", `attachment; filename="${name}.${ext}"`);
  res.send(Buffer.from(await r.arrayBuffer()));
});

app.listen(PORT, () => console.log(`Stickr API on :${PORT}`));
