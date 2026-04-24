CREATE TABLE IF NOT EXISTS excursions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titol TEXT NOT NULL,
  descripcio TEXT,
  distancia REAL NOT NULL DEFAULT 0,
  desnivell_pos REAL NOT NULL DEFAULT 0,
  desnivell_neg REAL NOT NULL DEFAULT 0,
  osm INTEGER,
  data_inici TEXT NOT NULL DEFAULT (date('now')),
  data_final TEXT NOT NULL DEFAULT (date('now')),
  slug TEXT UNIQUE NOT NULL,
  privat INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS waypoints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT,
  elevacio INTEGER,
  lat REAL NOT NULL,
  lon REAL NOT NULL,
  tipus TEXT DEFAULT 'cim',
  comentari TEXT,
  descripcio TEXT,
  osm_node INTEGER,
  wikidata TEXT,
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
