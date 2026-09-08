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
  robots.txt  sitemap.xml  CNAME  .nojekyll  .well-known/security.txt
  fonts/              Big Shoulders + Newsreader, self hosted woff2, SIL OFL
  vendor/lenis.min.js Lenis 1.1.18, MIT, vendored because the CSP is script-src 'self'
  concepts/           the two fictional proof pages and their shared motion script
  assets/concepts/    their images, each folder with a SOURCES.md crediting Pexels
```

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
- **Decide on the matrix identity.** It is not on this site. The brief says ask, not decide.
- **Approve reusing Northline Dental and Fieldnote Coffee** as the proof pages. They are
  copied into `docs/concepts/` and rebranded, but nothing is published yet.

### 2. Stripe

Create a **Payment Link** in the Stripe dashboard:

- Product: `One-page website, founding price`. Price: `$495.00 USD`, one time.
- Collect the customer's email (default) and name.
- After payment: redirect to `https://actuallycoded.com/#start` or a thank-you note.
- Optional but useful: add up to three custom text fields so the brief can be typed at
  checkout too. Suggested: `Your business in a sentence`, `The one thing the page must
  make a visitor do`, `Links to anything that exists`.
- Paste the link over `https://buy.stripe.com/REPLACE_WITH_PAYMENT_LINK` in
  `docs/index.html`. The deploy gate greps for `REPLACE_WITH` and fails while it is there.
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
`data-reveal` element revealed, and the brief button opens a mailto with the answers in it.
