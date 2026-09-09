# actuallycoded.com

The site for the actuallycoded brand: one custom one-page website, actually coded,
finished by a person, delivered in 48 hours. The site is the proof of the claim, so it is
built to the house standard without exception. The business decisions behind it live in
the second brain vault: `projects/actuallycoded-site-brief.md` and
`projects/anti-default-brand-plan.md`.

Static HTML, CSS and vanilla JS. No build step, no npm, no framework. GitHub Pages serves
`docs/` from `master`, so **a push to master publishes**. Work on a branch, show Caleb on
localhost, merge on approval.

## Run it locally

```
python server.py
```

Then open http://localhost:8641. The server only serves `docs/`.

## What is where

```
docs/
  index.html          the one page: hero, the standard, proof, start
  styles.css          the whole design system; house faces, square, no gradients
  script.js           nav, reveals, progress hairline, the brief button, Lenis
  privacy.html        carries the Dae Calendar section; contact is calebseft@gmail.com on purpose
  terms.html          the product, the 48 hours, refunds, ownership, liability
  accessibility.html
  legal.css           reading layout for the three pages above
  404.html
  marks.html          the monogram and three alternates, on dark and light (noindex, unlinked)
  exhibit/            QUARANTINE: two deliberately generated-looking sites (Northline as a cheerful template, Hollis as a dark premium one) shown in the comparison
                      windows; its own document so nothing in it enters the page; robots disallowed;
                      the gate never scans this folder, on purpose
  assets/tells/       six SVG specimens of the tells, one per row of the list; images on purpose
  robots.txt  sitemap.xml  CNAME  .nojekyll  .well-known/security.txt
  fonts/              Big Shoulders + Newsreader, self hosted woff2, SIL OFL
  vendor/lenis.min.js Lenis 1.1.18, MIT, vendored because the CSP is script-src 'self'
  concepts/           the four fictional proof pages (dental, coffee, electrician, barber) and their shared motion script
  assets/concepts/    their images, each folder with a SOURCES.md crediting Pexels
```

## Launch state, 2026-09-09

**Live at https://actuallycoded.com since 2026-09-09.** GitHub Pages serves `docs/` from
`master`, custom domain set, HTTPS enforced with a Let's Encrypt certificate (issued
2026-09-09, renews automatically). DNS at Namecheap: four A records on `@` to GitHub's
addresses, `www` CNAME to `calebseft-source.github.io`; the mail records (Private Email MX
and SPF, the DKIM TXT at `privateemail._domainkey`, the DMARC TXT) were not touched and
were verified resolving after the change. Lighthouse on the live page: performance 99,
accessibility 100, best practices 100, SEO 100. Live DOM check: 0 rounded, 0 gradients,
0 italics, 0 third party hosts.

**Deployed again 2026-09-09 evening (`63a157b`).** The page now builds itself from its own
code: an editor pane at the top of the hero types the hero's markup and the page assembles
beneath it; every section and component below (the six tells, the comparison, the receipt,
the proof cards, the brief) is written in its own markup as it scrolls into view, grows to
size, and the code fades to reveal it. Wordmark is `actually.coded`. Off for reduced motion,
hidden tabs and no JavaScript; every build has a failsafe. Engines and rules are documented
in `docs/script.js` at the bottom.

**Decisions recorded 2026-09-09:** matrix identity off; terms as written; the four
concepts and two exhibits final. Palette is the stone's orange amber on a warm near black
(`--accent: #f5891c`), inclusions only on the monogram.

**Stripe, in progress.** Account `actuallycoded` is live and under Stripe's review. The
product "One-page website, founding price" ($495, one off) exists. The Payment Link could
not be created yet: Stripe paused payments until it could reach the website, and the
website task was resubmitted the moment HTTPS was live. Reviews usually finish within 24
hours. Still to do when Stripe enables payments: create the Payment Link (collect name,
limit ten payments with a sold out message pointing at hello@actuallycoded.com and $850,
three optional brief fields, redirect to `https://actuallycoded.com/#start`), then replace
the interim button in `docs/index.html` (`id="pay-link"`, currently a mailto that reads
"Request the payment link, $495") with the Stripe URL, the text "Pay the founding price,
$495", and `target="_blank" rel="noopener noreferrer"`, and trim the sentence about the
button emailing from the intake note. Bank account added 2026-09-09. Branding (icon, logo, colours) and public details
(support email, privacy and terms URLs) are set; brand files live in `brand/`.

**Not planned:** the OAuth app stays pointed at cfwebdev.net and cfwebdev.net is not
redirected; it remains Caleb's portfolio (his call 2026-09-08). Steps 4 and 5 below are
kept for reference only.

**Two things learned at launch.** A page whose CSP carries `upgrade-insecure-requests`
renders unstyled over plain http until the host has a certificate, because every asset is
forced to https; it was dropped for the minutes between DNS and the certificate and then
restored. And changing the custom domain through the GitHub API makes GitHub commit
`docs/CNAME` to master itself, so pull before pushing after any Pages domain change.

## Things only Caleb can do, in order

The brief lists these and the order matters because cfwebdev.net's DNS carries live mail
and its privacy page gates the Google OAuth app. Nothing here touches either.

### 1. Approve and choose

- **The mark is the ac monogram** on the cut-corner tile in the house green, per Caleb's
  direction on 2026-09-08. Three geometric alternates stay on `docs/marks.html` in case it
  reads as too close to the old brand. To swap: replace the `<svg class="brand-mark">` in
  `index.html` (twice), the three legal pages and `404.html`, and the `href` of every
  `<link rel="icon">`.
- **Approve the copy that is commercial**: the terms in `terms.html` section 7 (48 hours
  counted on business days, late remedy is full refund or $100 off), section 8 (refund
  rules, the 30 day no-brief rule), and section 9 (the round of changes is one list within
  14 days). The brief fixed the offer; these are the edges of it and they are Caleb's call.
- **Decide on the matrix identity.** Decided 2026-09-09: off.
- **Approve the four proof pages**: Northline Dental and Fieldnote Coffee (copied across and
  rebranded) plus Kestrel Electric and Hollis Barbershop (built here 2026-09-08). Nothing is
  published yet.

### 2. Stripe

Create a **Payment Link** in the Stripe dashboard:

- Product: `One-page website, founding price`. Price: `$495.00 USD`, one time.
- Collect the customer's email (default) and name.
- After payment: redirect to `https://actuallycoded.com/#start` or a thank-you note.
- Optional but useful: add up to three custom text fields so the brief can be typed at
  checkout too. Suggested: `Your business in a sentence`, `The one thing the page must
  make a visitor do`, `Links to anything that exists`.
- Paste the link into the `pay-link` anchor in `docs/index.html`, which carries an interim
  mailto until then (see Launch state above).
- When the tenth founding order is paid: create a second Payment Link at `$850.00`, swap the
  href, and change the founding line in the hero (`10 of 10` and the two `$495` strings).
  Stripe's own receipt is the customer's receipt.

### 3. DNS for actuallycoded.com (Namecheap, Advanced DNS)

Replace only the two parking records:

- Delete the `www` CNAME to `parkingpage.namecheap.com` and the `@` URL redirect.
- Add four `A` records on `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`,
  `185.199.111.153`.
- Add a `CNAME` on `www` to `calebseft-source.github.io`.
- **Do not touch** the Mail Settings dropdown (Private Email), the `privateemail._domainkey`
  TXT, or the `_dmarc` TXT. They are the mailbox.
- In the repo's Pages settings: custom domain `actuallycoded.com`, wait for the DNS check,
  then tick Enforce HTTPS.

### 4. Only after the site is live with its legal pages: the OAuth app

In the Google Cloud console for project `dae-calendar-506821`, under the account
calebseft@gmail.com (Chrome opens it as `authuser=2`; the default account shows a fake
permissions error): add `actuallycoded.com` as an authorized domain, and change the privacy
and terms URLs to the new site. Then run `node C:\dev\gcal\gcal.mjs list` and confirm it
still authenticates. Details in the vault under `resources/calendar-shape.md`.

### 5. Only after step 4: redirect cfwebdev.net

Path preserving, so the 42 mockup URLs inside pitches already sent keep resolving. Either
keep serving them from `caleb-portfolio` or move them here with the old paths redirecting.
cfwebdev.net's mail records are never touched.

## Compliance checklist (not legal advice; confirm with a professional)

Things a sole proprietor selling under a trade name in Florida is generally expected to
have. None of them are on the site; they are Caleb's to do or confirm.

- **Florida fictitious name registration for "actuallycoded".** Florida requires a business
  operating under a name other than the owner's legal name to register it with the Division
  of Corporations (sunbiz.org, Fictitious Name Registration). The same applied to
  "cfwebdev". The terms and privacy pages say "Caleb Pierce, doing business as
  actuallycoded", which is the honest wording either way, but the registration is what
  makes the trade name lawful to use on invoices and at the bank.
- **Local business tax receipt.** Orange County and the City of Orlando each issue one for
  businesses operating in their jurisdiction, including home based ones. Check which applies
  to the address.
- **Sales tax.** Florida generally does not tax web design as a service, but this is exactly
  the kind of thing to confirm once with an accountant rather than assume. The terms say
  prices exclude any taxes that apply, which is correct either way. Stripe Tax can be
  switched on later if needed.
- **Stripe account details.** The business name, support email (`caleb@actuallycoded.com`),
  and statement descriptor should say actuallycoded so the card statement matches the site.
  Stripe also asks for a refund policy URL: use `https://actuallycoded.com/terms.html#refunds`.
- **Records.** Keep Stripe payouts and the brief emails together per order; the terms promise
  retention for tax purposes and that is what makes the promise true.
- **The 48 hour promise is a contract term.** The terms define when the clock starts, that it
  runs on business days, and what the remedy is if it is missed. Keep those three things in
  mind on every order, because they are now the deal.

## Deploy gate

Run before Caleb sees anything, and again before merge. Every count must be zero except
the ones that say otherwise.

```
cd docs
grep -o "border-radius:[^;]*" *.css concepts/*.css | grep -v ": *0"      # rounded: 0
grep -c "gradient(" *.css concepts/*.css                                   # gradients: 0
grep -c "italic" *.css concepts/*.css                                      # italics: 0 (comments aside)
grep -cE "Inter|Helvetica|-apple-system|system-ui|Segoe" *.css             # system stacks: 0
grep -rnoE "https?://(fonts\.|cdn|unpkg|ajax\.)" *.html *.css concepts/    # third party: 0
grep -rnoE "&mdash;|&ndash;|&#8212;|&#8211;|—|–" *.html *.js *.css         # dashes: 0
grep -rn "REPLACE_WITH" *.html                                             # placeholders: 0 before merge
grep -c "Content-Security-Policy" index.html privacy.html terms.html accessibility.html
```

Then on localhost: 375px wide with no horizontal overflow, fonts loaded from `fonts/`, every
`data-reveal` element revealed, the brief button opens a mailto with the answers in it, and
the live DOM check (computed border-radius, background-image and font-style over every
element) returns 0, 0, 0 on the homepage. That last check is what caught empty `<i>` tags
being counted as italics. `docs/exhibit/` is excluded from every count by design: it is the
thing the page is measured against.
