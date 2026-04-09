import db from "../server/db.js";

const seeds = [
  {
    titol: "Fogueroses - Sant Llorenç del Munt",
    descripcio: "Excursió per les Fogueroses, des de les Marines, passant per la Morella, els Òbits i baixant cap a la font del Llor.",
    distancia: 10.5,
    desnivell_pos: 650,
    desnivell_neg: 650,
    osm: 12277042,
    data: "2026-04-04",
    slug: "2026-04-04-fogueroses-sant-llorenc-del-munt",
    privat: 0,
  },
  {
    titol: "Ruta del Cister: Santes Creus",
    descripcio: "Trajecte entre els monestirs del Cister, passant per paisatges vinícolas de l'Alt Camp.",
    distancia: 18.2,
    desnivell_pos: 320,
    desnivell_neg: 280,
    osm: 2345678,
    data: "2025-07-22",
    slug: "2025-07-22-ruta-del-cister-santes-creus",
    privat: 0,
  },
  {
    titol: "Pirineus: Estany de Baiau",
    descripcio: "Excursió d'alta muntanya des del Refugi de Vallferrera fins a l'Estany de Baiau.",
    distancia: 14.8,
    desnivell_pos: 980,
    desnivell_neg: 980,
    osm: 3456789,
    data: "2025-08-10",
    slug: "2025-08-10-pirineus-estany-de-baiau",
    privat: 0,
  },
];

const stmt = db.prepare(`
  INSERT INTO excursions (titol, descripcio, distancia, desnivell_pos, desnivell_neg, osm, data, slug)
  VALUES (@titol, @descripcio, @distancia, @desnivell_pos, @desnivell_neg, @osm, @data, @slug)
`);

db.transaction(() => {
  for (const seed of seeds) {
    stmt.run(seed);
  }
})();
console.log(`Seeded ${seeds.length} records.`);
