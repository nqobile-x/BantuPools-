"""Static checks for the Bantu Pools site. Run with: npm run check

Reports broken local references, duplicate or dangling ids, missing alt text or
dimensions, invalid JSON-LD, inline event handlers, unsafe target=_blank links,
and sitemap entries that point at missing files. Also checks that the files the
pages load are not excluded by .vercelignore.
"""
import hashlib
import html.parser
import json
import os
import re
import sys
import urllib.parse

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
PAGES = ["index.html", "services.html", "404.html"]
EXTERNAL = re.compile(r"^(https?:|mailto:|tel:|data:|//)", re.I)
JS_URL = re.compile(r"^\s*javascript:", re.I)
SITEMAP_LOC = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>")
# main.ts builds these paths from a template literal, so the regex scan cannot see them.
REQUIRED_ASSETS = ["assets/video/pool-story-desktop.mp4", "assets/video/pool-story-mobile.mp4"]
VENDOR_LENIS = ("vendor/lenis.min.js", "node_modules/lenis/dist/lenis.min.js")


class PageParser(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []          # (tag, attr, value)
        self.imgs = []          # attribute dicts
        self.ld_blocks = []
        self.aria_refs = []     # (tag, attr, value)
        self.blank_no_noopener = []
        self.inline_handlers = []
        self._in_ld = False
        self._ld_buf = []

    def handle_starttag(self, tag, attrs):
        a = {k: (v if v is not None else "") for k, v in attrs}
        if "id" in a:
            self.ids.append(a["id"])
        for k in ("href", "src", "poster", "data-src", "xlink:href"):
            if a.get(k):
                self.refs.append((tag, k, a[k]))
        for k in ("srcset", "imagesrcset"):
            for part in a.get(k, "").split(","):
                url = part.strip().split(" ")[0]
                if url:
                    self.refs.append((tag, k, url))
        if tag == "img":
            self.imgs.append(a)
        media_type = a.get("type", "").split(";")[0].strip().lower()
        if tag == "script" and media_type == "application/ld+json":
            self._in_ld = True
            self._ld_buf = []
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in a.get("rel", ""):
            self.blank_no_noopener.append(a.get("href", ""))
        for k in a:
            if k.startswith("on"):
                self.inline_handlers.append((tag, k))
        for k in ("aria-controls", "aria-labelledby", "aria-describedby"):
            if a.get(k):
                self.aria_refs.append((tag, k, a[k]))

    def handle_endtag(self, tag):
        if tag == "script" and self._in_ld:
            self._in_ld = False
            self.ld_blocks.append("".join(self._ld_buf))

    def handle_data(self, data):
        if self._in_ld:
            self._ld_buf.append(data)


def read(path):
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def resolve_local(base_file, url):
    """Map a URL found in base_file to an absolute path under ROOT, or None if external."""
    if EXTERNAL.match(url) or url.startswith("#"):
        return None
    path = urllib.parse.unquote(url.split("#")[0].split("?")[0])
    if path.startswith("/"):
        return os.path.normpath(os.path.join(ROOT, path.lstrip("/")))
    return os.path.normpath(os.path.join(os.path.dirname(os.path.join(ROOT, base_file)), path))


def gitignore_regex(pattern):
    """Approximate gitignore semantics: a slash anchors the pattern; '*' never crosses '/'."""
    body = pattern.strip("/")
    anchored = "/" in pattern.rstrip("/")
    regex = "".join("[^/]*" if c == "*" else re.escape(c) for c in body)
    return re.compile(("^" if anchored else "(^|/)") + regex + "(/|$)")


def load_ignore_patterns():
    path = os.path.join(ROOT, ".vercelignore")
    if not os.path.exists(path):
        return []
    lines = [line.strip() for line in read(path).splitlines()]
    return [line for line in lines if line and not line.startswith("#")]


problems = {}


def flag(section, message):
    problems.setdefault(section, []).append(message)


def check_page(page, parser):
    dupes = sorted({i for i in parser.ids if parser.ids.count(i) > 1})
    if dupes:
        flag("duplicate ids", f"{page}: {dupes}")

    for tag, attr, url in parser.refs:
        if url.startswith("#"):
            if url[1:] and url[1:] not in parser.ids:
                flag("broken fragment", f"{page}: <{tag} {attr}={url}>")
            continue
        target = resolve_local(page, url)
        if target is not None and not os.path.exists(target):
            flag("broken local ref", f"{page}: <{tag} {attr}={url}>")

    for tag, attr, id_list in parser.aria_refs:
        for ref in id_list.split():
            if ref not in parser.ids:
                flag("broken aria ref", f"{page}: <{tag} {attr}={ref}>")

    for img in parser.imgs:
        src = img.get("src", "<none>")
        if "alt" not in img:
            flag("img missing alt", f"{page}: {src}")
        if "width" not in img or "height" not in img:
            flag("img missing width/height (CLS)", f"{page}: {src}")

    for href in parser.blank_no_noopener:
        flag("target=_blank without noopener", f"{page}: {href}")

    for _, attr, url in parser.refs:
        if JS_URL.match(url):
            flag("javascript: URL (CSP script-src 'self')", f"{page}: {attr}={url}")

    for tag, handler in parser.inline_handlers:
        flag("inline event handler (CSP)", f"{page}: <{tag} {handler}>")

    for block in parser.ld_blocks:
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            flag("invalid JSON-LD", f"{page}: {exc}")


def check_stylesheets_and_scripts(ignore_regexes):
    for rel in ["styles.css", "main.js", "theme.js"]:
        full = os.path.join(ROOT, rel)
        if not os.path.exists(full):
            flag("missing file", rel)
            continue
        text = read(full)
        for _, url in re.findall(r"url\((['\"]?)([^)'\"]+)\1\)", text):
            if url.startswith(("#", "%23", "data:")):
                continue  # fragment refs inside inline SVG data URIs, and data URIs
            target = resolve_local(rel, url)
            if target and not os.path.exists(target):
                flag("broken css url()", f"{rel}: {url}")
        for ref in re.findall(r"assets/[A-Za-z0-9_./-]+\.(?:mp4|webp|png|jpg|svg)", text):
            if not os.path.exists(os.path.join(ROOT, ref)):
                flag("broken asset path in JS/CSS", f"{rel}: {ref}")
            if any(rx.search(ref) for rx in ignore_regexes):
                flag("JS/CSS references a file .vercelignore excludes", f"{rel}: {ref}")


def check_deploy_ignore(parsed, ignore_regexes):
    for page, parser in parsed.items():
        for _, _, url in parser.refs:
            if url.startswith("#") or EXTERNAL.match(url):
                continue
            target = resolve_local(page, url)
            if target and os.path.exists(target):
                rel = os.path.relpath(target, ROOT).replace(os.sep, "/")
                if any(rx.search(rel) for rx in ignore_regexes):
                    flag("page references a file .vercelignore excludes", f"{page}: {url}")


def check_required_assets(ignore_regexes):
    for rel in REQUIRED_ASSETS:
        if not os.path.exists(os.path.join(ROOT, rel)):
            flag("required asset missing", rel)
        if any(rx.search(rel) for rx in ignore_regexes):
            flag("required asset excluded by .vercelignore", rel)


def check_vendor_copy():
    """vendor/lenis.min.js must match the npm build when node_modules is installed."""
    vendor, installed = (os.path.join(ROOT, p) for p in VENDOR_LENIS)
    if not os.path.exists(installed):
        return  # run `npm install` first to enable this check
    digest = lambda path: hashlib.sha256(open(path, "rb").read()).hexdigest()
    if not os.path.exists(vendor) or digest(vendor) != digest(installed):
        flag("vendor/lenis.min.js differs from node_modules build", VENDOR_LENIS[0])


def check_sitemap():
    path = os.path.join(ROOT, "sitemap.xml")
    if not os.path.exists(path):
        return
    for loc in SITEMAP_LOC.findall(read(path)):
        rel = urllib.parse.urlparse(loc).path.lstrip("/") or "index.html"
        if rel.endswith("/"):
            rel += "index.html"
        full = os.path.join(ROOT, rel)
        if not os.path.exists(full) and not os.path.exists(full + ".html"):
            flag("sitemap entry not on disk", loc)


def main():
    parsed = {}
    for page in PAGES:
        full = os.path.join(ROOT, page)
        if not os.path.exists(full):
            flag("missing file", page)
            continue
        parser = PageParser()
        parser.feed(read(full))
        parsed[page] = parser
        check_page(page, parser)

    ignore_regexes = [gitignore_regex(p) for p in load_ignore_patterns()]
    check_stylesheets_and_scripts(ignore_regexes)
    check_deploy_ignore(parsed, ignore_regexes)
    check_required_assets(ignore_regexes)
    check_vendor_copy()
    check_sitemap()

    print("== site check ==")
    if not problems:
        print("No issues found.")
        return 0
    for section, items in problems.items():
        print(f"\n[{section}] ({len(items)})")
        for item in items:
            print(f"  - {item}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
