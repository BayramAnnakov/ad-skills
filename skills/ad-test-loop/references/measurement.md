# Measurement: instrumentation, automation, reconciliation

## Three sources, each blind to something

- **The ad platform**: delivery and its own attributed conversions. Blind to what happens after the click that is not
  sent back, and it models some conversions.
- **Web analytics** (sessions by `utm_content`, landing page): blind to in-app browsers that drop the page before
  analytics loads (on one day, 30 link clicks on the best ad gave 15 sessions; on another, a session-recording tool saw
  87 people from Meta where web analytics saw about 34), and it counts automation as visitors. For what visitors did
  on the page, use session recordings (tap and scroll maps, per-session events) and count people, not taps: 7 taps on a
  sign-up button came from 2 people.
  Engagement for the current day can read near zero until processed: judge complete days.
- **Backend rows** (leads, checkout starts, payments with their attribution): the money. Blind to sales that happen
  outside the site (a messenger, a marketplace, a bank transfer) and to attribution lost when cookies expire.

Session durations from in-app browsers include hidden time: sessions of exactly 5-6 minutes with no events after the
first seconds are a page left open in the background. Read active time, not duration.

Triangulate: a claim that holds in only one source is a lead.

## Platform crawlers and automation

- Within an hour of creating or editing an ad, the platform's systems open its landing URL from data-centre towns
  (for Meta seen in Sep 2026: Prineville, Forest City, Fort Worth, Altoona, Gallatin, Clonee/Dublin, Luleå), execute
  JavaScript, render tall viewports and scroll. On one launch day they were ~33 of 51 paid-social sessions, 2-5 per
  ad including ads with no clicks, and 7 of 9 custom "engaged" pixel events.
- Treat location as a suspicion signal, not an identity: the tells together are data-centre town + session within the
  hour after a publish or edit + equal sessions per ad + no input + countries outside the targeting. Report numbers with
  and without the suspected sessions; never delete them.
- An "engaged" event built on scroll + time fires for crawlers. Requiring a trusted input event (`event.isTrusted`,
  recorded from before hydration), skipping `navigator.webdriver`, and firing only on a visible page filters script-
  driven crawlers. It does not filter automation that drives real input (a browser-automation click is trusted), and it
  misses some real people (screen readers, host-controlled scrolling). Reconcile the event with backend actions before
  trusting it as a proxy.
- Test such a guard with the old code as a control, and confirm the server serves the new bundle.

## Proxy events

Before optimizing for or judging by a proxy (engaged session, add to cart, lead magnet signup), record how it relates
to purchases in past data. A new account has none: treat the proxy as unvalidated, keep judging by backend actions,
and write down after the pilot how many proxy events came per purchase. A proxy that crawlers can fire, or that buyers skip, optimizes delivery towards the wrong
people. Timestamp every change to its definition.

## Country and audience decisions

Short sessions from a country are not evidence about the buyers who live there. Check backend purchase history by
country first; a country that has bought before stays until ad-level results (spend share, cost per qualified action
against other countries) justify moving it to its own ad set. Moving is reversible; excluding hides the evidence.
