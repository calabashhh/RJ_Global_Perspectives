# Restorative Justice: Global Perspectives

A scroll-driven learning portfolio for **Margaret Broz** — **International Institute for Restorative Practices, RP 623** — November 2026.

This is a **self-contained static website**. It uses only HTML, CSS, JavaScript, and one optimized image from the supplied Natural Earth map. There are **no JavaScript frameworks, API keys, third-party assets, build tools, or ongoing hosting fees**. All chapter text and references were transcribed from the supplied *RP 623 Learning Portfolio(1).docx*.

## Files to upload to GitHub

Keep **all files and folders in this directory together**. The structure should look like this at the **root of the GitHub repository**:

```
index.html
styles.css
script.js
content.js
assets/
  world-map.webp
  world-map-preview.webp
README.md
```

- **index.html** — page structure, fixed site header, introduction, and references section
- **styles.css** — colors, typography, layout, transitions, and mobile layouts
- **script.js** — camera movement, scroll positions, chapter navigation, and appearance of each text panel
- **content.js** — all 12 chapters, original quotes, bullet-point reflections, bibliography entries, and map targets
- **assets/world-map.webp** — optimized 5,346 × 2,673 copy of the supplied `NE1_LR_LC_SR_W.tif` (same visual content)
- **assets/world-map-preview.webp** — lightweight preview of the same supplied image, for later optimization if needed

**Note:** The original 23 MB TIFF is intentionally **not** required in the site repository. The 2 MB WebP is the actual image the website displays. This keeps GitHub Pages downloads reasonably small without changing the source map.

## Test it locally

Double-click **index.html** or open it in a modern web browser. Everything should work offline. If you prefer a local server, run this command in the website folder:

```bash
python -m http.server 8000
```

Then browse to `http://localhost:8000`.

Scroll naturally through the introduction and chapters. The **Chapters** menu in the header allows jumping directly to any section and to References. On phones, longer reflections move through their text automatically as the page scrolls. The header remains visible throughout.

## Publish with GitHub Pages

These steps can be done using **any GitHub account**; this site is not tied to the creator's personal account or GitHub username.

1. Create a new GitHub repository in the account that will own the website. A public repository works with GitHub Pages on free personal accounts.
2. Upload the **contents** of this folder into the repository root, including the `assets/` folder. Ensure `index.html` is at the root, **not inside another nested directory**.
3. Commit the files to the default branch, normally `main`.
4. Go to **Settings → Pages** in that repository.
5. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then Save.
6. GitHub will display the public website address under Pages. A project repository generally uses the format `https://OWNER.github.io/REPOSITORY/`.

All paths in this site are relative; publishing under a subdirectory is supported. No custom domain is required.

## Edit chapters, quotes, citations, or zoom destinations

Open **content.js**. Each chapter has editable fields:

```js
{
  "location": "Belgium",
  "title": "Restorative Cities",
  "anchor": "Leuven",
  "region": "Belgium",
  "lon": 4.7005,
  "lat": 50.8798,
  "zoom": 10.0,
  "quote": "...",
  "attribution": "...",
  "bullets": ["...", "..."]
}
```

- `location`: uppercase name shown in the viewport
- `title`: centered chapter title
- `anchor`: the representative geographic focus used to choose the map coordinates; it is not displayed in the place-name label
- `lon` and `lat`: geographic longitude and latitude, in decimal degrees
- `zoom`: maximum magnification for that chapter. Smaller values show more surrounding geography. The current chapters mostly use **9–11×** to create the pronounced destination zoom; the image can look soft at this scale, so lower the value if you prefer a wider, sharper regional view.
- `quote` and `attribution`: large quote panel. The final conclusion deliberately has `quote: null`.
- `bullets`: points in the commentary panel. The conclusion instead shows the paragraph without bullets.

**Important:** The source TIFF is a **2:1, equirectangular full-world image**, with longitude −180° to +180° and latitude +90° to −90°. The script uses that relationship to place zoom centers directly. If you replace it with a map in a **different projection**, you must also change the coordinate-to-image conversion in `script.js`. The TIFF itself did not contain usable embedded GeoTIFF coordinate metadata, so the imagery was visually checked against the geographic positions.

### Representative location targets used

| Chapter | Location in document | Map focus used |
|---:|---|---|
| 01 | Chicago, IL, USA | Chicago, Illinois |
| 02 | Costa Rica | San José |
| 03 | Brazil | Porto Alegre (referenced in portfolio bibliography) |
| 04 | Netherlands | Amsterdam |
| 05 | Austria | Vienna |
| 06 | Australia | Sydney |
| 07 | South Africa | Cape Town |
| 08 | Belgium | Leuven (referenced in portfolio bibliography) |
| 09 | New Zealand | Whanganui (named in the portfolio) |
| 10 | England | London |
| 11 | Hong Kong | Hong Kong |
| 12 | Chicago | Chicago, Illinois |

For country-only sections, the city is a **geographic storytelling anchor**, not a claim that all cited research happened there. Change these choices freely in `content.js`.

## Change pacing or visual style

- In **styles.css**, change the CSS custom properties at the beginning to update earth-tone colors. `--ink`, `--deep`, `--terracotta`, and `--paper` have the biggest effect.
- The length of each chapter is controlled by `.chapter { height: 370vh; }` (and mobile/media variants). Larger values make the same sequence unfold over a longer scroll.
- In **script.js**, `styleChapter` controls quote enlargement, motion to the left, and reflection appearance. `setCamera` controls world-map zoom and the chosen focus point.
- A **reduced-motion** system setting keeps the map stationary while presenting the same content.

## Map attribution and source note

The uploaded `NE1_LR_LC_SR_W.tif` is a Natural Earth physical world map. Natural Earth raster and vector datasets are published in the **public domain**. The site adds the optional acknowledgement **“Made with Natural Earth.”**

- Natural Earth: https://www.naturalearthdata.com/
- Terms of Use: https://www.naturalearthdata.com/about/terms-of-use/

The Word document also contains a separate **Strebe / CC BY-SA 4.0** image reference, apparently associated with the *illustrative map shown on its final instructions page*. That text has been retained in the document's 27-item bibliography, but it **does not describe the Natural Earth TIFF used as the actual website background**. Review whether that original reference is still needed before submitting the portfolio.

The website content itself is drawn directly from the supplied academic portfolio; third-party source quotations remain attributed as in that document.

## Practical limitations

The supplied map is **5,346 × 2,673 pixels**, which is ample for whole-world to country/large-region zooms. At very deep city-level magnification, terrain detail will appear soft, because the image does not include street-scale data. The image could later be replaced by a higher-resolution **equirectangular** Natural Earth raster without rewriting the storytelling experience.

### Quick check before publication

- Confirm chapter wording, direct quotes, and references against the original document.
- Decide whether the representative city choices are appropriate for each country-level chapter.
- Scroll through the website on desktop and mobile once after publishing.
- Verify the owner account’s GitHub Pages URL loads the map image and that the menu links work.

## Zoom positions and how to edit them

The city and representative country focal points are **already programmed**. In
`content.js`, each chapter contains its `lon` (longitude), `lat` (latitude), and
`zoom` (magnification). The site maps them to the supplied equirectangular TIFF,
converted to `assets/world-map.webp` for efficient web display. You do **not**
need to locate the places by clicking on the image.

The previous revision strengthened the zoom to approximately 9–11×,
with the original world view returning between chapters. Version 5 removes
the centered geographic-arrival text panel while preserving the zoom and marker. Zooming a 5,346-pixel-wide raster that far will visibly soften the
map at some display sizes; more detailed city-level map imagery would require
a higher-resolution source or secondary local map tiles.

To change a focal point, edit the chapter's `lon`, `lat`, or `zoom` and re-upload
`content.js`. No rebuild is required. Example: Chicago `lon: -87.6298`,
`lat: 41.8781`. Country-wide chapters use representative cities noted in the
chapter descriptions, not an invented country-centroid coordinate.

### Updating an already published GitHub Pages site

Replace the existing files in the repository root, retaining the `assets/`
directory. After GitHub Pages finishes deploying the update, reload with
**Ctrl+Shift+R** (or the browser's equivalent) to bypass a cached old version.
The HTML also contains a version suffix on the updated CSS/JS file URLs.

If the operating system requests *reduced motion*, the revised site still
shows each destination but switches between the world and location views
without continuous zoom animation.

## Version 5 — presentation simplifications (17 November 2026)

- The intro retains the title and author but removes the “A learning portfolio” kicker and the explanatory sentence.
- The separate mid-screen geographic-arrival text panel has been removed. The map still zooms to the programmed destination and retains its small map point marker.
- The location label that moves from upper-right toward upper-left contains **only** the chapter's place name, without anchor city or coordinates. Coordinates remain in `content.js` solely for map positioning.
- Quote panels no longer show “A Voice from the Reading”; the speaker attribution is italicized.
- The references heading displays “References” without its former kicker or explanatory line; bibliography and acknowledgments are unchanged.

**Updating an existing GitHub Pages site:** replace all seven files, including the files in `assets/`, with this ZIP's contents in the repository root. Script and stylesheet cache keys are updated to `v=4`.


## Version 5 presentation refinements (November 2026)

- The chapter-number badges above chapter titles have been removed. The chapter menu and the small header progress readout remain available for navigation.
- Bottom-left geographic captions have been removed. The chapter's moving location-name card remains.
- The map's original 5,346 × 2,673 pixels are preserved. Two additional ocean-edge image strips, `assets/map-wrap-east.webp` and `assets/map-wrap-west.webp`, are **cropped from the provided Natural Earth world map itself**, not synthesized imagery. They wrap the map correctly at longitude ±180°, so the New Zealand chapter no longer reveals a flat blue region east of the map boundary.
- Geographic zoom is now exponential (visually smoother) and scroll-controlled over an extended entrance and exit distance. Scroll slowly or use the chapter menu to see the full transition. Reversing scroll reverses the motion.
- For testing this version, upload **all** files and refresh with Ctrl+Shift+R so updated script and style caches clear.
