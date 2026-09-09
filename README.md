# abrar.design — offline mirror

Captured **2026-09-01** from <https://abrar.design>.
Portfolio of Abrar. Built with **Next.js (App Router, Turbopack)**, hosted on **Vercel**
(deployment id `dpl_CydG2SHX387W4U5vX9NPppQSvmSt`).

## Run it

```bash
python -m http.server 8788 --directory abrar-design-mirror
```

Then open <http://localhost:8788>. A static server is required — the site uses
root-absolute paths (`/_next/...`, `/fonts/...`, `/model/...`), so `file://` will not work.
There is also a `abrar-mirror` entry in `.claude/launch.json`.

Verified offline: homepage 3D "hello" model, custom cursor, fonts, all seven routes,
and all case-study imagery load with zero console errors.

## What's here

| Path | Contents |
|---|---|
| `index.html`, `adrive/`, `inspire_mono/`, `reunimos/`, `shore_icon/`, `teambition/`, `wasm_design_utils/` | The 7 rendered pages (server HTML incl. inline RSC payload) |
| `_next/static/chunks/` | 16 production JS chunks + 1 CSS bundle (Tailwind v4) |
| `_rsc/` | Raw React Server Component flight payloads per route |
| `fonts/` | `DepartureMono-Regular.otf`, `GeistMono[wght].ttf`, `TikTokSans.ttf`, `InspireMono.zip` — loaded at runtime via the `FontFace` API, not referenced in CSS |
| `model/` | `hello.gltf`, `cnt.gltf`, `cursor.glb` — three.js / react-three-fiber assets (geometry is base64-embedded, no external `.bin`) |
| `work/`, `sticker_img/`, `img/` | Homepage imagery |
| `bgm.mp3` | Background audio behind the SOUND toggle |
| `_external/mysite2026-blog-cyn6.vercel.app/` | 40 case-study images that the live site hot-links from a second Vercel deployment |
| `_manifest.txt` | Full file listing with sizes |

## Two modifications made to the captured HTML

1. `?dpl=dpl_...` deployment-id query strings stripped from asset URLs, so paths resolve
   against a plain static server.
2. `https://mysite2026-blog-cyn6.vercel.app/` rewritten to `/_external/mysite2026-blog-cyn6.vercel.app/`
   in the 3 case-study pages and their RSC payloads, so the images resolve locally instead of
   hot-linking. Everything else is byte-for-byte as served.

## What could NOT be downloaded

This is the **built output**, not the project. The following are not publicly reachable and
are not in this folder:

- **Original source** (`.tsx`/`.ts` components, `app/` router files). Source maps are not
  published — every `/_next/static/chunks/*.js.map` returns 404 — so the JS here is minified
  and cannot be reconstructed back to readable source.
- **Config files** — `next.config.js`, `package.json`, `tsconfig.json`, `tailwind.config`,
  `vercel.json`, `.env`. These live in the repo/build environment and are never served.
- **Server-side code** — server components, route handlers, middleware.
- `/robots.txt`, `/sitemap.xml`, `/manifest.json` — the site does not publish them (all 404;
  the pages carry `<meta name="robots" content="noindex">` instead).
- `/stories/figma_and_me` — linked from the homepage but 404 on the live site.

Two runtime dependencies stay external and will fail offline (by design, not missing files):
the weather readout in the footer calls `devapi.qweather.com`, and Vercel analytics calls
`vercel.live`.

## Reuse

Content, imagery, code and design are the author's (© 2026 Abrar,
<https://github.com/abrar>). This copy is fine as a local reference or archive;
republishing it, or reusing the assets, needs their permission.
