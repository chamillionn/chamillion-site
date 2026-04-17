-- Backfill total_cost on historical snapshots using capital_flows.
-- Reconstructs the running "net invested" at each snapshot date.
-- Idempotent: only updates rows where total_cost is 0 or NULL.

UPDATE snapshots s
SET total_cost = COALESCE((
  SELECT
    SUM(CASE WHEN cf.type IN ('buy', 'deposit_fiat') THEN cf.amount_eur ELSE 0 END)
    - SUM(CASE WHEN cf.type IN ('sell', 'withdraw_fiat') THEN cf.amount_eur ELSE 0 END)
  FROM capital_flows cf
  WHERE cf.date <= s.snapshot_date
), 0)
WHERE s.total_cost = 0 OR s.total_cost IS NULL;
