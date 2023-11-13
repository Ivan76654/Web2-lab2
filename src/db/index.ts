import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config = process.env.RENDER_DATABASE ? {
  connectionString: process.env.RENDER_DATABASE
} : {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

const pool = new Pool(config);

export default pool;
