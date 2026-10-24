import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { openDb, seed, Db } from '../src/db.js';

let db: Db;

const setup = async () => {
  const file = path.join('/tmp', `apex-${Date.now()}-${Math.random()}.db`);
  db = openDb(file);
  await seed(db);
  return createApp(db);
};

afterEach(() => {
  db?.close();
});

describe('authentication and access control', () => {
  it('registers a user and permits authenticated catalogue access', async () => {
    const app = await setup();
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira', email: 'mira@test.com', password: 'Password1' })
      .expect(201);

    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('user');

    const catalogueRes = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(200);

    expect(catalogueRes.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects duplicate email registrations', async () => {
    const app = await setup();
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira', email: 'mira@test.com', password: 'Password1' })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira 2', email: 'mira@test.com', password: 'Password1' })
      .expect(409);
  });

  it('rejects login with invalid credentials', async () => {
    const app = await setup();
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'WrongPassword!' })
      .expect(401);
  });

  it('blocks customers from adding vehicles', async () => {
    const app = await setup();
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira', email: 'mira@test.com', password: 'Password1' })
      .expect(201);

    await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .send({ make: 'BMW', model: 'M3', category: 'Sedan', price: 6500000, quantity: 1 })
      .expect(403);
  });

  it('blocks regular customers from internal health dashboard metrics', async () => {
    const app = await setup();
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Customer', email: 'customer@test.com', password: 'Password1' })
      .expect(201);

    await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .expect(403);
  });
});

describe('purchasing and inventory safety', () => {
  it('decrements stock atomically once and prevents overselling', async () => {
    const app = await setup();
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira', email: 'mira@test.com', password: 'Password1' })
      .expect(201);

    // Set stock to exactly 1
    db.prepare('UPDATE vehicles SET quantity = 1 WHERE id = ?').run('car-001');

    // First purchase succeeds
    await request(app)
      .post('/api/vehicles/car-001/purchase')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .expect(200);

    // Second purchase attempt immediately returns 409 conflict
    await request(app)
      .post('/api/vehicles/car-001/purchase')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .expect(409);

    const stock = (db.prepare('SELECT quantity FROM vehicles WHERE id = ?').get('car-001') as any).quantity;
    expect(stock).toBe(0);
  });

  it('records purchases in customer purchase history', async () => {
    const app = await setup();
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Mira', email: 'mira@test.com', password: 'Password1' })
      .expect(201);

    const auth = { Authorization: `Bearer ${userRes.body.token}` };

    await request(app)
      .post('/api/vehicles/car-001/purchase')
      .set(auth)
      .expect(200);

    const historyRes = await request(app)
      .get('/api/purchases/me')
      .set(auth)
      .expect(200);

    expect(historyRes.body.data).toHaveLength(1);
    expect(historyRes.body.data[0]).toMatchObject({
      make: 'Tata',
      model: 'Nexon EV'
    });
  });
});

describe('vehicle search and showroom filters', () => {
  it('filters the protected catalogue by make and category', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .get('/api/vehicles/search?q=nexon&category=Electric')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].make).toBe('Tata');
  });

  it('filters vehicles by fuel and maximum kilometres', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .get('/api/vehicles/search?fuel=Electric&maxKm=20000')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      fuelType: 'Electric',
      kmsDriven: 18400,
      city: 'Bengaluru'
    });
  });

  it('filters vehicles by budget and model year', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .get('/api/vehicles/search?maxPrice=1600000&minYear=2025')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].model).toBe('Nexon EV');
  });
});

describe('administrator controls and inventory management', () => {
  it('adds a new vehicle with complete showroom specifications', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        make: 'Audi',
        model: 'A4 Technology',
        category: 'Sedan',
        price: 4200000,
        quantity: 3,
        year: 2024,
        kmsDriven: 14200,
        fuelType: 'Petrol',
        city: 'Mumbai',
        imageUrl: '/images/audi-a4.jpg',
        description: 'Pristine luxury sedan with Matrix LED and Virtual Cockpit.'
      })
      .expect(201);

    expect(res.body.data).toMatchObject({
      make: 'Audi',
      model: 'A4 Technology',
      category: 'Sedan',
      price: 4200000,
      quantity: 3,
      kmsDriven: 14200,
      fuelType: 'Petrol',
      city: 'Mumbai'
    });
  });

  it('updates vehicle specifications including price, kilometres, and location', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .put('/api/vehicles/car-001')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ price: 1490000, city: 'Hyderabad', kmsDriven: 19500 })
      .expect(200);

    expect(res.body.data.price).toBe(1490000);
    expect(res.body.data.city).toBe('Hyderabad');
    expect(res.body.data.kmsDriven).toBe(19500);
  });

  it('restocks a vehicle and rejects invalid quantities', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const auth = { Authorization: `Bearer ${login.body.token}` };

    await request(app)
      .post('/api/vehicles/car-003/restock')
      .set(auth)
      .send({ quantity: 3 })
      .expect(200);

    expect((db.prepare('SELECT quantity FROM vehicles WHERE id = ?').get('car-003') as any).quantity).toBe(3);

    await request(app)
      .post('/api/vehicles/car-003/restock')
      .set(auth)
      .send({ quantity: 0 })
      .expect(400);

    await request(app)
      .post('/api/vehicles/car-003/restock')
      .set(auth)
      .send({ quantity: -2 })
      .expect(400);
  });

  it('deletes a vehicle for admin and blocks standard users', async () => {
    const app = await setup();
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@test.com', password: 'Password1' });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    // Non-admin cannot delete
    await request(app)
      .delete('/api/vehicles/car-002')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .expect(403);

    // Admin can delete
    await request(app)
      .delete('/api/vehicles/car-002')
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .expect(200);

    expect(db.prepare('SELECT id FROM vehicles WHERE id = ?').get('car-002')).toBeUndefined();
  });

  it('returns real stock-risk metrics for the admin dashboard', async () => {
    const app = await setup();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@apexmotors.test', password: 'Admin123!' });

    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${login.body.token}`)
      .expect(200);

    expect(res.body.data).toMatchObject({
      models: 3,
      units: 6,
      lowStock: 1,
      soldOut: 1
    });
    expect(res.body.data.value).toBeGreaterThan(0);
  });
});
