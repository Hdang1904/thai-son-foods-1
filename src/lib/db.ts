import 'dotenv/config';
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
          process.env.POSTGRES_URL ||
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
        unit VARCHAR(50) DEFAULT 'chai',
        bottle_multiplier INTEGER NOT NULL DEFAULT 1 CHECK (bottle_multiplier > 0)
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
        product_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(255) DEFAULT '1 chai',
        thumbnail VARCHAR(500)
      );
    `);

    // Create admin users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'ADMIN',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create combos and combo items tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS combos (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(500) NOT NULL,
        name_en VARCHAR(500),
        description TEXT,
        description_en TEXT,
        original_price INTEGER NOT NULL,
        sale_price INTEGER NOT NULL,
        total_items INTEGER DEFAULT 10,
        discount INTEGER DEFAULT 0,
        image VARCHAR(500),
        is_featured BOOLEAN DEFAULT true,
        is_best_seller BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS combo_items (
        id VARCHAR(50) PRIMARY KEY,
        combo_id VARCHAR(50) REFERENCES combos(id) ON DELETE CASCADE,
        product_id VARCHAR(50),
        quantity INTEGER DEFAULT 1,
        unit VARCHAR(50) DEFAULT 'chai'
      );
    `);

    // Create customer users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        province VARCHAR(100),
        district VARCHAR(100),
        ward VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure orders table has user_id column
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
    `);

    // Ensure users table supports OAuth provider info and active status
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    `);

    // Ensure products table has stock_quantity
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;
      ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS bottle_multiplier INTEGER NOT NULL DEFAULT 1;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_bottle_multiplier'
        ) THEN
          ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_bottle_multiplier CHECK (bottle_multiplier > 0);
        END IF;
      END $$;
    `);

    // Create store inventory table
    await client.query(`
      CREATE TABLE IF NOT EXISTS store_inventory (
        id VARCHAR(50) PRIMARY KEY,
        store_code VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        stock_quantity INTEGER NOT NULL DEFAULT 100,
        reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
        safety_stock INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100),
        UNIQUE(store_code, product_id)
      );
      ALTER TABLE store_inventory ADD COLUMN IF NOT EXISTS reserved INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE store_inventory ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 0;
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_inventory_reserved'
        ) THEN
          ALTER TABLE store_inventory ADD CONSTRAINT chk_store_inventory_reserved CHECK (reserved >= 0);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_store_inventory_stock_quantity'
        ) THEN
          ALTER TABLE store_inventory ADD CONSTRAINT chk_store_inventory_stock_quantity CHECK (stock_quantity >= 0);
        END IF;
      END $$;
    `);

    // Add combo_snapshot to order_items
    await client.query(`
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS combo_snapshot JSONB;
    `);

    // Create stock reservations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_reservations (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        store_code VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        released_at TIMESTAMP WITH TIME ZONE
      );
      CREATE INDEX IF NOT EXISTS idx_stock_res_order ON stock_reservations(order_id);
      CREATE INDEX IF NOT EXISTS idx_stock_res_status ON stock_reservations(status);
      CREATE INDEX IF NOT EXISTS idx_stock_res_expires ON stock_reservations(expires_at);
      CREATE INDEX IF NOT EXISTS idx_stock_res_store_prod ON stock_reservations(store_code, product_id);
    `);

    // Create stores table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        province VARCHAR(100) DEFAULT 'Hồ Chí Minh',
        district VARCHAR(100),
        ward VARCHAR(100),
        map_url VARCHAR(500),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        region VARCHAR(50),
        group_code VARCHAR(50),
        status INTEGER DEFAULT 1,
        notes TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_code VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_deducted BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_resolved_count INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_total_count INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_reconciled BOOLEAN DEFAULT false;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_collected_amount INTEGER DEFAULT 0;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_reconciled_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cod_reconciled_by VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_disposition VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS return_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS canonical_product_id VARCHAR(255);
      ALTER TABLE order_items ALTER COLUMN canonical_product_id TYPE VARCHAR(255);
      ALTER TABLE order_items ALTER COLUMN product_id TYPE VARCHAR(255);
      ALTER TABLE order_items ALTER COLUMN unit TYPE VARCHAR(255);
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS bottle_multiplier INTEGER DEFAULT 1;
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_bottles INTEGER DEFAULT 0;
    `);

    // Add new columns to stores if table already exists
    await client.query(`
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS region VARCHAR(50);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS group_code VARCHAR(50);
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS status INTEGER DEFAULT 1;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS notes TEXT;
    `);

    // Create image management tables (product_images, combo_images, banners, brand_slides)
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id VARCHAR(50) PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        alt VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        image_type VARCHAR(50) DEFAULT 'gallery',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_product_images_prod ON product_images(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order ASC);

      CREATE TABLE IF NOT EXISTS combo_images (
        id VARCHAR(50) PRIMARY KEY,
        combo_id VARCHAR(50) NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
        url VARCHAR(500) NOT NULL,
        alt VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        image_type VARCHAR(50) DEFAULT 'gallery',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_combo_images_combo ON combo_images(combo_id);
      CREATE INDEX IF NOT EXISTS idx_combo_images_sort ON combo_images(combo_id, sort_order ASC);

      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        title VARCHAR(255),
        subtitle TEXT,
        tag VARCHAR(100),
        image VARCHAR(500) NOT NULL,
        mobile_image VARCHAR(500),
        alt VARCHAR(255),
        link VARCHAR(255),
        placement VARCHAR(50) DEFAULT 'hero',
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_banners_placement ON banners(placement, sort_order ASC);

      CREATE TABLE IF NOT EXISTS brand_slides (
        id VARCHAR(50) PRIMARY KEY,
        tag VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        image VARCHAR(500) NOT NULL,
        cta_text VARCHAR(100) DEFAULT 'Khám phá Thái Sơn',
        cta_link VARCHAR(255) DEFAULT '/#san-pham',
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_brand_slides_sort ON brand_slides(sort_order ASC);
    `);

    // RBAC & Audit logs schema
    await client.query(`
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS store_code VARCHAR(50);
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_users_store_code'
        ) THEN
          ALTER TABLE admin_users
            ADD CONSTRAINT fk_admin_users_store_code
            FOREIGN KEY (store_code) REFERENCES stores(code)
            ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_admin_users_role'
        ) THEN
          ALTER TABLE admin_users
            ADD CONSTRAINT chk_admin_users_role
            CHECK (role IN ('SUPER_ADMIN', 'MARKETING', 'STORE_STAFF'));
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        admin_id VARCHAR(50),
        admin_username VARCHAR(100),
        role VARCHAR(50),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id VARCHAR(100),
        store_code VARCHAR(50),
        before_json JSONB,
        after_json JSONB,
        ip VARCHAR(100),
        user_agent TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_username ON audit_logs(admin_username);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_store_code ON audit_logs(store_code);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

      -- Phase 4: Cost price and profit reporting
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
      ALTER TABLE combos ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
      ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cost_price INTEGER;
    `);

    console.log('Database tables verified/created successfully!');
  } finally {
    client.release();
  }
}
