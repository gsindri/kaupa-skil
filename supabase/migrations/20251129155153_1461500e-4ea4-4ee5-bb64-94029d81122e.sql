-- Enable realtime for cart-related tables
-- This allows clients to receive real-time updates when cart data changes

-- Enable replica identity for orders table to capture full row data
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Enable replica identity for order_lines table to capture full row data
ALTER TABLE order_lines REPLICA IDENTITY FULL;

-- Add tables to supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_lines;

-- Comment explaining the realtime setup
COMMENT ON TABLE orders IS 'Real-time enabled for cross-device cart synchronization';
COMMENT ON TABLE order_lines IS 'Real-time enabled for cross-device cart synchronization';