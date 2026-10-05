# Brand files

Rendered 2026-09-09 from the site's own mark and faces, on the warm black ground.
Not served by the site (this folder is outside `docs/`).

- `icon-512.png` the monogram tile, square. Stripe checkout icon, favicons elsewhere.
- `logo-1200x300.png` the tile and wordmark on the ground. Stripe checkout logo.
- `profile-1080.png` the tile centred on the ground. Facebook and Instagram profile picture.
- `cover-1640x624.png` the tile and wordmark on the ground. Facebook cover.

To re render the wordmark ones, open the site's header markup on the ground with
`styles.css` loaded and screenshot at the target size; the fonts must come from the
repo, never from Google.

## Re rendered 2026-09-09 evening: the wordmark is `actually.coded`

The dot is property access and it is the handle (@actually.coded), so the site and
the socials say the same thing. `actually` in bone, `.coded` in amber. `logo-1200x300.png`
and `cover-1640x624.png` were re rendered in Python (Pillow) from the mark's own
geometry on the 100 unit grid, the grain and sheen included, and from the repo's
Big Shoulders face unpacked from `docs/fonts/bigshoulders-latin.woff2` with fontTools,
at weight 700 and letter spacing minus 0.02em, the header's exact styling. The icon and
the profile picture are tile only and did not change. The Facebook cover uploaded
earlier on 2026-09-09 carries the old wordmark and needs replacing with this one.
- `youtube-banner-2048x1152.png` the wordmark centred inside the 1235 by 338 safe area. YouTube channel banner.

## Re rendered 2026-10-05: monochrome

The site went black and white on Caleb's call, so every file here was re rendered by
`brand/render.py` (Pillow plus fontTools, the face unpacked from the repo's woff2 at weight
700 and optical size 24): a white tile `#f5f5f5` with black glyphs on the `#0b0b0b` ground,
no grain, no sheen, `actually` in grey `#c9c9c9` and `.coded` in white. Run `python brand/render.py`
from the repo root to regenerate. Still to upload from a logged in machine: the Stripe
checkout icon and logo (and the brand colour `#0b0b0b` with accent `#f5f5f5` in Stripe's
branding settings), the Facebook and Instagram profile pictures, the Facebook cover, the
YouTube banner, and the TikTok profile picture.
