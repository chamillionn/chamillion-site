-- Re-sync snapshots.total_cost so it always reflects the running net invested
-- from capital_flows (deposits - withdrawals up to the snapshot's date).
-- Force-overwrites stale rows that were written from positions_enriched cost_basis.

UPDATE snapshots s
SET total_cost = COALESCE((
  SELECT
    SUM(CASE WHEN cf.type IN ('buy', 'deposit_fiat') THEN cf.amount_eur ELSE 0 END)
    - SUM(CASE WHEN cf.type IN ('sell', 'withdraw_fiat') THEN cf.amount_eur ELSE 0 END)
  FROM capital_flows cf
  WHERE cf.date <= s.snapshot_date
), 0);
