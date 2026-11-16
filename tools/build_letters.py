#!/usr/bin/env python3
"""Build the letters section of akshitparmar.com from content/letters/*.md.

Each source file: content/letters/YYYY-MM-DD-slug.md
  line 1: "# Title"
  line 3: "*Akshit Parmar · 13 November 2026 · Status: finalised*"  (optional "· Public: no")
  then the letter in Markdown.
Only letters with Status: finalised and not Public: no are published, and only
when their date is on or before --today (so a letter can wait for its Monday).

Writes: letters/index.html, letters/<slug>/index.html, letters/feed.xml,
and refreshes the "latest letter" block on the home page, sitemap.xml and llms.txt.
Run from the repo root:  python3 tools/build_letters.py [--today YYYY-MM-DD]
"""
import argparse, datetime as dt, html, json, math, pathlib, re
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'content' / 'letters'
OUT = ROOT / 'letters'
SITE = 'https://akshitparmar.com'


def parse(path):
    raw = path.read_text(encoding='utf-8').strip()
    m = re.match(r'(\d{4}-\d{2}-\d{2})-(.+)\.md$', path.name)
    if not m:
        return None
    date = dt.date.fromisoformat(m.group(1))
    lines = raw.splitlines()
    title = lines[0].lstrip('# ').strip()
    meta = ''
    body_start = 1
    for i, ln in enumerate(lines[1:6], 1):
        if ln.strip().startswith('*') and 'Status' in ln:
            meta = ln.strip().strip('*')
            body_start = i + 1
            break
    status = re.search(r'Status:\s*([A-Za-z]+)', meta)
    public = re.search(r'Public:\s*([A-Za-z]+)', meta)
    body_md = '\n'.join(lines[body_start:]).strip()
    words = len(re.findall(r'\w+', body_md))
    slug = re.sub(r'-i-guess$', '', m.group(2)) if False else m.group(2)
    body_html = markdown.markdown(body_md, extensions=['smarty'])
    first = re.sub(r'<[^>]+>', '', body_html.split('</p>')[0]).strip()
    desc = first if len(first) <= 200 else first[:first.rfind(' ', 0, 197)] + '…'
    return dict(date=date, slug=slug, title=title, status=(status.group(1).lower() if status else 'draft'),
                public=(public.group(1).lower() != 'no') if public else True,
                body=body_html, words=words, minutes=max(1, math.ceil(words / 220)), desc=desc)


def fmt(d):
    return f'{d.day} {d.strftime("%B %Y")}'


def shell(src_html):
    """Head bits, header and footer from the Trividh pilot page, so letters share the site's look."""
    head_end = src_html.index('<title>')
    pre = src_html[:head_end]
    fonts = re.search(r'<link rel="preconnect".*?<link rel="stylesheet" href="\.\./\.\./site\.css">', src_html, re.S).group(0)
    header = src_html[src_html.index('<header'):src_html.index('</header>') + 9]
    footer = src_html[src_html.index('<footer>'):src_html.index('</footer>') + 9]
    return pre, fonts, header, footer


def fix_depth(s, depth):
    # source shell is two levels deep (../../); letters pages are 1 or 2 deep
    if depth == 2:
        return s
    return s.replace('../../', '../')


def nav_current(header):
    header = header.replace(' aria-current="page"', '')
    return header


def signup(h, p):
    return f'''<section class="s" id="letter" aria-labelledby="h-letter">
  <div class="wrap letter">
    <div class="copy">
      <p class="label">The weekly letter</p>
      <h2 id="h-letter">{h}</h2>
      <p>{p}</p>
    </div>
    <form class="paper" id="sub" novalidate>
      <p class="q">One email a week. Free.</p>
      <label for="email">Your email</label>
      <input id="email" type="email" autocomplete="email" placeholder="you@somewhere.com" required>
      <button class="pill" type="submit" id="subBtn" style="align-self:flex-start">Join the letter</button>
      <p class="fine" id="subMsg" aria-live="polite">Your email app opens with a short note to me. Hit send and you are on the list. I read every reply.</p>
    </form>
  </div>
</section>
'''


def page(depth, title, desc, path, ogtype, ld, header, main, footer, pre, fonts):
    r = '../' * depth
    head = (pre.replace('<html lang="en-IN">', '<html lang="en-IN">') +
            f'<title>{html.escape(title)}</title>\n'
            f'<meta name="description" content="{html.escape(desc)}">\n'
            f'<meta name="author" content="Akshit Suraj Parmar">\n'
            f'<meta property="og:type" content="{ogtype}">\n'
            f'<meta property="og:title" content="{html.escape(title)}">\n'
            f'<meta property="og:description" content="{html.escape(desc)}">\n'
            f'<meta property="og:url" content="{SITE}/{path}">\n'
            f'<meta property="og:image" content="{SITE}/img/og.jpg">\n'
            f'<meta name="twitter:card" content="summary_large_image">\n'
            f'<link rel="icon" href="{r}favicon.svg" type="image/svg+xml">\n'
            f'<link rel="icon" href="{r}favicon-32.png" sizes="32x32" type="image/png">\n'
            f'<link rel="apple-touch-icon" href="{r}apple-touch-icon.png">\n'
            f'<link rel="canonical" href="{SITE}/{path}">\n'
            f'<link rel="alternate" type="application/rss+xml" title="Akshit Suraj Parmar · The weekly letter" href="{SITE}/letters/feed.xml">\n'
            + fix_depth(fonts, depth) + '\n'
            f'<script type="application/ld+json">\n{json.dumps(ld, ensure_ascii=False, indent=2)}\n</script>\n</head>\n<body>\n\n')
    return (head + fix_depth(header, depth) + '\n\n<main id="top">\n' + main + '\n</main>\n\n' +
            fix_depth(footer, depth) + f'\n<script src="{r}site.js"></script>\n</body>\n</html>\n')


def build(today):
    pre, fonts, header, footer = shell((ROOT / 'pilots' / 'trividh' / 'index.html').read_text(encoding='utf-8'))
    header = nav_current(header)
    pre = pre[:pre.index('<meta charset')] + '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="robots" content="index, follow, max-image-preview:large">\n'
    letters = [x for x in (parse(p) for p in sorted(SRC.glob('*.md'))) if x]
    live = [l for l in letters if l['status'] == 'finalised' and l['public'] and l['date'] <= today]
    live.sort(key=lambda l: l['date'], reverse=True)
    OUT.mkdir(exist_ok=True)
    person = {"@id": f"{SITE}/#person"}

    # --- one page per letter
    for i, l in enumerate(live):
        newer = live[i - 1] if i > 0 else None
        older = live[i + 1] if i + 1 < len(live) else None
        path = f'letters/{l["slug"]}/'
        ld = {"@context": "https://schema.org", "@graph": [
            {"@type": "BlogPosting", "@id": f"{SITE}/{path}#post", "headline": l['title'], "description": l['desc'],
             "datePublished": l['date'].isoformat(), "dateModified": l['date'].isoformat(), "wordCount": l['words'],
             "url": f"{SITE}/{path}", "mainEntityOfPage": f"{SITE}/{path}", "image": f"{SITE}/img/og.jpg",
             "author": {**person, "@type": "Person", "name": "Akshit Suraj Parmar", "url": f"{SITE}/"},
             "isPartOf": {"@id": f"{SITE}/letters/#blog"}},
            {"@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Akshit Suraj Parmar", "item": f"{SITE}/"},
                {"@type": "ListItem", "position": 2, "name": "Letters", "item": f"{SITE}/letters/"},
                {"@type": "ListItem", "position": 3, "name": l['title'], "item": f"{SITE}/{path}"}]}]}
        nav = '<nav class="lnav" aria-label="More letters">'
        nav += (f'<a href="../{older["slug"]}/"><span class="mono">← Earlier</span>{html.escape(older["title"])}</a>' if older else '<span></span>')
        nav += (f'<a class="r" href="../{newer["slug"]}/"><span class="mono">Later →</span>{html.escape(newer["title"])}</a>' if newer else '<span></span>')
        nav += '</nav>'
        main = f'''
<article class="s lpost" aria-labelledby="h1">
  <div class="wrap">
    <p class="crumb"><a href="../../">Home</a><span>/</span><a href="../">Letters</a><span>/</span><span>{fmt(l["date"])}</span></p>
    <header class="lhead">
      <p class="label">The weekly letter · {fmt(l["date"])}</p>
      <h1 id="h1">{html.escape(l["title"])}</h1>
      <p class="mono lmeta">By Akshit Suraj Parmar · {l["minutes"]} min read</p>
    </header>
    <div class="lbody">
{l["body"]}
    </div>
    <p class="lsign">— Akshit</p>
    {nav}
    <p style="margin-top:28px"><a class="pill ghost" href="../">All letters</a></p>
  </div>
</article>
''' + signup('Get the next one on Monday.', 'Every Monday I write to my family and close friends about building, business and life. It costs nothing, and you can reply to any of them.')
        (OUT / l['slug']).mkdir(exist_ok=True)
        (OUT / l['slug'] / 'index.html').write_text(page(2, f'{l["title"]} · Akshit Suraj Parmar', l['desc'], path, 'article', ld, header, main, footer, pre, fonts), encoding='utf-8')

    # --- archive
    items = ''.join(f'''      <li><a href="{l["slug"]}/"><span class="mono">{fmt(l["date"])}</span><span class="t">{html.escape(l["title"])}</span><span class="d">{html.escape(l["desc"])}</span><span class="mono m">{l["minutes"]} min read →</span></a></li>\n''' for l in live)
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "Blog", "@id": f"{SITE}/letters/#blog", "name": "The weekly letter", "url": f"{SITE}/letters/",
         "description": "Letters by Akshit Suraj Parmar about building, business and life, every Monday.",
         "author": {**person, "@type": "Person", "name": "Akshit Suraj Parmar"},
         "blogPost": [{"@id": f"{SITE}/letters/{l['slug']}/#post"} for l in live]}]}
    main = f'''
<section class="phero" aria-labelledby="h1">
  <div class="wrap">
    <p class="crumb"><a href="../">Home</a><span>/</span><span>Letters</span></p>
    <p class="label" style="margin-top:28px">The weekly letter</p>
    <h1 id="h1">Every Monday, one letter.</h1>
    <p class="sub">I write to my family and close friends about building, business and life. These are all of them, newest first.</p>
  </div>
</section>
<section class="s" id="all" aria-label="All letters">
  <div class="wrap">
    <ol class="larch">
{items}    </ol>
  </div>
</section>
''' + signup('Get them in your inbox.', 'One email every Monday. Free. You can reply to any of them, and I read every reply.')
    (OUT / 'index.html').write_text(page(1, 'Letters · Akshit Suraj Parmar', 'Weekly letters by Akshit Suraj Parmar, architect and developer, about building, business and life.', 'letters/', 'website', ld, header, main, footer, pre, fonts), encoding='utf-8')

    # --- RSS
    def rfc(d):
        return dt.datetime(d.year, d.month, d.day, 8, 0, tzinfo=dt.timezone(dt.timedelta(hours=5, minutes=30))).strftime('%a, %d %b %Y %H:%M:%S %z')
    rss = ['<?xml version="1.0" encoding="UTF-8"?>', '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', '<channel>',
           '<title>Akshit Suraj Parmar · The weekly letter</title>', f'<link>{SITE}/letters/</link>',
           f'<atom:link href="{SITE}/letters/feed.xml" rel="self" type="application/rss+xml"/>',
           '<description>Letters about building, business and life, every Monday.</description>', '<language>en-in</language>']
    for l in live:
        rss += ['<item>', f'<title>{html.escape(l["title"])}</title>', f'<link>{SITE}/letters/{l["slug"]}/</link>',
                f'<guid>{SITE}/letters/{l["slug"]}/</guid>', f'<pubDate>{rfc(l["date"])}</pubDate>',
                f'<description><![CDATA[{l["body"]}]]></description>', '</item>']
    rss += ['</channel>', '</rss>']
    (OUT / 'feed.xml').write_text('\n'.join(rss) + '\n', encoding='utf-8')

    # --- home page: latest letter block between markers
    home = (ROOT / 'index.html').read_text(encoding='utf-8')
    if live:
        l = live[0]
        block = (f'<!--latest-letter--><a class="latest" href="letters/{l["slug"]}/"><span class="mono">Latest letter · {fmt(l["date"])}</span>'
                 f'<span class="t">{html.escape(l["title"])}</span><span class="mono m">Read it · {l["minutes"]} min →</span></a>'
                 f'<p class="fine" style="margin-top:10px"><a href="letters/">All letters</a></p><!--/latest-letter-->')
        home = re.sub(r'<!--latest-letter-->.*?<!--/latest-letter-->', block, home, flags=re.S)
        (ROOT / 'index.html').write_text(home, encoding='utf-8')

    # --- sitemap
    sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    sm = re.sub(r'\s*<url>\s*<loc>https://akshitparmar\.com/letters/[^<]*</loc>.*?</url>', '', sm, flags=re.S)
    add = f'  <url>\n    <loc>{SITE}/letters/</loc>\n    <lastmod>{(live[0]["date"] if live else today).isoformat()}</lastmod>\n  </url>\n'
    add += ''.join(f'  <url>\n    <loc>{SITE}/letters/{l["slug"]}/</loc>\n    <lastmod>{l["date"].isoformat()}</lastmod>\n  </url>\n' for l in live)
    sm = sm.replace('</urlset>', add + '</urlset>')
    (ROOT / 'sitemap.xml').write_text(sm, encoding='utf-8')

    # --- llms.txt: letters list between markers
    ll = (ROOT / 'llms.txt').read_text(encoding='utf-8')
    lines = ''.join(f'- [{l["title"]}]({SITE}/letters/{l["slug"]}/) ({l["date"].isoformat()}): {l["desc"]}\n' for l in live)
    block = f'<!-- letters -->\n## Letters\n\nWeekly letters, newest first. Archive: {SITE}/letters/ · RSS: {SITE}/letters/feed.xml\n\n{lines}<!-- /letters -->\n'
    if '<!-- letters -->' in ll:
        ll = re.sub(r'<!-- letters -->.*?<!-- /letters -->\n', block, ll, flags=re.S)
    else:
        ll = ll.rstrip() + '\n\n' + block
    (ROOT / 'llms.txt').write_text(ll, encoding='utf-8')

    held = [l for l in letters if l not in live]
    print('published:', [l['slug'] for l in live])
    print('held back:', [(l['slug'], l['status'], 'public' if l['public'] else 'email only', l['date'].isoformat()) for l in held])


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--today', default=dt.date.today().isoformat())
    build(dt.date.fromisoformat(ap.parse_args().today))
