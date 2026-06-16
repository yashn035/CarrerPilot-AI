import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the server folder: server/src/infrastructure/db/paths.js -> go up 4 levels
export const SERVER_ROOT = path.resolve(__dirname, '..', '..', '..');
export const DATA_DIR = path.join(SERVER_ROOT, 'data');
export const DB_DIR = path.join(DATA_DIR, 'db');
export const DB_PATH = path.join(DATA_DIR, 'db.json');
export const PROBLEMS_BANK_PATH = path.join(DATA_DIR, 'problems_bank.json');
export const COMPANY_TRACKS_PATH = path.join(DATA_DIR, 'company_tracks.json');
