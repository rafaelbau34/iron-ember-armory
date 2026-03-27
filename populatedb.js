require("dotenv").config();
const { Client } = require("pg");

const SQL = `
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    model_number VARCHAR(100),
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0
);

INSERT INTO categories (name, description) VALUES
  ('Rifles', 'Long-barreled firearms designed for accurate shooting.'),
  ('Handguns', 'Compact firearms designed to be held and fired with one hand.'),
  ('Optics', 'Optical sights and scopes for firearms.')
ON CONFLICT DO NOTHING;

INSERT INTO items (category_id, name, model_number, description, price, stock_qty) VALUES
  (1, 'AR-15 Tactical', 'AR-15-T', 'Semi-automatic rifle with M-LOK handguard.', 899.99, 15),
  (1, 'Bolt Action Sniper', 'BAS-308', 'Precision .308 bolt action rifle.', 1200.00, 5),
  (2, 'Glock 19 Gen 5', 'G19-G5', 'Compact 9mm pistol, ideal for concealed carry.', 599.00, 20),
  (2, '1911 Classic', '1911-C', 'Classic .45 ACP pistol with wood grips.', 750.00, 8),
  (3, 'Red Dot Sight', 'RDS-01', '1x20mm red dot sight with 2 MOA dot.', 150.00, 30)
ON CONFLICT DO NOTHING;
`;

async function main() {
  console.log("Seeding database...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    await client.query(SQL);
    console.log("Database seeded successfully.");
  } catch (err) {
    console.error("Error seeding database:", err);
  } finally {
    await client.end();
  }
}

main();
