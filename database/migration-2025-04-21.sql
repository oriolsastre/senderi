-- Alter waypoints table to remove CHECK constraint on tipus field
-- This allows any text value for tipus
ALTER TABLE waypoints DROP COLUMN tipus;
ALTER TABLE waypoints ADD COLUMN tipus TEXT DEFAULT 'cim';