-- Migration: Add waypoints and excursions_waypoints tables
-- Date: 2025-04-16

CREATE TABLE IF NOT EXISTS waypoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  elevacio INTEGER,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  tipus TEXT DEFAULT 'cim',
  comentari TEXT,
  osm_node INTEGER,
  wikidata INTEGER,
  privat INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS excursions_waypoints (
  excursio_id INTEGER NOT NULL,
  waypoint_id INTEGER NOT NULL,
  ordre INTEGER DEFAULT 0,
  privat INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (excursio_id, waypoint_id),
  FOREIGN KEY (excursio_id) REFERENCES excursions(id) ON DELETE CASCADE,
  FOREIGN KEY (waypoint_id) REFERENCES waypoints(id) ON DELETE CASCADE
);