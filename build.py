# Generates every page of the site. Edit the copy here, then run: python3 build.py
import json, html

DOMAIN = "https://grabstickr.com"   # <- change to your real domain before going live
BRAND = "GrabStickr"

PAGES = [
  dict(slug="index", nav="Home",
    title="GrabStickr – Download TikTok Comment Stickers & GIFs",
    desc="Paste a TikTok link and grab every sticker and GIF from the comments. Free, no signup. Works with single comment links too.",
    h1="Grab stickers & GIFs from any TikTok",
    lead="Paste a TikTok video link. We'll pull every sticker and GIF from the comments.",
    steps=["Copy the link to any public TikTok video (tap Share, then Copy link).",
           "Paste it into the box below and hit the arrow.",
           "Tap download, or pick a few and grab them together. Free."],
    faq=[("Is GrabStickr free?","Yes, completely. Downloads show a short ad. Premium (£3.99/month) removes the ads."),
         ("Can I grab the GIF from just one comment?","Yes. On TikTok, long-press the comment, tap Share, copy the link and paste it here. You get just that GIF."),
         ("Do I need to log in to TikTok?","No. GrabStickr only reads public videos, so you never share your TikTok login."),
         ("Does it work on iPhone and Android?","Yes. It runs in your phone's browser, nothing to install.")]),
  dict(slug="tiktok-sticker-downloader", nav="TikTok Sticker Downloader",
    title="TikTok Sticker Downloader – Save Comment Stickers Free | GrabStickr",
    desc="Free TikTok sticker downloader. Save the stickers people post in TikTok comments in seconds, straight from your phone.",
    h1="TikTok Sticker Downloader",
    lead="Saw a sticker in the comments you need? Paste the video link and save it in seconds.",
    steps=["Open the TikTok video with the sticker in its comments.",
           "Tap Share → Copy link, then paste it below.",
           "Every sticker from the comments shows up. Tap download on the one you want."],
    faq=[("Can I save a sticker from one specific comment?","GrabStickr pulls every sticker from the video's comments into one grid, so you can scroll and pick the exact one."),
         ("What format are the stickers?","You get the original file TikTok uses, usually PNG or WebP for still stickers."),
         ("Is there a download limit?","No. Download as many as you want, free.")]),
  dict(slug="tiktok-gif-downloader", nav="TikTok GIF Downloader",
    title="Download GIFs from TikTok Comments | GrabStickr",
    desc="Download the GIFs people reply with in TikTok comments. Paste a link, get every comment GIF, keep the animation.",
    h1="Download GIFs from TikTok comments",
    lead="Keep the animation. Grab every reaction GIF from a TikTok comment section.",
    steps=["Copy the TikTok video link.",
           "Paste it below. GrabStickr finds every GIF in the replies.",
           "Tap the ones you want and download them, each as its own file."],
    faq=[("Will the GIF still move after I download it?","Yes. You get the animated file, not a screenshot."),
         ("Can I use these GIFs anywhere?","Many comment GIFs come from GIF libraries or other creators, so check you're allowed before using them commercially."),
         ("Does it find GIFs in replies to replies?","It reads the main comment thread. Nested replies are coming soon.")]),
  dict(slug="tiktok-stickers-to-whatsapp", nav="TikTok Stickers to WhatsApp",
    title="Turn TikTok Comment Stickers into WhatsApp Stickers | GrabStickr",
    desc="Turn TikTok comment stickers into a WhatsApp sticker pack. Paste a link, pick your favourites, send them to your chats.",
    h1="TikTok stickers → WhatsApp",
    lead="Turn the funniest comment stickers into a pack you can send in WhatsApp.",
    steps=["Paste the TikTok link below.",
           "Pick the stickers you want in your pack.",
           "Download the pack and add it to WhatsApp."],
    faq=[("How many stickers go in a WhatsApp pack?","WhatsApp packs hold between 3 and 30 stickers. We resize them for you."),
         ("Does it work with animated stickers?","Yes, animated ones become animated WhatsApp stickers."),
         ("Is it free?","Yes. Premium just removes the ads.")]),
  dict(slug="tiktok-sticker-to-png", nav="TikTok Sticker to PNG",
    title="Save TikTok Comment Stickers as PNG | GrabStickr",
    desc="Save TikTok comment stickers as transparent PNGs, ready for edits, thumbnails and memes.",
    h1="TikTok sticker to PNG",
    lead="Get comment stickers as transparent PNGs, ready to drop into edits and memes.",
    steps=["Copy the TikTok video link.",
           "Paste it below and wait a few seconds.",
           "Download as PNG, keeping the transparent background."],
    faq=[("Is the background transparent?","If the original sticker has a transparent background, the PNG keeps it."),
         ("Can I use them in CapCut or Canva?","Yes. Drag the PNG straight into your editor."),
         ("What about animated stickers?","Animated stickers download as GIFs. Use the GIF downloader if you want to keep the movement.")]),
  dict(slug="tiktok-comment-gif-viewer", nav="TikTok Comment GIF Viewer",
    title="View All GIFs & Stickers in TikTok Comments | GrabStickr",
    desc="See every GIF and sticker posted in a TikTok comment section on one page, without scrolling through thousands of comments.",
    h1="See every GIF in a TikTok comment section",
    lead="Skip the endless scrolling. See every sticker and GIF from the comments on one page.",
    steps=["Paste any public TikTok link below.",
           "GrabStickr scans the comments and shows every sticker and GIF in one grid.",
           "Browse free, download what you like."],
    faq=[("Is viewing free?","Yes. Browsing and downloading are both free."),
         ("Do the comment authors find out?","No. GrabStickr only reads public comments. Nobody gets notified."),
         ("Does it work on viral videos with thousands of comments?","Yes. Stickers load in batches, so tap Load more to keep going through big comment sections.")]),
]

def footer(current):
    links = "".join(f'<a href="{"./" if p["slug"]=="index" else p["slug"]+".html"}">{p["nav"]}</a>' for p in PAGES)
    links += '<a href="index.html#pricing">Pricing</a><a href="terms.html">Terms</a><a href="privacy.html">Privacy</a>'
    return f'''<footer><div class="wrap"><div class="links">{links}</div>
<div>© 2026 {BRAND}. Not affiliated with TikTok.</div></div></footer>'''

def head(title, desc, slug):
    url = DOMAIN + ("/" if slug=="index" else f"/{slug}.html")
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">'''

HEADER = '''<header>
  <a class="logo" href="./" style="text-decoration:none;color:inherit">✨ <span>Grab</span><span>Stickr</span></a>
  <button class="btn-ghost" onclick="openPricing()">Pricing</button>
</header>'''

COMPOSER_AND_MODAL = '''<div class="composer">
  <div class="wrap">
    <form class="box" id="form">
      <input id="url" type="url" inputmode="url" autocomplete="off" placeholder="Paste a TikTok link…">
      <button class="send" id="send" disabled aria-label="Send">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>
    </form>
    <div class="fine">Only download content you have the right to use.</div>
  </div>
</div>
<div class="overlay" id="pricing" onclick="if(event.target===this)closePricing()">
  <div class="modal">
    <button class="x" onclick="closePricing()">×</button>
    <h2>GrabStickr Premium</h2>
    <div class="sub">Everything's free. Premium just makes it faster.</div>
    <div class="plan sel">
      <div><b>No ads, ever</b><small>Instant downloads · Cancel anytime</small></div>
      <div class="p">£3.99<small style="display:inline">/mo</small></div>
    </div>
    <button class="btn btn-white" style="width:100%;margin-top:6px" onclick="checkout()">Go Premium</button>
  </div>
</div>
<div class="overlay" id="ad">
  <div class="modal" style="text-align:center">
    <div class="sub" style="margin-bottom:10px">Ad · <span id="adcount">5</span></div>
    <div id="adslot">Your ad here</div>
    <button class="btn btn-white" id="adskip" style="width:100%;margin-top:12px" disabled>Download in 5s</button>
    <button class="btn" style="background:none;color:var(--muted);margin-top:6px" onclick="document.getElementById('ad').classList.remove('show');openPricing()">Skip ads forever – £3.99/mo</button>
  </div>
</div>
<div class="toast" id="toast"></div>'''

def tool_page(p):
    chips = "" if p["slug"]!="index" else '''<div class="chips"><div class="chip">🎁 100% free</div><div class="chip">👆 Pick exactly the GIFs you want</div><div class="chip">💬 Works with single comments</div></div>'''
    steps = "".join(f"<li>{s}</li>" for s in p["steps"])
    faqs = "".join(f"<details><summary>{q}</summary><p>{a}</p></details>" for q,a in p["faq"])
    ld = json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
        {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in p["faq"]]})
    return f'''{head(p["title"], p["desc"], p["slug"])}
<script type="application/ld+json">{ld}</script>
</head>
<body>
{HEADER}
<main id="scroller">
  <div class="wrap" id="hero">
    <h1>{p["h1"]}</h1>
    <p>{p["lead"]}</p>
    {chips}
  </div>
  <div class="wrap" id="chat" style="display:none"></div>
  <section class="wrap" id="seo">
    <h2>How it works</h2>
    <ol>{steps}</ol>
    <h2>FAQ</h2>
    {faqs}
  </section>
  {footer(p["slug"])}
</main>
{COMPOSER_AND_MODAL}
<script src="app.js"></script>
</body>
</html>
'''

LEGAL = {
 "terms": ("Terms of Service", "The rules for using GrabStickr, including downloads, Premium, ads and copyright.", '''
<p style="color:var(--muted)">Last updated: November 2026</p>
<h2>1. What GrabStickr is</h2><p>GrabStickr is a free tool that finds stickers, GIFs and images posted in public TikTok comments and lets you download them. You paste a link, we fetch what's publicly visible, and we hand you the file. We don't keep files on our servers longer than it takes to deliver them.</p>
<h2>2. Not connected to TikTok</h2><p>GrabStickr is independent. We're not affiliated with, endorsed by or sponsored by TikTok or ByteDance. TikTok is a trademark of ByteDance Ltd.</p>
<h2>3. Who can use it</h2><p>You need to be at least 13 to use GrabStickr, and at least 18 (or have a parent's permission) to buy Premium.</p>
<h2>4. Your responsibilities</h2><ul>
<li>Stickers and GIFs belong to the people who made them, or to the GIF libraries they come from. Downloading one doesn't give you any rights to it.</li>
<li>Only use downloads for personal use, or where you have the owner's permission. Don't sell or redistribute them.</li>
<li>Don't use bots or scripts to hammer the site, try to get around our limits or security, or use GrabStickr to harass anyone.</li></ul>
<h2>5. Copyright complaints</h2><p>If something you own shows up through GrabStickr and you want it removed, email us with the link, proof you own it and your contact details. We aim to act on valid requests within 2 working days.</p>
<h2>6. Ads</h2><p>GrabStickr is free because it shows ads, including a short ad before downloads. Ads are provided by third-party ad networks, and we don't control what they show. Ads are never disguised as download buttons.</p>
<h2>7. Premium</h2><ul>
<li>Premium costs £3.99 a month, renews automatically and removes ads.</li>
<li>Cancel anytime. You keep Premium until the end of the month you've paid for.</li>
<li>Under UK law you can cancel within 14 days of first subscribing for a refund. By starting Premium straight away you agree that you'll get a refund only for the part of the 14 days you haven't used.</li>
<li>Payments are handled by Stripe. We never see your full card details.</li></ul>
<h2>8. No guarantees</h2><p>GrabStickr relies on TikTok's public website, which can change without warning. We'll do our best, but we can't promise the site will always work, find every sticker, or be error-free. Nothing in these terms limits your rights under UK consumer law.</p>
<h2>9. Changes</h2><p>We may update these terms. If we make a big change that affects Premium subscribers, we'll tell you before it applies.</p>
<h2>10. Law</h2><p>These terms are governed by the law of England and Wales.</p>
<h2>Contact</h2><p>hello@grabstickr.com</p>'''),
 "privacy": ("Privacy Policy", "How GrabStickr handles your data.", '''
<h2>What we collect</h2><ul><li>The TikTok links you paste, so we can fetch the stickers.</li><li>Payment details, handled by Stripe. We never see your full card number.</li><li>Basic usage data (pages visited, device type) to improve the site.</li></ul>
<h2>Ads and cookies</h2><p>Our ad partners use cookies to show and measure ads. In the UK we'll ask before using cookies for personalised ads, and you can say no.</p>
<h2>What we don't do</h2><p>We don't ask for your TikTok login, and we don't sell your data.</p>
<h2>How long we keep it</h2><p>Fetched sticker results are cached for up to 30 minutes, then deleted.</p>
<h2>Your rights</h2><p>Under UK GDPR you can ask to see or delete your data. Email hello@grabstickr.com.</p>'''),
}

def legal_page(slug, title, desc, body):
    return f'''{head(f"{title} | {BRAND}", desc, slug)}
</head>
<body>
{HEADER}
<main id="scroller">
  <div class="wrap legal">
    <h1>{title}</h1>
    <div class="note">Template only. Have this checked before you take payments.</div>
    {body}
  </div>
  {footer(slug)}
</main>
<div class="overlay" id="pricing" onclick="if(event.target===this)closePricing()"><div class="modal"><button class="x" onclick="closePricing()">×</button><h2>Pricing</h2><div class="sub">Paste a link on the <a href="./" style="color:#fff">home page</a> to start. Premium (£3.99/month) removes ads.</div></div></div>
<script>function openPricing(){{document.getElementById('pricing').classList.add('show')}}function closePricing(){{document.getElementById('pricing').classList.remove('show')}}</script>
</body>
</html>
'''

for p in PAGES:
    open(f'{p["slug"]}.html', "w").write(tool_page(p))
for slug,(t,d,b) in LEGAL.items():
    open(f"{slug}.html","w").write(legal_page(slug,t,d,b))

urls = [DOMAIN+"/"] + [f"{DOMAIN}/{p['slug']}.html" for p in PAGES if p["slug"]!="index"] + [f"{DOMAIN}/terms.html", f"{DOMAIN}/privacy.html"]
open("sitemap.xml","w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")
open("robots.txt","w").write(f"User-agent: *\nAllow: /\nSitemap: {DOMAIN}/sitemap.xml\n")
print("Built", len(PAGES)+len(LEGAL), "pages")
