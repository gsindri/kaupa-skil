-- Allow anonymous users to select supplier products and suppliers
CREATE POLICY "Anon users can view supplier products" ON public.supplier_product FOR SELECT TO anon USING (true);
CREATE POLICY "Anon users can view suppliers" ON public.suppliers FOR SELECT TO anon USING (true);

