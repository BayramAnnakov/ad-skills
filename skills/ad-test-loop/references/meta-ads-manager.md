# Meta Ads Manager: launch and read (observed Sep 2026; the UI changes, re-check what looks different)

## Access
- The Meta Ads MCP / API tools can be disabled for a specific ad account: every campaign, ad set and ad call then
  returns "This ad account is not enabled for the Ads MCP". Dataset (pixel) tools may still work. Check that flag
  first, then fall back to reading and editing Ads Manager in the browser.
- The user does what automation must not or cannot: logging in, payment methods, uploads through the native OS file
  picker. Do not patch page internals to get around the file picker; ask for the upload, then continue.

## Setup traps
- A custom conversion can only be built on an event the dataset has already received: deploy the event, trigger it
  once on production, wait until it shows, then create the conversion.
- The optimization event of a published ad set could not be switched: duplicate the ad set, set the event on the copy,
  then **pause** the old one (the ads come along). Do not delete it: deleting loses the delivery history you will want
  when reading results, and the duplicated ads re-enter review with no accumulated engagement.
- Some countries require a minimum age (Thailand 20+). EU delivery needs the advertiser and payer fields filled.
- Review every default before publishing: Advantage+ creative enhancements (touch-ups, text improvements), standard
  enhancements, "Reveal details over time". They change what the viewer sees.
- "No delivery" warnings for right column or WhatsApp Status on video ads are expected.
- Advantage+ placements can put most of a small budget into Audience Network (in-app banners, interstitials, rewarded
  video) with 15-30% CTR and visitors who tap through without reading. Check the placement breakdown in the first days.
  In Sep 2026 the ad set editor no longer offered manual placements: exclusions are set at account level per objective
  (Ads Manager left menu → Advertising settings → Placement controls; a ticked objective means ads may appear there),
  or bids are lowered with placement value rules. An
  account-level exclusion also applies to every other campaign with that objective: read the campaign list first.
- The "Story media aspect ratio" error with a 9:16 and a 4:5 file attached did not block publishing, and the ads were
  approved. Check the placement breakdown to see which file each placement served.

## No proven setup (a first campaign)
- Before any spend: the pixel and a server-side (Conversions API) event are installed, a test visit and a test lead
  arrive in Events Manager, and the landing page loads fast on a phone in the in-app browser.
- Objective Sales (or Leads if the conversion is a signup). One campaign, one ad set, 2-3 ads.
- Optimization event: Meta's learning phase ends after about 50 optimization events in 7 days. If purchases will not
  reach that at the budget, optimize for the event **closest to purchase** that will (checkout start, lead, a custom
  engaged-visit event that requires real input), and judge by backend purchases. Do not drop to a landing-page view to
  hit the volume: that is the most junk-prone event on the list and the one crawlers and accidental taps inflate. Record the choice and why in the test plan.
- Audience: the countries and language that match the offer; otherwise broad. Placements: Advantage+ **with Audience
  Network excluded**, or Advantage+ plus a required placement breakdown on day 1. On a small budget Audience Network
  can take most of the spend at a click-through rate that makes every downstream number meaningless (see above), and a
  first campaign is exactly when you cannot yet tell that from the totals. Turn the creative enhancements off (below).
- Budget: enough for a 3-5 day pilot whose first job is measuring cost per event, not picking a winner. Once it
  delivers and the numbers reconcile, that ad set is the proven setup to clone.

## Building in the browser
- Clone a proven setup: duplicate the working ad set into a new campaign. The copy keeps countries, language, age,
  lookalikes, optimization event, destination and ads. Rename, set the budget, swap media and `utm_content` per ad,
  delete the ads you do not need.
- Duplicate dialogs pre-tick recommendations (instant forms, engaged-view attribution) and "Show existing reactions".
  Untick them: they change the conversion setup or carry social proof from a different ad.
- Copies have creative setup ON: "Website summaries" pulls selling points from the site and may show them in the ad.
  Turn off Selling Points and Images per ad unless every pulled claim is true for this offer.
- Media picker: search by file name; previously selected media stays selected and clicks can fail to register. Check
  the "N selected" counter before Next. Leave "Image from AI" at 0.
- **"Review and publish" publishes every draft in the account**, including someone else's unpublished edit on a live
  ad. Read the list before Publish.
- Meta cannot stop one ad on a date. Give date-bound ads their own ad set with an end date, or record a manual pause.
- Browser automation: parallel reads of one tab race each other (run them in sequence); the editor renders lazily
  (scroll it into view before reading); a tooltip read right after hover belongs to the previous element; a read right
  after switching ads can show the previous ad (confirm the ad name in the same read); the ad set editor loads the
  conversion event late (a read right after opening shows "Select an event"); an unfiltered list can omit a
  just-published ad set for a minute (filter by campaign id). DOM coordinates and screenshot coordinates can differ by a
  scale factor: `scrollIntoView` then `getBoundingClientRect`, and measure the factor once per machine.
- New ads cleared review in about 10 minutes (7 of 7, one Saturday evening). The approval email is the quickest signal.

## Verify after publishing
- Per ad: destination path, `utm_content`, both media, AI disclosure where generated media is used, creative setup off.
- Per ad set: optimization event (after the page fully loads), budget, schedule/end date, countries, language, age,
  status.

## Reading performance
- Ads Manager accepts columns and dates in the URL:
  `columns=name,delivery,results,spend,impressions,reach,cpm,actions:link_click` and
  `date=YYYY-MM-DD_YYYY-MM-DD,today`. The table is virtualised: filter by campaign to read every row.
- Cross-check link clicks with analytics sessions by `utm_content`; expect in-app browser loss, and separate crawler
  sessions (measurement.md).
