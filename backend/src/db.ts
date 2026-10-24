import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

export type Db = Database.Database;
export function openDb(filename = process.env.DATABASE_FILE ?? path.resolve('data/dealership.db')): Db {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('user','admin')) DEFAULT 'user', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS vehicles (id TEXT PRIMARY KEY, make TEXT NOT NULL, model TEXT NOT NULL, category TEXT NOT NULL, price INTEGER NOT NULL CHECK(price > 0), quantity INTEGER NOT NULL CHECK(quantity >= 0), year INTEGER, image_url TEXT, description TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), vehicle_id TEXT NOT NULL, price INTEGER NOT NULL, purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);`);
  return db;
}

export async function seed(db: Db) {
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@apexmotors.test');
  if (!adminExists) db.prepare('INSERT INTO users (id,name,email,password_hash,role) VALUES (?,?,?,?,?)').run('admin-001', 'Apex Administrator', 'admin@apexmotors.test', await bcrypt.hash('Admin123!', 10), 'admin');
  if (!db.prepare('SELECT id FROM vehicles LIMIT 1').get()) {
    const add = db.prepare('INSERT INTO vehicles (id,make,model,category,price,quantity,year,image_url,description) VALUES (?,?,?,?,?,?,?,?,?)');
    [['car-001','Tata','Nexon EV','Electric',1450000,4,2025,'https://images.unsplash.com/photo-1592833159155-c62df1b65634?auto=format&fit=crop&w=900&q=80','Connected electric SUV with confident city range.'], ['car-002','Mahindra','XUV 700','SUV',2199000,2,2025,'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=900&q=80','Spacious flagship SUV with advanced safety features.'], ['car-003','Hyundai','Verna','Sedan',1599000,0,2024,'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80','Refined turbo sedan. New allocation arriving soon.']].forEach(v => add.run(...v as [string,string,string,string,number,number,number,string,string]));
  }
}
