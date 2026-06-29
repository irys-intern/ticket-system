-- Assigns each closed ticket to a independently-random agent.
-- The subquery re-evaluates per row, so tickets get different agents.
-- Safe to re-run: only touches rows where assigned_to IS NULL.

UPDATE tickets
SET assigned_to = (
    SELECT id FROM "user"
    WHERE role = 'agent'
    ORDER BY RANDOM()
    LIMIT 1
)
WHERE status = 'closed'
  AND assigned_to IS NULL;
