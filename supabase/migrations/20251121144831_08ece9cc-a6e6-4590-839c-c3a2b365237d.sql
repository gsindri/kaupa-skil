-- Allow NULL prices in order_lines for items without pricing
-- This enables adding items to cart even when price data is unavailable

ALTER TABLE order_lines 
ALTER COLUMN unit_price_per_pack DROP NOT NULL;

ALTER TABLE order_lines 
ALTER COLUMN line_total DROP NOT NULL;