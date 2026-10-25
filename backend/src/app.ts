import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Db } from './db.js';

export type Claims = {
  sub: string;
  role: 'user' | 'admin';
  email: string;
};

export type AuthedRequest = Request & {
  user?: Claims;
};

const secret = () => process.env.JWT_SECRET ?? 'development-only-secret-change-me';

/**
 * Maps database vehicle row to camelCase frontend API contract.
 */
export const mapVehicle = (v: any) =>
  v && {
    id: v.id,
    make: v.make,
    model: v.model,
    category: v.category,
    price: v.price,
    quantity: v.quantity,
    year: v.year,
    kmsDriven: v.kms_driven,
    fuelType: v.fuel_type,
    city: v.city,
    imageUrl: v.image_url,
    description: v.description,
    createdAt: v.created_at
  };

export function createApp(db: Db) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // JWT Authentication middleware
  const auth = (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      req.user = jwt.verify(token, secret()) as Claims;
      next();
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };

  // Role-based authorization middleware
  const admin = (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Administrator access required' });
    }
    next();
  };

  const issueToken = (u: { id: string; role: string; email: string }) =>
    jwt.sign({ sub: u.id, role: u.role, email: u.email }, secret(), { expiresIn: '8h' });

  // Health check endpoint
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // ==================== AUTHENTICATION ====================

  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !/^\S+@\S+\.\S+$/.test(email ?? '') || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        message: 'Name, valid email, and password of at least 8 characters are required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalizedEmail)) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = {
      id: randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      role: 'user' as const
    };

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, await bcrypt.hash(password, 10), user.role);

    res.status(201).json({
      user,
      token: issueToken(user)
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const email = (req.body.email ?? '').toLowerCase().trim();
    const password = req.body.password ?? '';

    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      user: payload,
      token: issueToken(payload)
    });
  });

  // ==================== VEHICLE INVENTORY ====================

  // Protected: view all vehicles
  app.get('/api/vehicles', auth, (_req, res) => {
    const rows = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
    res.json({ data: rows.map(mapVehicle) });
  });

  // Protected: search and filter vehicles with rich query parameters
  app.get('/api/vehicles/search', auth, (req, res) => {
    const q = String(req.query.q ?? '').trim();
    const brand = String(req.query.brand ?? req.query.make ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const fuel = String(req.query.fuel ?? req.query.fuelType ?? '').trim();
    const minPrice = Number(req.query.minPrice ?? 0);
    const maxPrice = Number(req.query.maxPrice ?? Number.MAX_SAFE_INTEGER);
    const minYear = Number(req.query.minYear ?? 0);
    const maxYear = Number(req.query.maxYear ?? 9999);
    const maxKm = Number(req.query.maxKm ?? Number.MAX_SAFE_INTEGER);
    const sortBy = String(req.query.sortBy ?? 'price_asc');

    let orderClause = 'ORDER BY price ASC';
    if (sortBy === 'price_desc') {
      orderClause = 'ORDER BY price DESC';
    } else if (sortBy === 'year_desc') {
      orderClause = 'ORDER BY year DESC, price ASC';
    } else if (sortBy === 'kms_asc') {
      orderClause = 'ORDER BY kms_driven ASC, price ASC';
    }

    const rows = db.prepare(`
      SELECT * FROM vehicles
      WHERE (make LIKE ? OR model LIKE ? OR category LIKE ? OR city LIKE ?)
        AND make LIKE ?
        AND category LIKE ?
        AND fuel_type LIKE ?
        AND price BETWEEN ? AND ?
        AND (year IS NULL OR year BETWEEN ? AND ?)
        AND kms_driven <= ?
      ${orderClause}
    `).all(
      `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`,
      brand ? `%${brand}%` : '%',
      category ? `%${category}%` : '%',
      fuel ? `%${fuel}%` : '%',
      minPrice, maxPrice,
      minYear, maxYear,
      maxKm
    );

    res.json({ data: rows.map(mapVehicle) });
  });

  // Protected & Admin-only: add new vehicle with complete showroom specs
  app.post('/api/vehicles', auth, admin, (req, res) => {
    const b = req.body;
    if (
      !b.make ||
      !b.model ||
      !b.category ||
      !Number.isFinite(b.price) ||
      b.price <= 0 ||
      !Number.isInteger(b.quantity) ||
      b.quantity < 0
    ) {
      return res.status(400).json({
        message: 'Valid make, model, category, positive price, and non-negative integer quantity are required'
      });
    }

    const id = randomUUID();
    db.prepare(`
      INSERT INTO vehicles (id, make, model, category, price, quantity, year, kms_driven, fuel_type, city, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      b.make.trim(),
      b.model.trim(),
      b.category.trim(),
      Math.round(b.price),
      b.quantity,
      b.year ? Math.round(b.year) : null,
      b.kmsDriven !== undefined ? Math.round(b.kmsDriven) : (b.kms_driven !== undefined ? Math.round(b.kms_driven) : 0),
      b.fuelType?.trim() ?? b.fuel_type?.trim() ?? 'Petrol',
      b.city?.trim() ?? null,
      b.imageUrl?.trim() ?? b.image_url?.trim() ?? null,
      b.description?.trim() ?? null
    );

    const created = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.status(201).json({ data: mapVehicle(created) });
  });

  // Protected & Admin-only: update vehicle details
  app.put('/api/vehicles/:id', auth, admin, (req, res) => {
    const old: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    if (!old) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const b = req.body;
    if (
      (b.price !== undefined && (!Number.isFinite(b.price) || b.price <= 0)) ||
      (b.quantity !== undefined && (!Number.isInteger(b.quantity) || b.quantity < 0)) ||
      (b.kmsDriven !== undefined && (!Number.isFinite(b.kmsDriven) || b.kmsDriven < 0)) ||
      (b.kms_driven !== undefined && (!Number.isFinite(b.kms_driven) || b.kms_driven < 0))
    ) {
      return res.status(400).json({ message: 'Invalid vehicle fields' });
    }

    const make = b.make !== undefined ? b.make.trim() : old.make;
    const model = b.model !== undefined ? b.model.trim() : old.model;
    const category = b.category !== undefined ? b.category.trim() : old.category;
    const price = b.price !== undefined ? Math.round(b.price) : old.price;
    const quantity = b.quantity !== undefined ? b.quantity : old.quantity;
    const year = b.year !== undefined ? Math.round(b.year) : old.year;
    const kms = b.kmsDriven !== undefined ? Math.round(b.kmsDriven) : (b.kms_driven !== undefined ? Math.round(b.kms_driven) : old.kms_driven);
    const fuel = b.fuelType?.trim() ?? b.fuel_type?.trim() ?? old.fuel_type;
    const city = b.city !== undefined ? b.city?.trim() : old.city;
    const imageUrl = b.imageUrl !== undefined ? b.imageUrl?.trim() : (b.image_url !== undefined ? b.image_url?.trim() : old.image_url);
    const description = b.description !== undefined ? b.description?.trim() : old.description;

    db.prepare(`
      UPDATE vehicles
      SET make = ?, model = ?, category = ?, price = ?, quantity = ?, year = ?, kms_driven = ?, fuel_type = ?, city = ?, image_url = ?, description = ?
      WHERE id = ?
    `).run(make, model, category, price, quantity, year, kms, fuel, city, imageUrl, description, old.id);

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(old.id);
    res.json({ data: mapVehicle(updated) });
  });

  // Protected & Admin-only: delete vehicle
  app.delete('/api/vehicles/:id', auth, admin, (req, res) => {
    const result = db.prepare('DELETE FROM vehicles WHERE id = ?').run(req.params.id);
    if (!result.changes) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted' });
  });

  // Protected & Admin-only: restock vehicle
  app.post('/api/vehicles/:id/restock', auth, admin, (req, res) => {
    const quantityToAdd = req.body.quantity;
    if (!Number.isInteger(quantityToAdd) || quantityToAdd <= 0) {
      return res.status(400).json({ message: 'Restock quantity must be a positive integer' });
    }

    const result = db.prepare('UPDATE vehicles SET quantity = quantity + ? WHERE id = ?').run(
      quantityToAdd,
      req.params.id
    );

    if (!result.changes) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
    res.json({ data: mapVehicle(updated) });
  });

  // ==================== PURCHASING & TRANSACTIONS ====================

  // Protected: Atomic purchase transaction preventing overselling
  app.post('/api/vehicles/:id/purchase', auth, (req: AuthedRequest, res) => {
    const purchase = db.transaction(() => {
      const updateResult = db
        .prepare('UPDATE vehicles SET quantity = quantity - 1 WHERE id = ? AND quantity > 0')
        .run(req.params.id);

      if (!updateResult.changes) {
        return null;
      }

      const vehicle: any = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
      db.prepare(`
        INSERT INTO purchases (id, user_id, vehicle_id, price)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), req.user!.sub, vehicle.id, vehicle.price);

      return vehicle;
    })();

    if (!purchase) {
      return res.status(409).json({ message: 'Vehicle is unavailable' });
    }

    res.json({
      message: 'Purchase confirmed',
      data: mapVehicle(purchase)
    });
  });

  // Protected: customer purchase history
  app.get('/api/purchases/me', auth, (req: AuthedRequest, res) => {
    const rows = db.prepare(`
      SELECT p.id, p.purchased_at, p.price, v.make, v.model, v.category, v.fuel_type AS fuelType, v.city, v.image_url AS imageUrl
      FROM purchases p
      LEFT JOIN vehicles v ON v.id = p.vehicle_id
      WHERE p.user_id = ?
      ORDER BY p.purchased_at DESC
    `).all(req.user!.sub);

    res.json({ data: rows });
  });

  // Protected: client-side sync fallback
  app.post('/api/purchases/sync', auth, (_req, res) => {
    res.json({ success: true });
  });

  // Protected: Operational health dashboard
  app.get('/api/dashboard', auth, admin, (_req, res) => {
    const totals: any = db.prepare(`
      SELECT
        COUNT(*) AS models,
        COALESCE(SUM(quantity), 0) AS units,
        COALESCE(SUM(price * quantity), 0) AS value,
        COALESCE(SUM(CASE WHEN quantity BETWEEN 1 AND 2 THEN 1 ELSE 0 END), 0) AS lowStock,
        COALESCE(SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END), 0) AS soldOut
      FROM vehicles
    `).get();

    res.json({ data: totals });
  });

  return app;
}
