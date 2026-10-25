import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Types
type Claims = {
  sub: string;
  role: 'user' | 'admin';
  email: string;
};

type AuthedRequest = Request & {
  user?: Claims;
};

const secret = () => process.env.JWT_SECRET ?? 'development-only-secret-change-me';

const mapVehicle = (v: any) =>
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

// Seed Data
const initialUsers: any[] = [
  {
    id: 'admin-001',
    name: 'Apex Administrator',
    email: 'admin@apexmotors.test',
    password_hash: bcrypt.hashSync('Admin123!', 10),
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: 'user-001',
    name: 'Mira Nair',
    email: 'customer@apexmotors.test',
    password_hash: bcrypt.hashSync('Customer123!', 10),
    role: 'user',
    created_at: new Date().toISOString()
  }
];

const initialVehicles: any[] = [
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
    description: 'Connected electric compact SUV with signature teal exterior, fast-charging support, and confident city range.',
    created_at: '2025-01-01T00:00:00.000Z'
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
    description: 'Spacious flagship SUV with advanced driver assistance, panoramic Skyroof, and commanding road presence.',
    created_at: '2025-01-02T00:00:00.000Z'
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
    description: 'Refined turbo sedan with parametric design and horizon LED lightbar. Certified pre-owned allocation arriving soon.',
    created_at: '2025-01-03T00:00:00.000Z'
  }
];

const users: any[] = [...initialUsers];
const vehicles: any[] = [...initialVehicles];
const purchases: any[] = [];

// Persistent storage in serverless container /tmp directory
const STORE_FILE = path.join('/tmp', 'apex-store.json');

function saveStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify({ users, vehicles, purchases }), 'utf8');
  } catch {}
}

function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
      if (Array.isArray(data.users) && data.users.length > 0) {
        users.length = 0;
        users.push(...data.users);
      }
      if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
        vehicles.length = 0;
        vehicles.push(...data.vehicles);
      }
      if (Array.isArray(data.purchases)) {
        purchases.length = 0;
        purchases.push(...data.purchases);
      }
    }
  } catch {}
}

loadStore();

// Initialize Express App
const app = express();
app.use(cors());
app.use(express.json());

// Normalise /api prefix if stripped by Vercel rewrite
app.use((req: Request, _res: Response, next: NextFunction) => {
  loadStore();
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

// JWT Middleware
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

// Admin Authorization Middleware
const admin = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access required' });
  }
  next();
};

const issueToken = (u: { id: string; role: string; email: string }) =>
  jwt.sign({ sub: u.id, role: u.role, email: u.email }, secret(), { expiresIn: '8h' });

// Health Check
app.get('/api/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

// Auth: Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email ?? '') || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      message: 'Name, valid email, and password of at least 8 characters are required'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    role: 'user' as const,
    password_hash: await bcrypt.hash(password, 10),
    created_at: new Date().toISOString()
  };

  users.push(user);
  saveStore();

  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.status(201).json({
    user: payload,
    token: issueToken(payload)
  });
});

// Auth: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const email = (req.body.email ?? '').toLowerCase().trim();
  const password = req.body.password ?? '';

  const user = users.find(u => u.email.toLowerCase() === email);
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

// Vehicles: List All
app.get('/api/vehicles', auth, (_req: Request, res: Response) => {
  const sorted = [...vehicles].sort((a, b) => b.created_at.localeCompare(a.created_at));
  res.json({ data: sorted.map(mapVehicle) });
});

// Vehicles: Search & Filter
app.get('/api/vehicles/search', auth, (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const brand = String(req.query.brand ?? req.query.make ?? '').trim().toLowerCase();
  const category = String(req.query.category ?? '').trim().toLowerCase();
  const fuel = String(req.query.fuel ?? req.query.fuelType ?? '').trim().toLowerCase();
  const minPrice = Number(req.query.minPrice ?? 0);
  const maxPrice = Number(req.query.maxPrice ?? Number.MAX_SAFE_INTEGER);
  const minYear = Number(req.query.minYear ?? 0);
  const maxYear = Number(req.query.maxYear ?? 9999);
  const maxKm = Number(req.query.maxKm ?? Number.MAX_SAFE_INTEGER);
  const sortBy = String(req.query.sortBy ?? 'price_asc');

  let rows = vehicles.filter(v => {
    const matchQ = !q || (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      (v.city && v.city.toLowerCase().includes(q))
    );
    const matchBrand = !brand || v.make.toLowerCase().includes(brand);
    const matchCategory = !category || v.category.toLowerCase().includes(category);
    const matchFuel = !fuel || v.fuel_type.toLowerCase().includes(fuel);
    const matchPrice = v.price >= minPrice && v.price <= maxPrice;
    const matchYear = v.year === null || (v.year >= minYear && v.year <= maxYear);
    const matchKm = v.kms_driven <= maxKm;

    return matchQ && matchBrand && matchCategory && matchFuel && matchPrice && matchYear && matchKm;
  });

  if (sortBy === 'price_desc') {
    rows.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'year_desc') {
    rows.sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.price - b.price);
  } else if (sortBy === 'kms_asc') {
    rows.sort((a, b) => a.kms_driven - b.kms_driven || a.price - b.price);
  } else {
    rows.sort((a, b) => a.price - b.price);
  }

  res.json({ data: rows.map(mapVehicle) });
});

// Vehicles: Add (Admin)
app.post('/api/vehicles', auth, admin, (req: Request, res: Response) => {
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

  const newVehicle = {
    id: randomUUID(),
    make: b.make.trim(),
    model: b.model.trim(),
    category: b.category.trim(),
    price: Math.round(b.price),
    quantity: b.quantity,
    year: b.year ? Math.round(b.year) : null,
    kms_driven: b.kmsDriven !== undefined ? Math.round(b.kmsDriven) : (b.kms_driven !== undefined ? Math.round(b.kms_driven) : 0),
    fuel_type: b.fuelType?.trim() ?? b.fuel_type?.trim() ?? 'Petrol',
    city: b.city?.trim() ?? null,
    image_url: b.imageUrl?.trim() ?? b.image_url?.trim() ?? null,
    description: b.description?.trim() ?? null,
    created_at: new Date().toISOString()
  };

  vehicles.push(newVehicle);
  saveStore();
  res.status(201).json({ data: mapVehicle(newVehicle) });
});

// Vehicles: Update (Admin)
app.put('/api/vehicles/:id', auth, admin, (req: Request, res: Response) => {
  const old = vehicles.find(v => v.id === req.params.id);
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

  old.make = b.make !== undefined ? b.make.trim() : old.make;
  old.model = b.model !== undefined ? b.model.trim() : old.model;
  old.category = b.category !== undefined ? b.category.trim() : old.category;
  old.price = b.price !== undefined ? Math.round(b.price) : old.price;
  old.quantity = b.quantity !== undefined ? b.quantity : old.quantity;
  old.year = b.year !== undefined ? Math.round(b.year) : old.year;
  old.kms_driven = b.kmsDriven !== undefined ? Math.round(b.kmsDriven) : (b.kms_driven !== undefined ? Math.round(b.kms_driven) : old.kms_driven);
  old.fuel_type = b.fuelType?.trim() ?? b.fuel_type?.trim() ?? old.fuel_type;
  old.city = b.city !== undefined ? b.city?.trim() : old.city;
  old.image_url = b.imageUrl !== undefined ? b.imageUrl?.trim() : (b.image_url !== undefined ? b.image_url?.trim() : old.image_url);
  old.description = b.description !== undefined ? b.description?.trim() : old.description;

  saveStore();
  res.json({ data: mapVehicle(old) });
});

// Vehicles: Delete (Admin)
app.delete('/api/vehicles/:id', auth, admin, (req: Request, res: Response) => {
  const idx = vehicles.findIndex(v => v.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }
  vehicles.splice(idx, 1);
  saveStore();
  res.json({ message: 'Vehicle deleted' });
});

// Vehicles: Restock (Admin)
app.post('/api/vehicles/:id/restock', auth, admin, (req: Request, res: Response) => {
  const quantityToAdd = Number(req.body.quantity);
  if (!Number.isInteger(quantityToAdd) || quantityToAdd <= 0) {
    return res.status(400).json({ message: 'Restock quantity must be a positive integer' });
  }

  const v = vehicles.find(x => x.id === req.params.id);
  if (!v) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  v.quantity = Number(v.quantity) + quantityToAdd;
  saveStore();
  res.json({ data: mapVehicle(v) });
});

// Vehicles: Sync inventory updates
app.post('/api/vehicles/sync', auth, admin, (req: Request, res: Response) => {
  const incoming = req.body?.vehicles;
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      if (item && item.id) {
        const existing = vehicles.find(x => x.id === item.id);
        if (existing) {
          if (item.quantity !== undefined) existing.quantity = Number(item.quantity);
        } else {
          vehicles.push({
            id: item.id,
            make: item.make,
            model: item.model,
            category: item.category,
            price: Number(item.price),
            quantity: Number(item.quantity),
            year: item.year,
            kms_driven: item.kmsDriven ?? item.kms_driven ?? 0,
            fuel_type: item.fuelType ?? item.fuel_type ?? 'Petrol',
            city: item.city,
            image_url: item.imageUrl ?? item.image_url,
            description: item.description,
            created_at: item.createdAt ?? item.created_at ?? new Date().toISOString()
          });
        }
      }
    }
    saveStore();
  }
  res.json({ success: true, count: vehicles.length });
});

// Purchases: Atomic Purchase
app.post('/api/vehicles/:id/purchase', auth, (req: AuthedRequest, res: Response) => {
  const vehicle = vehicles.find(v => v.id === req.params.id);
  if (!vehicle || vehicle.quantity <= 0) {
    return res.status(409).json({ message: 'Vehicle is unavailable' });
  }

  vehicle.quantity -= 1;

  const purchaseRecord = {
    id: randomUUID(),
    user_id: req.user!.sub,
    vehicle_id: vehicle.id,
    price: vehicle.price,
    purchased_at: new Date().toISOString(),
    make: vehicle.make,
    model: vehicle.model,
    category: vehicle.category,
    fuelType: vehicle.fuel_type,
    city: vehicle.city,
    imageUrl: vehicle.image_url
  };

  purchases.push(purchaseRecord);
  saveStore();

  res.json({
    message: 'Purchase confirmed',
    data: mapVehicle(vehicle),
    purchase: {
      id: purchaseRecord.id,
      purchased_at: purchaseRecord.purchased_at,
      price: vehicle.price,
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      fuelType: vehicle.fuel_type,
      city: vehicle.city,
      imageUrl: vehicle.image_url
    }
  });
});

// Purchases: Customer Order History
app.get('/api/purchases/me', auth, (req: AuthedRequest, res: Response) => {
  const userPurchases = purchases
    .filter(p => p.user_id === req.user!.sub)
    .map(p => {
      const v = vehicles.find(x => x.id === p.vehicle_id);
      return {
        id: p.id,
        purchased_at: p.purchased_at,
        price: p.price,
        make: v?.make ?? p.make ?? 'Certified Model',
        model: v?.model ?? p.model ?? '',
        category: v?.category ?? p.category ?? 'Vehicle',
        fuelType: v?.fuel_type ?? p.fuelType ?? 'Petrol',
        city: v?.city ?? p.city ?? null,
        imageUrl: v?.image_url ?? p.imageUrl ?? null
      };
    })
    .sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));

  res.json({ data: userPurchases });
});

// Purchases: Sync client-side purchases across serverless instances
app.post('/api/purchases/sync', auth, (req: AuthedRequest, res: Response) => {
  const incoming = req.body?.purchases;
  if (Array.isArray(incoming)) {
    for (const item of incoming) {
      if (item && item.id && !purchases.some(p => p.id === item.id)) {
        purchases.push({
          id: item.id,
          user_id: req.user!.sub,
          vehicle_id: item.vehicleId || item.id,
          price: item.price || 0,
          purchased_at: item.purchased_at || new Date().toISOString(),
          make: item.make,
          model: item.model,
          category: item.category,
          fuelType: item.fuelType,
          city: item.city,
          imageUrl: item.imageUrl
        });
      }
    }
    saveStore();
  }
  res.json({ success: true, count: purchases.length });
});

// Dashboard: Operational Metrics (Admin)
app.get('/api/dashboard', auth, admin, (_req: Request, res: Response) => {
  const models = vehicles.length;
  const units = vehicles.reduce((sum, v) => sum + (v.quantity || 0), 0);
  const value = vehicles.reduce((sum, v) => sum + (v.price * v.quantity || 0), 0);
  const lowStock = vehicles.filter(v => v.quantity >= 1 && v.quantity <= 2).length;
  const soldOut = vehicles.filter(v => v.quantity === 0).length;

  res.json({
    data: { models, units, value, lowStock, soldOut }
  });
});

export default app;
