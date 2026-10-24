import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

export type Db = Database.Database;

/**
 * Initializes and configures the SQLite database with proper foreign key support
 * and creates all required tables and migrations for vehicle showroom operations.
 */
export function openDb(filename = process.env.DATABASE_FILE ?? path.resolve('data/dealership.db')): Db {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');

  // Core schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user','admin')) DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL CHECK(price > 0),
      quantity INTEGER NOT NULL CHECK(quantity >= 0),
      year INTEGER,
      kms_driven INTEGER NOT NULL DEFAULT 0,
      fuel_type TEXT NOT NULL DEFAULT 'Petrol',
      city TEXT,
      image_url TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      vehicle_id TEXT NOT NULL,
      price INTEGER NOT NULL,
      purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migration statements for existing databases
  const migrations = [
    "ALTER TABLE vehicles ADD COLUMN kms_driven INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE vehicles ADD COLUMN fuel_type TEXT NOT NULL DEFAULT 'Petrol'",
    "ALTER TABLE vehicles ADD COLUMN city TEXT"
  ];

  for (const statement of migrations) {
    try {
      db.exec(statement);
    } catch {
      // Column already exists in upgraded database
    }
  }

  return db;
}

/**
 * Seeds default administrator and verified showroom vehicles with brand-accurate imagery.
 */
export async function seed(db: Db) {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@apexmotors.test');
  if (!adminExists) {
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
      'admin-001',
      'Apex Administrator',
      'admin@apexmotors.test',
      await bcrypt.hash('Admin123!', 10),
      'admin'
    );
  }

  const customerExists = db.prepare('SELECT id FROM users WHERE email = ?').get('customer@apexmotors.test');
  if (!customerExists) {
    db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(
      'user-001',
      'Mira Nair',
      'customer@apexmotors.test',
      await bcrypt.hash('Customer123!', 10),
      'user'
    );
  }

  const seededCars = [
    {
      id: 'car-001',
      make: 'Tata',
      model: 'Nexon EV',
      category: 'Electric',
      price: 1450000,
      quantity: 4,
      year: 2025,
      kms_driven: 18400,
      fuel_type: 'Electric',
      city: 'Bengaluru',
      image_url: '/images/tata-nexon-ev.jpg',
      description: 'Connected electric compact SUV with signature teal exterior, fast-charging support, and confident city range.'
    },
    {
      id: 'car-002',
      make: 'Mahindra',
      model: 'XUV 700',
      category: 'SUV',
      price: 2199000,
      quantity: 2,
      year: 2025,
      kms_driven: 29600,
      fuel_type: 'Petrol',
      city: 'Mumbai',
      image_url: '/images/mahindra-xuv700.jpg',
      description: 'Spacious flagship SUV with advanced driver assistance, panoramic Skyroof, and commanding road presence.'
    },
    {
      id: 'car-003',
      make: 'Hyundai',
      model: 'Verna',
      category: 'Sedan',
      price: 1599000,
      quantity: 0,
      year: 2024,
      kms_driven: 41200,
      fuel_type: 'Petrol',
      city: 'Delhi',
      image_url: '/images/hyundai-verna.jpg',
      description: 'Refined turbo sedan with parametric design and horizon LED lightbar. Certified pre-owned allocation arriving soon.'
    }
  ];

  if (!db.prepare('SELECT id FROM vehicles LIMIT 1').get()) {
    const insert = db.prepare(`
      INSERT INTO vehicles (id, make, model, category, price, quantity, year, kms_driven, fuel_type, city, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const car of seededCars) {
      insert.run(
        car.id,
        car.make,
        car.model,
        car.category,
        car.price,
        car.quantity,
        car.year,
        car.kms_driven,
        car.fuel_type,
        car.city,
        car.image_url,
        car.description
      );
    }
  } else {
    // Ensure existing databases have accurate metadata and brand-correct imagery updated
    const update = db.prepare(`
      UPDATE vehicles
      SET kms_driven = ?, fuel_type = ?, city = ?, image_url = ?
      WHERE id = ?
    `);

    for (const car of seededCars) {
      update.run(car.kms_driven, car.fuel_type, car.city, car.image_url, car.id);
    }
  }
}
