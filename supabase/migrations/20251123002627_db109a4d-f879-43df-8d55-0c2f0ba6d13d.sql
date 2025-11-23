-- Phase 1: Add Data Integrity Constraints

-- 1. Prevent multiple draft orders per supplier per tenant
-- This ensures each tenant can only have ONE draft order per supplier at a time
CREATE UNIQUE INDEX idx_unique_draft_order 
ON public.orders (tenant_id, supplier_id) 
WHERE status = 'draft';

-- 2. Prevent duplicate products within the same order
-- This ensures each product can only appear once per order
ALTER TABLE public.order_lines
ADD CONSTRAINT unique_product_per_order 
UNIQUE (order_id, supplier_product_id);