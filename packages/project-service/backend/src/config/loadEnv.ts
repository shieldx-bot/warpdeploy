import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for this file under ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Candidate .env locations in a monorepo
const candidates = [
  path.resolve(__dirname, '../../.env'), // backend/.env
  path.resolve(__dirname, '../../../.env'), // repo root .env
  path.resolve(process.cwd(), '.env'), // current working dir .env
];

let loaded = false;
for (const p of candidates) {
  try {
    if (fs.existsSync(p)) {
      const result = dotenv.config({ path: p });
      if (!result.error) {
        loaded = true;
        // eslint-disable-next-line no-console
        console.log(`[env] loaded ${p}`);
        break;
      }
    }
  } catch {
    // ignore and try next
  }
}

if (!loaded) {
  // eslint-disable-next-line no-console
  console.warn('[env] no .env file found in expected locations');
}
