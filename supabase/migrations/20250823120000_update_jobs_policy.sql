-- Update jobs management policy to restrict to service role
DROP POLICY IF EXISTS "System can manage jobs" ON public.jobs;

CREATE POLICY "System can manage jobs" ON public.jobs
  TO service_role
  FOR INSERT, UPDATE, DELETE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
