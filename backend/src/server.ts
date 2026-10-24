import 'dotenv/config';
import { createApp } from './app.js';
import { openDb, seed } from './db.js';

const db = openDb();
await seed(db);

const PORT = process.env.PORT ?? 4000;
createApp(db).listen(PORT, () => {
  console.log(`Apex Motors API running on http://localhost:${PORT}`);
});
