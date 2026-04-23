# CardCat Messaging Implementation Order

## Goal
Ship member-to-member messaging without turning CardCat into a full marketplace checkout product.

---

## Phase 1: Usernames and profiles

### Scope
- create `profiles` table
- require username selection after signup/login if missing
- add Account/Profile settings page section

### UI
- username chooser
- availability / validation state
- optional display name
- optional allow-messages toggle

### Done when
- every messaging-capable user has a username
- usernames are unique and public
- shared listings can display a seller username later

---

## Phase 2: Messaging backend only

### Scope
- run messaging schema migration
- wire RPC: `start_direct_conversation(...)`
- test message inserts/selects with RLS
- add unread basics via `last_read_at`

### Backend checks
- user can only read conversations they are part of
- user can only send messages inside their own conversations
- blocked users cannot send messages if you add block logic later

### Done when
- two authenticated users can create/reuse a direct conversation
- messages save and load correctly

---

## Phase 3: Minimal inbox UI

### Scope
- add `/messages` page
- add conversation list
- add message thread view
- add composer and send button

### UI pieces
- left: conversation list
- right: thread panel
- mobile: stacked view
- unread badge on rows

### Done when
- a user can open inbox, read a thread, send replies

---

## Phase 4: Message seller from listings

### Scope
- add `Message seller` CTA on shared listings
- require login before messaging
- open/create direct conversation with seller
- pass optional `context_card_id`

### UX
- if not logged in → login/signup gate
- if logged in → create/reuse thread and route to it
- optional prefilled shortcuts:
  - still available?
  - interested in trade
  - what’s your best price?

### Done when
- shared listing viewer can message seller from a card flow

---

## Phase 5: Safety and moderation

### Scope
- block user
- mute conversation
- report user/message
- allow-messages toggle in profile
- simple rate limiting for first-contact messages

### UI copy
- remind users CardCat does not process payments
- recommend PayPal Goods & Services / protected payment methods

### Done when
- users have basic controls against spam/abuse

---

## Phase 6: Notifications

### Scope
- new message email notification
- unread badge in nav
- maybe browser push later

### Done when
- users know when they have a new message without camping in the inbox

---

## Recommended build order in plain English

1. **Profiles + usernames**
2. **Messaging schema + RPC**
3. **Basic inbox page**
4. **Message seller button on shared listings**
5. **Safety controls**
6. **Notifications**

---

## What I would build first

If starting tomorrow, I would do exactly this:

### Sprint 1
- profiles table
- username setup UI
- account settings for username + allow messages

### Sprint 2
- conversations/messages tables
- RPC creation flow
- `/messages` inbox shell

### Sprint 3
- shared listing `Message seller` button
- card-context first message shortcuts
- unread badge

### Sprint 4
- block/report/mute
- email notifications

---

## Strong v1 rule

Keep it tightly card-centered.

Good:
- message seller about this card
- ask about condition
- discuss trade or price

Avoid for v1:
- group chats
- offers engine
- in-app checkout
- escrow
- shipping labels
- dispute mediation
