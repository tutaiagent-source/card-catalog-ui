# CardCat Market Page Plan (Draft)

## Big distinction

The current **shared listings links** are best treated as:
- revocable
- optional by-link sharing
- time-limited or permanent
- good for card shows, DMs, Discord, Reddit, Facebook posts

The future **Market page** should be treated as a different product surface:
- indexed inside the app/site
- searchable
- browsable by all members (or public visitors later if desired)
- tied to usernames / seller identity
- not based on hidden share tokens

These should not be the same feature internally.

---

## Market page goal

A `/market` page that:
- shows only active cards a seller has chosen to expose
- looks and feels similar to Catalog
- supports search/filter browsing
- lets a visitor preview a card
- lets a visitor **Message seller**
- lets a visitor open the seller’s page if the seller has more cards listed

---

## Recommended model

### Seller page
Use a public seller route like:
- `/u/[username]`

This page can show cards according to the seller’s chosen visibility mode.

### Seller visibility mode
At the profile level, add a mode like:
- `none`
- `selected_cards`
- `all_listed`
- `whole_collection`

### Card-level control
At the card level, add a flag like:
- `public_market_visible boolean`

This supports the user request:
- list one card at a time
- list all active listings
- list the whole collection

### Effective display rules
A card should appear on `/market` if:
- seller visibility mode is `all_listed` and card status is `Listed`, or
- seller visibility mode is `whole_collection`, or
- seller visibility mode is `selected_cards` and card has `public_market_visible = true`

---

## Buyer / visitor experience

### Market page
- search by player name
- maybe later filter by sport / year / brand / seller
- card grid similar to Catalog / Listings
- visible seller username on each card

### Card preview modal
- front/back view
- details
- asking price if seller shows pricing
- `Message seller`
- `View seller page`

### Seller page
- shows seller username
- shows all cards exposed under that seller’s chosen mode
- can be shared directly

---

## Messaging rule to keep

Recommended access rule:
- users can message sellers with **public market listings**
- otherwise messaging is restricted unless users are friends later

This keeps messaging tied to actual public inventory instead of turning into open DMs for everyone.

---

## Suggested schema additions later

### profiles
- `market_visibility_mode text not null default 'none'`
- `public_seller_bio text not null default ''`
- `public_seller_enabled boolean not null default false`

### cards
- `public_market_visible boolean not null default false`

Potential checks:
- only `Listed` cards should appear in market when using listed-based modes
- only sellers with usernames should appear publicly

---

## Recommended build order

1. create seller visibility model
2. create `/market` page shell
3. create `/u/[username]` seller page
4. add card-level publish toggle
5. add market search/filter UI
6. wire `Message seller` + `View seller page`
7. add friends logic later

---

## Strong recommendation

Do **not** power the Market page off the current token-based share links.

Instead:
- keep share links for ad hoc external sharing
- build Market as a separate public/member-discovery surface

That separation will make permissions, search, seller identity, and future friend rules much cleaner.
