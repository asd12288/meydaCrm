-- Add 'grace' status to subscription_status enum
-- Grace period is 7 days after subscription expires before full block

ALTER TYPE subscription_status ADD VALUE 'grace' BEFORE 'expired';

-- Add comment for clarity
COMMENT ON TYPE subscription_status IS 'Subscription states: pending (awaiting payment), active (paid), grace (7-day period after expiry), expired (blocked), cancelled';
