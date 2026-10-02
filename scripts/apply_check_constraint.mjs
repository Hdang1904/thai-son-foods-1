import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable'
});

async function main() {
  await pool.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_product_variants_bottle_multiplier'
      ) THEN
        ALTER TABLE product_variants ADD CONSTRAINT chk_product_variants_bottle_multiplier CHECK (bottle_multiplier > 0);
      END IF;
    END $$;
  `);
  console.log('CHECK constraint chk_product_variants_bottle_multiplier verified on product_variants.');

  // Kiểm tra thông tin ràng buộc
  const res = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) as def
    FROM pg_constraint
    WHERE conrelid = 'product_variants'::regclass;
  `);
  console.log('Constraints on product_variants:', res.rows);
  await pool.end();
}

main().catch(console.error);
