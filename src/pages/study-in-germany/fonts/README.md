# Study Introduction font assets — v1

These full-repertoire roman variable WOFF2 files are scoped to the Study in Germany Introduction. Fraunces is used for the arrival H1 and both invitation H2s; Manrope is used for Introduction prose, links and supporting text. The five reading units, Header, Footer and other routes keep their existing typography.

## Loading and fallback

The local CSS Module registers unique family aliases with relative asset URLs, normal style, supported variable weight ranges and `font-display: swap`. No `local()` source or remote font stylesheet is used. Fraunces falls back to Georgia, Times New Roman and serif; Manrope falls back to the existing Inter/system UI sans-serif stack. Existing sizes, weights, spacing and breakpoints are retained. Custom axes are not preset or animated. Font faces may be registered eagerly; actual loading and outside-Introduction containment must be checked in the browser.

## Identity and qualification

`provenance.json` records the exact Google Fonts distribution commits, original TTF identities, font versions, axes/defaults, output hashes and license paths. The retained AQ1-R1 metadata/shaping/reproducibility evidence and separate AQ1-R2 browser follow-up are external qualification records; the historical blocked AQ1-R1 browser outcome is not rewritten. Asset qualification does not establish application accessibility, visual or performance acceptance.

The total font payload is 248,904 bytes. No numeric performance budget has been approved. Application CLS/LCP and fallback measurements must be reported against the accepted B1/R1 anchor without inventing a PASS threshold.

## Licenses and transformation

The complete original notices ship at `/licenses/study-fonts/v1/fraunces-OFL.txt` and `/licenses/study-fonts/v1/manrope-OFL.txt`. Preserve these notices and internal copyright/license names. The authenticated notice headers and source names declare no Reserved Font Names. Conservatively treat the WOFF2 conversions as Modified Versions under OFL 1.1; do not imply upstream endorsement or sell the fonts alone.

FontTools 4.67.0 with Brotli 1.1.0 performed two independent standard full-repertoire encodes per family. Their output bytes matched. Qualification allowed only the authenticated Fraunces TTF's exact empty eight-byte DSIG to be omitted, plus documented standards-required WOFF2 normalizations. The input TTF was not manually stripped. No subsetting or regeneration occurred during this integration.

## Verification and updates

Run `npm test -- src/pages/study-in-germany/StudyFontAssets.test.js` for shipped asset and provenance integrity. Run existing Study/Header/Footer tests, configured lint and the production build for integration verification. Verify emitted font hashes and both public notices, then inspect actual Rendered Fonts, font requests, constrained/failed loading, layout and keyboard/history behavior.

Do not replace these assets with a newly downloaded build, system font or regenerated WOFF2. Future updates require separately approved qualification with immutable sources, license checks, hashes and reproduction evidence. Preserve full repertoire and all authorized metadata. Font choice does not change document language or language-of-parts semantics.
