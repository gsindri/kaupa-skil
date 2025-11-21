-- Add missing DELETE policy for order_lines
-- This allows users to delete order lines from their tenant's orders
CREATE POLICY "Users can delete order lines for accessible orders"
ON public.order_lines
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM orders o
    JOIN memberships m ON m.tenant_id = o.tenant_id
    WHERE o.id = order_lines.order_id
    AND m.user_id = auth.uid()
  )
);