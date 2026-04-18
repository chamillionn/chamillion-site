-- Re-sync snapshots.total_cost to reflect ALL capital_flows records.
-- capital_flows is the source of truth for cost basis: buy/deposit_fiat add,
-- sell/withdraw_fiat subtract. Portfolio trades/positions are independent.

UPDATE snapshots s
SET total_cost = COALESCE((
  SELECT
    SUM(CASE WHEN cf.type IN ('buy', 'deposit_fiat')  THEN cf.amount_eur ELSE 0 END)
    - SUM(CASE WHEN cf.type IN ('sell', 'withdraw_fiat') THEN cf.amount_eur ELSE 0 END)
  FROM capital_flows cf
  WHERE cf.date <= s.snapshot_date
), 0);
