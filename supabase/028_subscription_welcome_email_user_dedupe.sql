-- Make subscription welcome email idempotent per user (not per subscription)
-- and support race-safe claim/update (status: sending/sent/failed).

-- 1) Deduplicate any existing duplicates for the same user+email_type.
--    Keep the earliest row.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, email_type ORDER BY created_at ASC, id ASC) AS rn
  FROM public.email_events
)
DELETE FROM public.email_events e
USING ranked r
WHERE e.id = r.id
  AND r.rn > 1;

-- 2) Remove the old uniqueness rule (email_type + stripe_subscription_id).
ALTER TABLE public.email_events
  DROP CONSTRAINT IF EXISTS email_events_unique_welcome_per_subscription;

-- 3) Add a user-level uniqueness rule for subscription welcome.
--    This scopes the index so other email_types can still have multiple rows.
DROP INDEX IF EXISTS public.email_events_unique_welcome_per_user;

CREATE UNIQUE INDEX email_events_unique_welcome_per_user
  ON public.email_events(user_id)
  WHERE email_type = 'subscription_welcome';

