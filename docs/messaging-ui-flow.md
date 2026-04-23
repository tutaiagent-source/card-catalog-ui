# CardCat Messaging UI Flow (Draft)

## Product posture

CardCat messaging should support **member-to-member card conversations** without turning CardCat into the payment processor or seller of record.

Use messaging for:
- asking if a card is still available
- making an offer
- starting a trade discussion
- discussing condition, shipping, and details

Do **not** position messaging as checkout.

---

## Phase 1: Identity

### Profile setup
On first login, prompt the user to create:
- username (required, unique, public)
- display name (optional)
- avatar (optional, later)

### Username rules
- lowercase
- 3 to 24 characters
- letters, numbers, underscore only

Examples:
- `@ripcards`
- `@soccerwax`
- `@rookiehunter`

---

## Phase 2: Messaging entry points

### From a shared listing
Buttons:
- Message seller
- Interested in trade
- Ask about this card

If the viewer is not logged in:
- show login/signup prompt
- explain that browsing can be public, but messaging requires an account

### From a card in Catalog/Listings
Buttons:
- Message seller
- Copy profile link (optional later)

### From a user profile
Buttons:
- Message
- View active listings (later)

---

## Phase 3: Conversation creation flow

### Recommended first-message shortcuts
- “Hey, is this still available?”
- “Would you consider a trade?”
- “Can you send more condition photos?”
- “What’s your best price shipped?”

### Message composer behavior
When a user starts from a specific card, prefill context:
- card title
- optional card image thumbnail
- card id reference behind the scenes

System note in the composer area:
> CardCat helps members connect. Payments, shipping, refunds, and disputes happen between users.

---

## Phase 4: Inbox UI

## Inbox list
Each conversation row should show:
- avatar / initials
- username
- optional card context
- last message preview
- last message time
- unread indicator

## Conversation view
Header:
- username
- Message seller / collector context
- Block user
- Report user

Thread body:
- messages in time order
- compact timestamp styling
- simple text only for v1

Composer:
- text box
- send button
- maybe quick actions later

---

## Phase 5: Safety controls

Minimum v1 controls:
- block user
- report user
- report message
- mute conversation
- optional “allow messages” profile toggle

Recommended copy:
> Use protected payment methods like PayPal Goods & Services. CardCat does not process payments or guarantee transactions.

---

## Suggested rollout order

1. Profiles + usernames
2. 1:1 direct conversations
3. Message seller entry point from shared listings
4. Inbox + unread state
5. Email notification for new messages
6. Offer / trade intent flows later

---

## Good v1 rule

Keep messaging tightly tied to cards.

CardCat should feel like:
- “message this seller about this card”

Not like:
- “general social DM app”
