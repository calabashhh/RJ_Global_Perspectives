# Restorative Justice: Global Perspectives

A GitHub Pages-ready, scroll-driven portfolio for Margaret Broz (International Institute for Restorative Practices, RP 623, November 2026). This website was created from the supplied **RP 623 Learning Portfolio(1).docx** and the **NE1_LR_LC_SR_W.tif** map. No build process, API key, external framework, or paid hosting is needed.

## Site files

Upload **everything** in this folder to the root of the GitHub repository (not inside a second containing folder):

```
index.html                  — page structure
styles.css                  — appearance and responsive layout
script.js                   — scrolling, camera movement, navigation
content.js                  — chapter text, map coordinates, references
assets/
  world-map.webp            — supplied world map, optimized for web
  world-map-preview.webp    — small overview image
  map-wrap-east.webp        — actual texture from eastern edge of source map
  map-wrap-west.webp        — actual texture from western edge of source map
README.md                   — this file
tests/
  verify-camera.cjs         — optional dependency-free camera behavior checks
```

The original 23 MB TIFF is intentionally not in the hosted site. `world-map.webp` is a 5,346 × 2,673 version of the same map (~2 MB), not an AI-generated replacement. The two wrap strips repeat the source map correctly at the international date line so New Zealand does not reveal a flat-color region at the right edge.

## Publish to GitHub Pages

1. Create a public repository in the GitHub account that will host the website.
2. Upload the **contents** of this package to the repository root. Keep the `assets/` directory intact.
3. Under **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, and save.
4. Open the published URL. For a project repository, it is usually `https://USERNAME.github.io/REPOSITORY/`. If the hosting account has a Pages custom domain, the project may instead appear under that domain.
5. When replacing an older release, replace all site files and use **Ctrl+Shift+R** (hard reload). The HTML references `script.js?v=6` and `styles.css?v=6`, which helps refresh browsers that have cached prior versions.

You can also open `index.html` locally, or serve the folder via `python -m http.server 8000` and visit `http://localhost:8000`.

## What the scrolling animation should do

For each of the 12 chapters, the map should:

1. Start at 1× (the full world).
2. **Gradually** zoom toward the chapter's programmed country/city as the visitor scrolls. This is a continuous progression, not an immediate change from 1× to 10×.
3. Remain at its maximum zoom while the quotation and reflection panels appear.
4. Gradually zoom back out to 1× before entering the next chapter.

Moving the page upward reverses the movement. The zoom is about 9–11× depending on the chapter, although geographic detail looks softer at that magnification due to the image's resolution.

### Version 6: correction to the zoom

Version 5 accidentally contained **two sources of snapping**:

- If a browser reported an operating-system preference for reduced motion, the map jumped directly between world and local views at fixed scroll thresholds.
- A CSS `210ms` camera transition restarted with every scroll update, producing lag and a final catch-up jump.

Version 6 removes both behaviors. Camera scale and position now have continuously changing scroll targets. A short, frame-rate-independent JavaScript interpolation smooths discrete wheel movements rather than chasing them with CSS transitions. The requested map zoom remains scroll-controlled even with a device reduced-motion setting.

**Diagnostic:** Add `?debugZoom=1` to the published website address, e.g. `https://example.github.io/portfolio/?debugZoom=1`. A small readout in the lower-right should move gradually from `1.00×` to about `9–11×`, hold during the content, and return gradually to `1.00×`. This provides a way to distinguish an animation problem from an old cached deployment.

**Static map option:** Visitors who prefer no geographic camera movement can append `?staticMap=1` to the URL. This is opt-in.

## Editing the places and content

In `content.js` each chapter contains `location`, `title`, `quote`, `attribution`, `bullets`, `lon`, `lat`, and `zoom`. The geographic locations are **already programmed**. There are no blank points to identify manually.

| Chapter | Destination | Geographic anchor |
|---|---|---|
| 1 | Chicago | Chicago, Illinois |
| 2 | Costa Rica | San José |
| 3 | Brazil | Porto Alegre |
| 4 | Netherlands | Amsterdam |
| 5 | Austria | Vienna |
| 6 | Australia | Sydney |
| 7 | South Africa | Cape Town |
| 8 | Belgium | Leuven |
| 9 | New Zealand | Whanganui |
| 10 | England | London |
| 11 | Hong Kong | Hong Kong |
| 12 | Chicago (conclusion) | Chicago, Illinois |

The cities in country-level chapters are representative storytelling anchors, not claims that all research discussed in that chapter happened in that city. The supplied map is a 2:1 **equirectangular** projection. If it is replaced with a map in a different projection, `lon`/`lat` must be converted according to the new projection rather than using the existing image formula.

To customize the movement, `styles.css` controls each chapter's scroll length (`.chapter { height: 500vh; }`) and `script.js` sets the enter/exit phases in `frame()` and the camera interpolation in `animateCamera()`.

## Automated checks

If Node.js is installed, run this from the website folder:

```bash
node tests/verify-camera.cjs
```

This tests the actual website JavaScript against simulated scrolling at intermediate chapter positions. It verifies that zoom increases gradually, holds, decreases gradually, and correctly centers the chosen geographic point; it covers all 12 chapters in both motion-preference modes, plus mobile checks. It **does not replace** reviewing the website in a real browser after deployment.

## Source and license notes

The supplied `NE1_LR_LC_SR_W.tif` is a Natural Earth physical world map; Natural Earth raster and vector datasets are public-domain. The footer credits Natural Earth. For details see <https://www.naturalearthdata.com/about/terms-of-use/>.

The Word document also includes a separate Strebe CC BY-SA 4.0 credit for an illustrative map on the instructions page. That is distinct from the Natural Earth TIFF used by this site. The document's 27 references and scholarly quote attributions have been retained in the website.
