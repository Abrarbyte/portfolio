# Effects & Animation Reference

Every motion effect on the site, with what it does, where it lives, its tuning values, and the mechanism as readable code. The site ships as minified Next.js/Turbopack output, so the code below is reconstructed from the bundles — same logic, real variable names.

**Where things live**

| Chunk | Contains |
|---|---|
| `45df3c42dcc590d2.js` | WebGL canvas: work-card layer, 3D models, glass shader, particles, parallax, lens flare, signature |
| `3b554495831d68b8.js` | Shell: fonts, audio, scramble text, scrollbar, footer, theme, pointer |
| `0959a7c6aec18bb6.js` | `WORK_ITEMS` data (per-project layout + hover effect config) |
| `3c6cc5b2fcccdee5.js` | Entry loader, route transition curtain, fonts-ready gate |
| `72c1615b852a78d4.js` | Project page component |

Marked **[added]** = built during this session, not in the original design. Marked **[branch]** = on `card-hover-effects`, not yet merged.

---

## 1. Scroll infrastructure

### 1.1 Smooth scrolling — Lenis

Scrolling runs through Lenis in a fixed full-height container rather than the document, so every scroll-driven effect reads a single consistent `scrollTopPx` and the 3D scene can sync to it per frame.

```js
// scrollEnv is the one source of truth every effect reads
scrollEnv.getScrollTopPx()      // current scroll offset
scrollEnv.getViewportHeightPx()
scrollEnv.lenisScrollTo(y, { immediate: true })   // used for #hash deep links
```

### 1.2 Viewport-entry trigger — `useHasEnteredViewport`

The hook behind nearly every "animate when it comes into view" behaviour. IntersectionObserver, `once` by default.

```js
function useHasEnteredViewport({ once = true, threshold = 0.1, root = null, rootMargin } = {}) {
  const [el, setEl] = useState(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!el || (once && entered)) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); if (once) io.disconnect(); }
      else if (!once) setEntered(false);
    }, { threshold, root, rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [el, once, entered, threshold, root, rootMargin]);
  return { ref: setEl, hasEnteredViewport: entered };
}
```

Used with different settings per effect: scramble text `threshold 0.1`; signature `threshold 0.15, rootMargin "0px 0px -8% 0px", once: false`; sticky headline `threshold 0.35, once: false`; hyper-space `rootMargin "480px 0px 480px 0px"` (starts loading well before visible).

### 1.3 Custom scrollbar + scroll-to-top ring

Desktop gets a draggable scrollbar thumb; mobile gets a scroll-to-top button whose ring fills with scroll progress.

```js
const CIRCUMFERENCE = 2 * Math.PI * 12;      // r = 12
// ring fill: strokeDasharray = C, strokeDashoffset = C * (1 - progress)

// drag: record where the pointer and the scroll were when the drag began
onMouseDown = (e) => {
  drag.current = { startY: e.clientY, startScrollTop: scrollEnv.getScrollTopPx() };
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onMove, { signal });
  document.addEventListener("mouseup",   onUp,   { signal });
};
```

The button scales `scale-50 → scale-100` over `0.66s` with the site's `ease-66` curve `cubic-bezier(0.66, 0, 0.01, 1)`; the ring's stroke goes from width 8 / opacity 1 (resting) to width 4 / opacity 0.2 (active).

---

## 2. Page load & route transitions

### 2.1 Entry loader

Only the homepage (`/`) has an entry loader. The progress bar is split in half: fonts are the first 50%, WebGL assets are the second 50%.

```js
const CONFIG = {
  "/": { entryLoading: { enabled: true }, routeLoading: { enabled: true } },
  // every other route: both disabled
};

// progress bar value
progress = entryLoading.enabled
  ? clamp(50 * !!fontsReady + heavyLoadProgress / 100 * 50, 0, 100)
  : heavyLoadProgress;

// the mask lifts only when BOTH are ready
if (!entryLoading.enabled || (readyToLoadHeavy && fontsReady)) reveal();
```

`heavyLoadProgress` counts `["hello", "h_star", "cnt"]` (three models) plus every work-card texture. **There is no timeout** — if any asset fails, the mask never lifts.

### 2.2 Fonts-ready gate

All page content is wrapped in a div that is `invisible` until the three fonts load via the `FontFace` API. This is why the site never shows a fallback font flash.

```js
function FontGate({ children }) {
  const { fontsReady } = useShellMedia();
  return <div className={fontsReady ? "" : "invisible pointer-events-none select-none"}
              aria-hidden={!fontsReady}>{children}</div>;
}
```

### 2.3 Route transition — dot-matrix curtain

Navigations are covered by a full-screen shader: a grid of circles whose radius tracks transition opacity, so the page "dissolves" into dots and back. Colour is theme-aware.

```js
// props: overlayColors ["#0F1111", "#FBFAF4"], overlayPixelSize 4, overlayRadiusScale 0.9
uColor = resolvedTheme === "dark" ? "#0F1111" : "#FBFAF4";
```

```glsl
uniform vec3  uColor;
uniform float uOpacity;        // transition progress, driven per frame
uniform float uPixelSize;      // 4 px cells
uniform float uRadiusScale;    // 0.9
uniform vec2  uResolution;

void main() {
  float a = clamp(uOpacity, 0.0, 1.0);
  vec2 cell = vUv / (uPixelSize / uResolution);
  vec2 cellUV = fract(cell);
  float radius = uRadiusScale * a;                       // opacity IS the dot radius
  float d = distance(cellUV, vec2(0.5));
  float aa = fwidth(d) * 1.5;
  float circle = 1.0 - smoothstep(radius - aa, radius + aa, d);
  gl_FragColor = vec4(uColor, circle);
}
```

The transition sequence: `startNavigation` → set `readyToLoadHeavy=false, progress=0` → cover → `router.push` → wait for the destination's assets → reveal.

---

## 3. Text — scramble reveal

Every text on the site (hero headline, nav, footer, project metadata, footer availability line) enters through the same component. Characters flip through random glyphs, tinted in the accent green, then settle left-to-right.

**Tuning:** `letterDelayMs 80` (stagger between characters), scramble window per character `4 × 80 = 320 ms`, colour changes halfway through. `startDelayMs` offsets each line (hero uses 300/500/700). `reverse` runs right-to-left (footer "Create" / "Extraordinary"). One shared `40 ms` ticker drives every instance on the page.

```js
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*+-=?/<>[]{}";
const COLORS  = { light: ["#c0fe04", "#607F02"], dark: ["#c0fe04", "#DFFF81"] };
const rand = () => CHARSET[Math.floor(Math.random() * CHARSET.length)];

// one interval shared by every ScrambleText on the page
const listeners = new Set(); let timer = null;
const subscribe = (fn) => {
  listeners.add(fn);
  timer ??= setInterval(() => { const t = performance.now(); listeners.forEach((l) => l(t)); }, 40);
  return () => { listeners.delete(fn); if (!listeners.size) { clearInterval(timer); timer = null; } };
};

function ScrambleText({ text, startDelayMs = 0, letterDelayMs = 80, reverse = false, scrambleColors = true }) {
  const { hasEnteredViewport, ref } = useHasEnteredViewport({ threshold: 0.1 });
  const { allowScrambleLines } = useRouteTransitionController();   // held until the entry mask lifts
  const [now, setNow] = useState(0);
  const start = useRef(0);

  const half   = 2 * letterDelayMs;      // 160 ms – colour switches here
  const window = 2 * half;               // 320 ms – how long each char scrambles
  const total  = startDelayMs + (text.length - 1) * letterDelayMs + window;

  useEffect(() => {
    if (!hasEnteredViewport || !allowScrambleLines) return;
    start.current = performance.now();
    return subscribe((t) => { setNow(t); if (t - start.current >= total) settle(); });
  }, [hasEnteredViewport, allowScrambleLines]);

  const elapsed = Math.max(0, now - (start.current + startDelayMs));
  let idx = 0;
  return text.split("").map((ch) => {
    const order = reverse ? text.length - 1 - idx : idx;  idx++;
    if (ch === " ") return <span> </span>;
    const begin = order * letterDelayMs, end = begin + window;
    if (elapsed < begin) return <span style={{ opacity: 0 }}>{ch}</span>;      // not started
    if (elapsed < end) {                                                       // scrambling
      const phase = Math.min(1, Math.floor((elapsed - begin) / half));         // 0 then 1
      return <span style={{ color: scrambleColors ? COLORS[theme][phase] : undefined }}>{rand()}</span>;
    }
    return <span>{ch}</span>;                                                  // settled
  });
}
```

---

## 4. Signature draw-on

The hero signature is an SVG whose paths draw themselves using the stroke-dash trick. Each path's duration is proportional to its length; delays chain so strokes draw one after another like a pen.

**Tuning:** speed `720 units/s`, gap between strokes `30 ms`, initial delay `0.5 s`, easing `cubic-bezier(0.65, 0, 0.35, 1)`. Triggers on viewport entry, replays on re-entry.

```js
// measure each path once, hand the numbers to CSS
useLayoutEffect(() => {
  let delay = 0.5;
  for (const path of pathRefs.current) {
    const len = path.getTotalLength();
    const dur = len / 720;
    path.style.setProperty("--path-len",   String(len));
    path.style.setProperty("--path-dur",   `${dur}s`);
    path.style.setProperty("--path-delay", `${delay}s`);
    path.style.strokeDasharray  = `${len}`;
    path.style.strokeDashoffset = `${len}`;      // fully hidden
    delay += dur + 0.03;
  }
}, []);
```

```css
.svg-sign__path { opacity: 0; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.svg-sign.is-drawing .svg-sign__path {
  animation:
    svg-sign-show 0s linear var(--path-delay) forwards,
    svg-sign-draw var(--path-dur) cubic-bezier(0.65, 0, 0.35, 1) var(--path-delay) forwards;
}
@keyframes svg-sign-draw { to { stroke-dashoffset: 0; } }
@keyframes svg-sign-show { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .svg-sign.is-drawing .svg-sign__path { animation: none; stroke-dashoffset: 0; opacity: 1; }
}
```

The path data is centerline-traced from a handwritten original (18 strokes, `stroke-width 2.81`, viewBox `0 0 320 154`).

---

## 5. Work cards — the WebGL image layer

The project card grid is plain HTML, but the images are **not** `<img>` elements. Each card is an empty placeholder `div`; a full-screen WebGL canvas behind the page draws every card's image onto the placeholder's screen rectangle via one `ShaderMaterial` per card. This is what makes the effects below possible.

```js
// per frame: read the placeholder's DOM rect and hand it to the shader as normalized screen coords
const rect = placeholder.getBoundingClientRect();
uRect.set(rect.left / W, 1 - (rect.top + rect.height) / H, rect.width / W, rect.height / H);
```

All of the following are uniforms on that per-card material.

### 5.1 Entrance wipe **[added]**

Cards wipe in horizontally as they scroll into view. Left column wipes left→right, middle right→left, right left→right; delay cascades 0 / 80 / 160 ms across a row so a row never resolves in unison.

**Tuning:** duration `0.6 s`, easing `easeInOutCubic`, feather `0.15`. Rewinds when the card leaves the viewport so it replays.

```js
// texture-load: start hidden
uRevealProgress = 0; uRevealSoftness = 0.15; uRevealDirection = column % 2 === 0 ? 1 : -1;

// per frame, once the card rect is on screen
elapsed += dt;
const t = Math.min(1, Math.max(0, elapsed - revealDelay) / 0.6);
let v = easeInOutCubic(t);
if (v > 0.999) v = 1;          // shader drops the mask entirely at >= 0.999
uRevealProgress = v;
```

```glsl
float coord = uRevealDirection < 0.0 ? 1.0 - localUv.x : localUv.x;
float mask  = uRevealSoftness <= 0.0
  ? step(coord, uRevealProgress)
  : 1.0 - smoothstep(uRevealProgress - uRevealSoftness, uRevealProgress + uRevealSoftness, coord);
alpha *= mask;
```

### 5.2 Polarity fade (invert → normal on scroll-in)

When a card enters the viewport it starts colour-inverted and resolves to normal over `0.8 s`. This is the original design's card entrance.

```js
// per frame
if (offscreen)                  polarity = 0;                 // reset, replays next time
else if (prefersReducedMotion)  polarity = 1;
else { t = Math.min(1, t + dt / 0.8); polarity = easeInOutCubic(t); }
uPolarityPositive = polarity;
```

```glsl
vec3 applyPolarity(vec3 rgb) { return mix(1.0 - rgb, rgb, clamp(uPolarityPositive, 0.0, 1.0)); }
```

### 5.3 Scroll-velocity curl

Fast scrolling pinches the cards horizontally — the faster you scroll, the more they warp, snapping back when you stop. The smoothing is asymmetric: it reacts quickly (`25 ms`) and relaxes slowly (`175 ms`).

**Tuning:** velocity normalised at `800 px/s`, max strength `0.06`.

```js
function useScrollCurl() {
  const lastY = useRef(null), smoothed = useRef(0);
  return (dt) => {
    dt = Math.max(1 / 240, Math.min(dt, 0.1));
    const y = scrollEnv.getScrollTopPx();
    const velocity = lastY.current == null ? 0 : Math.abs(y - lastY.current) / dt;
    lastY.current = y;
    const target = clamp(velocity / 800, 0, 1);
    const tau = target > smoothed.current ? 0.025 : 0.175;      // attack fast, release slow
    const k = 1 - Math.exp(-dt / tau);
    smoothed.current += (target - smoothed.current) * k;
    return 0.06 * smoothed.current;
  };
}
```

```glsl
vec2 applyCurl(vec2 screenUv) {
  float centered = 2.0 * screenUv.y - 1.0;
  float profile  = 1.0 - sqrt(max(0.0, 1.0 - centered * centered));   // 0 at centre, 1 at edges
  float scale    = 1.0 - profile * uCurlStrength;
  return vec2((screenUv.x - 0.5) * scale + 0.5, screenUv.y);           // pinch x toward centre
}
```

### 5.4 Hover — growing-squares halftone

On hover the card crossfades to its second image, but not as a fade: a grid of squares blooms outward from the card's centre, each square growing until the cells merge. Also fires on keyboard focus.

**Tuning:** ramp `0.42 s`, cosine ease, cell size `18 screen px`, transition band widened `×18` so the front is soft (the source comment: *"lengthen the transition ring width so the hover spread is softer, without a short hard edge"*).

```js
// per frame
const step = Math.min(dt, 0.1) / 0.42;
progress = hovering ? Math.min(1, progress + step) : Math.max(0, progress - step);
uHoverRevealProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);       // cosine ease in-out
```

```glsl
float hoverDotCoverage(vec2 screenUv) {
  float p = clamp(uHoverRevealProgress, 0.0, 1.0);
  if (p <= 0.0) return 0.0;

  vec2  cellSize   = vec2(uDotPixelSize) / uViewportPx;        // 18 px cells, in screen UV
  float rectAspect = (uRect.z * uViewportPx.x) / (uRect.w * uViewportPx.y);
  vec2  centered   = ((screenUv - uRect.xy) / uRect.zw) * 2.0 - 1.0;
  centered.x *= rectAspect;
  float dist       = length(centered);
  float maxRadius  = sqrt(1.0 + rectAspect * rectAspect);

  float band   = max(length(cellSize) * 18.0, 0.08);             // soft front
  float radius = p * (maxRadius + band);
  float grow   = smoothstep(0.0, 1.0, clamp((radius - dist) / band, 0.0, 1.0));

  vec2  cellUv = fract(screenUv / cellSize);
  vec2  fromC  = abs(cellUv - 0.5);
  float sqDist = max(fromC.x, fromC.y);                          // Chebyshev = squares
  float extent = mix(0.0, 0.5, grow);                            // 0.5 fills the cell
  float aa     = max(fwidth(sqDist), 0.0001) * 1.5;
  if (extent <= aa) return 0.0;
  if (grow >= 0.999) return 1.0;
  return 1.0 - smoothstep(extent - aa, extent + aa, sqDist);
}

vec4 sampleSourceRgba(vec2 uv, float cov) {
  vec4 base = texture2D(map, uv);
  if (cov < 0.001) return base;                                  // skip 2nd fetch when idle
  return mix(base, texture2D(mapHover, uv), cov);
}
```

### 5.5 Per-project hover modes + accent colour **[branch]**

Extends 5.4 so each project has its own shape and colour. Cards sit near-greyscale and colourise on hover; the reveal front glows in the project's accent.

| Project | Mode | Accent |
|---|---|---|
| Field-Sales CRM | blinds | `#009dff` |
| DukaanAI | cursor bloom | `#c0fe04` |
| AITremarkIQ | round halftone | `#64c3ff` |
| EVATE | sweep L→R | `#01ffbe` |
| IRAF | ripple | `#8e9dc4` |
| Student Manager | mosaic | `#02fe37` |
| Applied ML Pipelines | RGB split | `#4afe03` |

```js
// WORK_ITEMS entry
{ name: "DukaanAI", hoverEffect: 3, accent: "#c0fe04", ... }
// uniforms: uHoverMode, uAccent (THREE.Color), uPointer (from PointerProvider), uAccentStrength 0.55, uDesatBase 0.9
```

```glsl
int gMode = int(uHoverMode + 0.5);
// front coordinate per mode
if (gMode == 2)                  coord = localUv.x;                                   // sweep
else if (gMode == 3 || gMode == 4) coord = length(centered - pointerCentered);        // bloom / torch from cursor
else if (gMode == 7)             coord = abs(fract(localUv.y * 7.0) - 0.5) * 2.0;     // blinds
else                             coord = length(centered);                            // radial
// cell shape: mode 1 uses length() for round dots, others Chebyshev squares
// sampling: mode 5 ripple displaces uv by sin(d*34 - hp*9); mode 6 mosaic quantises uv 16→260 cells; mode 8 offsets R/B channels
// colour
float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
col = mix(vec3(lum), col, mix(1.0 - uDesatBase, 1.0, uHoverRevealProgress));       // greyscale → colour
col += uAccent * frontEdge * uAccentStrength;                                       // glowing front
```

---

## 6. 3D scene

A single react-three-fiber `<Canvas>` fixed behind the page at `z-index -1`, camera at `z = 22`, DPR `[1, 2]`.

### 6.1 Glass refraction with chromatic dispersion — the "hello" model

The hero model is rendered as glass: the scene behind it is captured to a texture and refracted through the mesh with a **different index of refraction per wavelength**, so edges split into rainbow fringes. Six IORs (R/Y/G/C/B/P) sampled in a loop with a small noise slide to avoid banding.

**Tuning:** `uRefractPower 0.24`, `uChromaticAberration 0.24`, `uFresnelPower 6`, `uShininess 40`, IORs `1.15 / 1.16 / 1.18 / 1.22 / 1.22 / 1.22`. Tint is a two-colour gradient along the model's local Y, theme-aware (`tingColor: [lightA, lightB, darkA, darkB]`).

```glsl
vec3 color = vec3(0.0);
float noise = random(uv) * 0.025;
vec3 rR = refract(eyeDir, normal, 1.0 / uIorR);
vec3 rY = refract(eyeDir, normal, 1.0 / uIorY);
vec3 rG = refract(eyeDir, normal, 1.0 / uIorG);
vec3 rC = refract(eyeDir, normal, 1.0 / uIorC);
vec3 rB = refract(eyeDir, normal, 1.0 / uIorB);
vec3 rP = refract(eyeDir, normal, 1.0 / uIorP);
for (int i = 0; i < uLoop; i++) {
  float slide = float(i) / float(uLoop) * 0.1 + noise;
  float oR = (uRefractPower + slide * 1.0) * uChromaticAberration;
  float oG = (uRefractPower + slide * 2.0) * uChromaticAberration;
  float oB = (uRefractPower + slide * 3.0) * uChromaticAberration;
  color.r += texture2D(uTexture, uv + rR.xy * oR).r;   // + Y/C/P blends
  color.g += texture2D(uTexture, uv + rG.xy * oG).g;
  color.b += texture2D(uTexture, uv + rB.xy * oB).b;
}
color /= float(uLoop);
// then fresnel rim, specular, tint gradient by modelLocalY
```

### 6.2 Scroll-synced model rotation + float

Each model has three orientations — `beforeRotation` (as you arrive), `rotation` (rest), `afterRotation` (as you leave) — and interpolates between them from scroll position, damped so it never snaps. Its Y position tracks its section's centre at `scrollSyncFactor` (0.72 = slight parallax against the page).

```js
// per frame
const { entry, after } = scrollProgressForSection();          // 0..1 each
let rx = lerp(before.x, rest.x, entry), ry = lerp(before.y, rest.y, entry), rz = ...;
if (afterRotation) { rx = lerp(rx, after.x, after); ry = lerp(ry, after.y, after); rz = ...; }
group.rotation.x = MathUtils.damp(group.rotation.x, rx, 6, dt);   // λ = 6 → smooth follow
group.rotation.y = MathUtils.damp(group.rotation.y, ry, 6, dt);
group.rotation.z = MathUtils.damp(group.rotation.z, rz, 6, dt);

// vertical position follows the section, plus an idle float on desktop
const float = enabled ? 0.18 * Math.sin(1.2 * t) + 0.06 * Math.sin(0.6 * t) : 0;
group.position.y = scrollSyncedWorldY(sectionCentreDocY, scrollTop, scrollSyncFactor) + offsetY + float;
```

Instances: `hello.glb` (banner, `[0,240,0] → [0,4,0] → [0,90,0]`, scale 22/19 mobile), `cursor.glb` (banner, spins `0 → 720°` on scroll, tilted 45°, blue tint), `cnt.glb` (footer, flips from `[-180,0,0]`).

### 6.3 Camera parallax

The camera drifts toward the pointer and looks slightly away from it, giving the whole scene depth. Lags behind the pointer; lags more when the pointer leaves the window. Disabled on mobile. On entry the camera also eases in from 8 units further back.

**Tuning:** `strength 1.4`, `lag 0.18`, `rotate 0.12`, `leaveLag 0.05`, entry ease `1.2 s customCubic`. Vertical FOV derived from a horizontal FOV of `60°` (desktop) / `38°` (mobile).

```js
useFrame((_, dt) => {
  // entry dolly-in
  entry = ready ? Math.min(entry + dt / 1.2, 1) : 0;
  camera.position.z = lerp(baseZ + 8, baseZ, customCubic(entry));

  if (!parallaxEnabled || isMobile) return;
  const px = (0.5 - pointer.x) * 2, py = (0.5 - pointer.y) * 2;      // -1..1, centred
  target.set(px * strength, py * strength * 0.6, 0);
  lookTarget.set(-target.x * rotate, -target.y * rotate, 0);
  const lag = pointerInside ? parallaxLag : leaveParallaxLag;
  offset.lerp(target, lag);
  look.lerp(lookTarget, lag);
  camera.position.x = base.x + offset.x;
  camera.position.y = base.y + offset.y;
  camera.lookAt(look);
});
```

### 6.4 Sticker particle system

Twelve sticker textures rain through the hero as instanced quads with wind and spin. Bursts spawn on scroll and on click; textures are packed into one atlas and addressed with a per-instance `uvRect`.

**Tuning (`s5`):** `spawnWidth 32`, `clickSpawnWidth 24`, `spawnHeight 24`, `positionY 24`, `fallDistance 48`, `zDepth 4`, `zOffset -6`, `windStrength 1.8`, `windFrequency 0.3`, `scale 1.4`, `rotationSpeed 0.8`, `fallSpeed 1.8`, pool capped at `384` live particles.

```js
function spawn(p, cfg, mode = "scroll") {
  const w = mode === "click" ? cfg.clickSpawnWidth : cfg.spawnWidth;
  const h = mode === "click" ? cfg.clickSpawnHeight : cfg.spawnHeight;
  const jitter = Math.min(0.5 * h, 8);
  p.position.set(
    p.originX + (Math.random() - 0.5) * w,
    p.originY + (mode === "click" ? cfg.positionY + (2 * Math.random() - 1) * jitter : cfg.positionY + Math.random() * h),
    p.originZ + (Math.random() - 0.5) * cfg.zDepth + cfg.zOffset);
  p.fallSpeed     = cfg.fallSpeed * (0.6 + 0.8 * Math.random());
  p.rotation      = Math.random() * Math.PI * 2;
  p.rotationSpeed = (Math.random() - 0.5) * cfg.rotationSpeed * 2;
  p.scale         = mode === "click" ? cfg.clickScale : cfg.scale;
  p.windPhase     = Math.random() * Math.PI * 2;
  p.windAmplitude = 0.3 + Math.random() * cfg.windStrength;
}
```

```glsl
// vertex: place the instance, pick its sticker out of the atlas
attribute vec4 uvRect;  varying vec2 vAtlasUv;
void main() {
  vAtlasUv = uvRect.xy + uv * uvRect.zw;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
// fragment
vec4 c = texture2D(map, vAtlasUv);
if (c.a < 0.01) discard;
gl_FragColor = c;
```

### 6.5 Hyper-space — scale + spin

A section effect: the cursor model scales up from `restScale 0.1` toward a peak sized to its target element (`autoPeakPadding 1.64`) while spinning `scaleSpinDegrees` (180° here), striped in two accent colours. Mounted only while within `480 px` of the viewport.

```js
// scale target from the DOM element it's attached to, smoothed with λ = 32
const peak = Math.max(rect.width, rect.height) / worldPerPx * autoPeakPadding;
scale.current = MathUtils.damp(scale.current, visible ? peak : restScale, scaleSmoothing, dt);
mesh.rotation.y = MathUtils.degToRad(scaleSpinDegrees) * (scale.current - restScale) / (peak - restScale);
```

### 6.6 Lens flare post-process

A custom `LensFlarePass` runs at half resolution every other frame (`flareDownsample 0.5`, `flareStride 2`), extracting bright pixels above a threshold and streaking them into star rays, then compositing back. Parameters: `starRays`, `intensity`, `threshold`, `streakScale`, `hotspotPower`, `gate`, `tailColor`.

```js
render(renderer, input) {
  if (this.frame % this.stride === 0) {              // flare buffer only every Nth frame
    this.flareMaterial.uniforms.tDiffuse.value = input.texture;
    renderer.setRenderTarget(this.flareTarget); renderer.render(this.scene, this.camera);
  }
  this.frame++;
  this.compositeMaterial.uniforms.tBase.value  = input.texture;
  this.compositeMaterial.uniforms.tFlare.value = this.flareTarget.texture;
  // fullscreen composite
}
```

### 6.7 Global pointer

Everything cursor-aware reads one shared, y-up normalised pointer maintained by `PointerProvider` — no effect attaches its own listeners.

```js
const uv = new Vector2(0.5, 0.5);               // mutable, read per frame
window.addEventListener("pointermove", (e) => {
  uv.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight);   // matches vUv and uRect
  inside = true;
}, { capture: true, passive: true });
["blur"].forEach(...);  document.addEventListener("mouseleave", () => { uv.set(0.5, 0.5); inside = false; });
```

---

## 7. Micro-interactions (CSS / DOM)

### 7.1 Nav & link hover — dotted outline

Interactive text gets a `2px dotted` border that fades in on hover via a `::before` pseudo-element, so the layout never shifts. Uses `active:` for touch.

```html
class="relative before:content-[''] before:absolute before:inset-0
       before:border-2 before:border-dotted before:border-transparent
       before:transition-colors before:duration-200
       lg:hover:before:border-l1 active:before:border-l1 p-2 uppercase"
```

### 7.2 Sticky statement — "Innovate with purpose"

A `height: 8px` section whose child is `sticky top-0` and full-height, so the three words pin to the screen while the page scrolls past, then scramble-reveal (`groupDelayMs 100 × index`) when 35% visible, resetting when scrolled away.

### 7.3 Inline link underline

Project-page links animate only their underline colour: `decoration-(--label-3)` → `hover:decoration-(--label-1)` over `150 ms`, `underline-offset-[0.08em]`.

### 7.4 Theme switch

`ThemeModeProvider` writes `light`/`dark` onto `<html>`, persists to `localStorage("theme")`, follows `prefers-color-scheme` in `system` mode. Every shader reads `resolvedTheme` to swap tints (`overlayColors`, `tingColor[0..1]` vs `[2..3]`, scramble colours).

### 7.5 Sound

`bgm.mp3` loops at `volume 0.35`. Toggle via the nav button or the **S** key; state persists to `localStorage("sound")`. Playback needs a user gesture (browser autoplay policy), so the first `pointerdown` also attempts `play()`. The file itself is fetched on first interaction rather than on load **[added]**.

---

## 8. Easing curves used

| Name | Definition | Used by |
|---|---|---|
| `easeInOutCubic` | `t<.5 ? 4t³ : 1-(-2t+2)³/2` | polarity fade, entrance wipe, hover |
| `customCubic` | project-specific cubic | camera entry dolly |
| cosine | `0.5 - 0.5·cos(πt)` | hover progress |
| `ease-66` | `cubic-bezier(0.66, 0, 0.01, 1)` | scroll-to-top button |
| signature | `cubic-bezier(0.65, 0, 0.35, 1)` | stroke draw |
| `MathUtils.damp` | exponential, `λ` = 6 (rotation) / 32 (hyper-space scale) | model orientation, scale |
| asymmetric exp | `τ` = 25 ms attack / 175 ms release | scroll curl |

All motion respects `prefers-reduced-motion: reduce` — the signature, polarity fade and entrance wipe jump straight to their end state.
