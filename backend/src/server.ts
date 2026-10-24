import 'dotenv/config'; import { createApp } from './app.js'; import { openDb, seed } from './db.js';
const db=openDb(); await seed(db); createApp(db).listen(process.env.PORT ?? 4000, () => console.log('Apex Motors API running on port 4000'));
