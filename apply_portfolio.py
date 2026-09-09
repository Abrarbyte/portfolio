# -*- coding: utf-8 -*-
"""Rewrite portfolio content from Abrar's resumes. Edits prerendered HTML + React chunks."""
import io, os, shutil

HTML = "index.html"
MAIN = r"_next\static\chunks\4d3f3b68dbbde33a.js"   # hero, bio, statements
FOOT = r"_next\static\chunks\2689132c4e070b68.js"   # contact + socials
WORK = r"_next\static\chunks\d59f7a97fb1c563f.js"   # project array

for f in (HTML, MAIN, FOOT, WORK):
    if not os.path.exists(f + ".pre_content_bak"):
        shutil.copy2(f, f + ".pre_content_bak")

R = {f: io.open(f, encoding="utf-8").read() for f in (HTML, MAIN, FOOT, WORK)}
LOG = []


def sub(f, old, new, count=1, label=""):
    n = R[f].count(old)
    assert n == count, "%s: expected %d of %r, found %d" % (label, count, old[:70], n)
    R[f] = R[f].replace(old, new)
    LOG.append("%-22s %-22s x%d" % (os.path.basename(f), label, n))


LINK = ("inline text-l1 underline underline-offset-[0.08em] decoration-solid "
        "decoration-(--label-3) transition-[text-decoration-color] duration-150 ease-out "
        "lg:[@media(hover:hover)]:hover:decoration-(--label-1)")

BIO = ("I'm Abrar, a Python backend developer at Aarmarks Media, building production REST "
       "APIs, relational data models, and authentication systems. Outside work, I'm building "
       "DukaanAI — an AI business platform for shop owners.")
ST1 = ("I build the parts of a product people never see — REST APIs, relational schemas, "
       "authentication and session security — and the AI layers that sit on top of them.")

# ---------------------------------------------------------------- 1. hero
sub(MAIN, 'cY.default,{text:"Design &",startDelayMs:300',
          'cY.default,{text:"Backend &",startDelayMs:300', 1, "hero line 1")
sub(MAIN, 'cY.default,{text:"Engineering",startDelayMs:300',
          'cY.default,{text:"Applied AI",startDelayMs:300', 1, "hero line 2")
sub(MAIN, 'text:"Thinking in systems. Designing with care."',
          'text:"Thinking in systems. Building with care."', 1, "tagline")
sub(HTML, "<span>Design &amp;</span>", "<span>Backend &amp;</span>", 1, "hero line 1")
sub(HTML, "<span>Engineering</span>", "<span>Applied AI</span>", 1, "hero line 2")
sub(HTML, "<span>Thinking in systems. Designing with care.</span>",
          "<span>Thinking in systems. Building with care.</span>", 1, "tagline")

# ---------------------------------------------------------------- 2. bio (drop passcode lock)
old_bio_js = ('["I\'m Abrar, a Design Engineer exploring AI and building digital products at ",'
              '{length:c1,scramble:n?c0:(0,cZ.passcodeLockedPlaceholderText)(),'
              'className:n?void 0:cZ.PASSCODE_LOCKED_SCRAMBLE_CLASS,settled:(0,s.jsx)(c2,{})},'
              '", engineering, and AI at scale. Outside work, '
              'I build design tools for team efficiency."]')
sub(MAIN, old_bio_js, '["%s"]' % BIO, 1, "bio")

i = R[HTML].find('xl:col-start-9 mt-auto lg:mt-0 p-2" style="opacity:0">')
j = R[HTML].find("</div>", i)
assert i > 0 and j > i, "bio html not found"
R[HTML] = (R[HTML][:i]
           + 'xl:col-start-9 mt-auto lg:mt-0 p-2" style="opacity:0"><span>%s</span></span>'
             % BIO.replace("'", "&#x27;")
           + R[HTML][j:])
LOG.append("%-22s %-22s x1" % ("index.html", "bio"))

# ---------------------------------------------------------------- 3. statements
sub(MAIN, '"I explore how to shape AI-era workflows with craft and taste, '
          'building the next generation of digital products."', '"%s"' % ST1, 1, "statement 1")
sub(HTML, "<span>I explore how to shape AI-era workflows with craft and taste, "
          "building the next generation of digital products.</span>",
          "<span>%s</span>" % ST1, 1, "statement 1")

GH, AM = "https://github.com/Abrarbyte", "https://aarmarksmedia.com"
TAIL = " on a live multi-app SaaS suite. Previously ABis Infotech Solutions."


def jsx_link(href, text):
    return ('(0,s.jsx)(c.default,{href:"%s",target:"_blank",rel:"noopener noreferrer",'
            'className:"%s",children:"%s"})' % (href, LINK, text))


i = R[MAIN].find('children:["I’m building"," "')
end = ', and 100offer."]})})]})'
j = R[MAIN].find(end, i) + len(end)
assert i > 0 and j > i, "statement 2 js not found"
R[MAIN] = (R[MAIN][:i]
           + 'children:["I’m building"," ",%s,", and work at"," ",%s,"%s"]})})]})'
             % (jsx_link(GH, "DukaanAI"), jsx_link(AM, "Aarmarks Media"), TAIL)
           + R[MAIN][j:])
LOG.append("%-22s %-22s x1" % (os.path.basename(MAIN), "statement 2"))


def a_html(href, text):
    return ('<a target="_blank" rel="noopener noreferrer" class="%s" href="%s">%s</a>'
            % (LINK, href, text))


i = R[HTML].find("<span>I’m building<!-- --> ")
end = ", and 100offer.</span>"
j = R[HTML].find(end, i) + len(end)
assert i > 0 and j > i, "statement 2 html not found"
R[HTML] = (R[HTML][:i]
           + "<span>I’m building<!-- --> %s, and work at<!-- --> %s%s</span>"
             % (a_html(GH, "DukaanAI"), a_html(AM, "Aarmarks Media"), TAIL)
           + R[HTML][j:])
LOG.append("%-22s %-22s x1" % ("index.html", "statement 2"))

# ---------------------------------------------------------------- 4. contact + socials
sub(FOOT, 'href:"mailto:contact@abrar.design"',
          'href:"mailto:abrarpatel454@gmail.com"', 1, "mailto")
sub(FOOT, 'text:"contact@abrar.design"', 'text:"abrarpatel454@gmail.com"', 1, "email label")
sub(FOOT, '[{href:"https://twitter.com/abrar",label:"Twitter/X"},'
          '{href:"https://www.figma.com/@abrar",label:"Figma"},'
          '{href:"https://github.com/abrar",label:"GitHub"}]',
          '[{href:"https://github.com/Abrarbyte",label:"GitHub"},'
          '{href:"https://linkedin.com/in/abrar-patel",label:"LinkedIn"}]', 1, "socials")
sub(HTML, "mailto:contact@abrar.design", "mailto:abrarpatel454@gmail.com", 1, "mailto")
sub(HTML, "<span>contact@abrar.design</span>",
          "<span>abrarpatel454@gmail.com</span>", 1, "email label")
sub(HTML, "https://twitter.com/abrar", "https://github.com/Abrarbyte", 1, "social href 1")
sub(HTML, "<span>Twitter/X</span>", "<span>GitHub</span>", 1, "social label 1")
sub(HTML, "https://www.figma.com/@abrar", "https://linkedin.com/in/abrar-patel", 1, "social href 2")
sub(HTML, "<span>Figma</span>", "<span>LinkedIn</span>", 1, "social label 2")

# ---------------------------------------------------------------- 5. projects
GRID = [
    "col-span-12 lg:col-span-8 lg:col-start-3",
    "col-span-12 lg:col-span-8 lg:col-start-5",
    "col-span-12 lg:col-start-1 lg:col-span-6 xl:col-span-5",
    "col-span-12 lg:col-span-6 xl:col-span-5 lg:col-start-7 xl:col-start-7",
    "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-6 xl:col-span-3",
    "col-span-6 lg:col-start-9 lg:col-span-4 xl:col-start-10 xl:col-span-3",
    "col-span-12 lg:col-start-1 lg:col-span-4 xl:col-start-1 xl:col-span-3",
    "col-span-6 lg:col-start-5 lg:col-span-4 xl:col-start-5 xl:col-span-3",
]
# name, slug, year, type label, href, "Coding Project" badge
PROJ = [
    ("DukaanAI",             "dukaanai",    "2025-2026", "product", GH, True),
    ("Field-Sales CRM",      "crm",         "2026",      "work",    AM, True),
    ("AITremarkIQ",          "aitremarkiq", "2026",      "work",    AM, False),
    ("EVATE",                "evate",       "2025",      "web",     GH, True),
    ("IRAF",                 "iraf",        "2024",      "web",     GH, True),
    ("Intrusion Detection",  "ids",         "2024",      "ml",      GH, True),
    ("Task Management API",  "taskapi",     "2024",      "api",     GH, True),
    ("Applied ML Pipelines", "mlpipelines", "2025",      "ml",      GH, False),
]

items = []
for k, (name, slug, year, typ, href, coding) in enumerate(PROJ):
    items.append('{name:"%s",imageUrl:"/work/abrar_%s.png",hoverImageUrl:"/work/abrar_%s_h.png",'
                 'href:"%s",year:"%s",type:"%s",gridClass:"%s"%s}'
                 % (name, slug, slug, href, year, typ, GRID[k],
                    ",codingProject:!0" if coding else ""))
i = R[WORK].find("let g=[{name:m()")
j = R[WORK].find("}];", i) + 3
assert i > 0 and j > i, "project array not found"
R[WORK] = R[WORK][:i] + "let g=[" + ",".join(items) + "];" + R[WORK][j:]
LOG.append("%-22s %-22s 11 -> %d" % (os.path.basename(WORK), "project array", len(PROJ)))

BADGE = ('<span class="top-0 right-0 z-10 absolute bg-selection px-1 font-mono-2 text-black '
         'text-xs uppercase pointer-events-none select-none" aria-hidden="true">'
         "Coding Project</span>")
arts = []
for k, (name, slug, year, typ, href, coding) in enumerate(PROJ):
    arts.append(
        '<article class="%s">'
        '<a class="group block space-y-3 p-2" aria-label="%s - %s (external)" target="_blank" '
        'rel="noopener noreferrer" href="%s">'
        '<div aria-hidden="true" class="relative w-full pointer-events-none select-none" '
        'style="aspect-ratio:1 / 1">%s</div>'
        '<div class="flex justify-between items-center gap-3 min-w-0 text-xs lg:text-sm uppercase">'
        '<span class="flex-1 min-w-0 truncate">%s</span>'
        '<div class="flex items-center gap-2 sm:gap-3 font-mono-2 tabular-nums '
        'whitespace-nowrap shrink-0"><span>%s</span>'
        '<span class="hidden lg:inline-flex items-center gap-1" aria-hidden="true">'
        "<span>%s</span><span>↗</span></span></div></div></a></article>"
        % (GRID[k], name, year, href, BADGE if coding else "", name, year, typ))

i = R[HTML].find('<section id="selected-work"')
j = R[HTML].find("</section>", i)
assert i > 0 and j > i, "work section not found"
head = ('<section id="selected-work" class="px-4 lg:px-14 py-18 lg:py-24 w-full">'
        '<div class="grid grid-cols-12 w-full" style="row-gap:0px">')
R[HTML] = R[HTML][:i] + head + "".join(arts) + "</div>" + R[HTML][j:]
LOG.append("%-22s %-22s 10 -> %d" % ("index.html", "project cards", len(PROJ)))

for f, s in R.items():
    io.open(f, "w", encoding="utf-8").write(s)
print("\n".join(LOG))
print("\nOK - %d files written" % len(R))
