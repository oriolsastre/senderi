-- Alter waypoints table to change wikidata from INTEGER to TEXT
-- Wikidata IDs can be large and are better stored as text
ALTER TABLE waypoints DROP COLUMN wikidata;
ALTER TABLE waypoints ADD COLUMN wikidata TEXT;