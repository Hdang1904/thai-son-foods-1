import { Pool } from 'pg';

export const pool = new Pool(
  process.env.DB_PASSWORD
    ? {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'WebTSF',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      }
    : {
        connectionString:
          process.env.DATABASE_URL ||
          'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF?sslmode=disable',
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 3000,
      }
);

export async function query(text: string, params?: any[]) {
  return pool.query(text, params);
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(50),
        short_description TEXT,
        description TEXT,
        price INTEGER NOT NULL,
        unit VARCHAR(50) DEFAULT '1 chai',
        thumbnail VARCHAR(500) NOT NULL,
        category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
        is_featured BOOLEAN DEFAULT false,
        is_new BOOLEAN DEFAULT false,
        is_best_seller BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create product variants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id VARCHAR(50) PRIMARY KEY,
        product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        quantity INTEGER DEFAULT 1,
        price INTEGER NOT NULL,
        unit VARCHAR(50) DEFAULT 'chai'
      );
    `);

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        order_code VARCHAR(50) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        province VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        ward VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        note TEXT,
        payment_method VARCHAR(50) DEFAULT 'cod',
        shipping_fee INTEGER DEFAULT 0,
        subtotal INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(50) PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(50),
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(50) DEFAULT '1 chai',
        thumbnail VARCHAR(500)
      );
    `);

    console.log('Database tables verified/created successfully!');
  } finally {
    client.release();
  }
}
