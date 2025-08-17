
-- Ensure supplier_items table has the correct schema for the ingest_har function
-- Check if we need to add any missing columns or update existing ones

-- Add any missing columns to supplier_items if they don't exist
DO $$ 
BEGIN
    -- Check and add ext_sku if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'ext_sku') THEN
        ALTER TABLE supplier_items ADD COLUMN ext_sku TEXT;
    END IF;
    
    -- Check and add display_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'display_name') THEN
        ALTER TABLE supplier_items ADD COLUMN display_name TEXT;
    END IF;
    
    -- Check and add brand if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'brand') THEN
        ALTER TABLE supplier_items ADD COLUMN brand TEXT;
    END IF;
    
    -- Check and add pack_qty if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'pack_qty') THEN
        ALTER TABLE supplier_items ADD COLUMN pack_qty DECIMAL DEFAULT 1;
    END IF;
    
    -- Check and add pack_unit_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'pack_unit_id') THEN
        ALTER TABLE supplier_items ADD COLUMN pack_unit_id TEXT DEFAULT 'each';
    END IF;
    
    -- Check and add vat_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'vat_code') THEN
        ALTER TABLE supplier_items ADD COLUMN vat_code INTEGER DEFAULT 24;
    END IF;
    
    -- Check and add last_seen_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'supplier_items' AND column_name = 'last_seen_at') THEN
        ALTER TABLE supplier_items ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Ensure price_quotes table has the correct schema
DO $$ 
BEGIN
    -- Check and add supplier_item_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'supplier_item_id') THEN
        ALTER TABLE price_quotes ADD COLUMN supplier_item_id UUID REFERENCES supplier_items(id);
    END IF;
    
    -- Check and add observed_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'observed_at') THEN
        ALTER TABLE price_quotes ADD COLUMN observed_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    -- Check and add pack_price if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'pack_price') THEN
        ALTER TABLE price_quotes ADD COLUMN pack_price DECIMAL DEFAULT 0;
    END IF;
    
    -- Check and add currency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'currency') THEN
        ALTER TABLE price_quotes ADD COLUMN currency TEXT DEFAULT 'ISK';
    END IF;
    
    -- Check and add vat_code if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'vat_code') THEN
        ALTER TABLE price_quotes ADD COLUMN vat_code TEXT DEFAULT '24';
    END IF;
    
    -- Check and add unit_price_ex_vat if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'unit_price_ex_vat') THEN
        ALTER TABLE price_quotes ADD COLUMN unit_price_ex_vat DECIMAL;
    END IF;
    
    -- Check and add unit_price_inc_vat if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'unit_price_inc_vat') THEN
        ALTER TABLE price_quotes ADD COLUMN unit_price_inc_vat DECIMAL;
    END IF;
    
    -- Check and add source if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'price_quotes' AND column_name = 'source') THEN
        ALTER TABLE price_quotes ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;
END $$;

-- Create unique constraint on supplier_items for supplier_id + ext_sku if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'supplier_items_supplier_id_ext_sku_key') THEN
        ALTER TABLE supplier_items ADD CONSTRAINT supplier_items_supplier_id_ext_sku_key UNIQUE (supplier_id, ext_sku);
    END IF;
END $$;
