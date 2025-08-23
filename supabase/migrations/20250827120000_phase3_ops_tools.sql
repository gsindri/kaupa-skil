-- Phase 3 operations tooling

-- 1. Ingestion feed stats table
CREATE TABLE public.ingestion_feed_stats (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_id UUID NOT NULL REFERENCES public.supplier_connector(connector_id) ON DELETE CASCADE,
    row_count INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ingestion alerts table
CREATE TABLE public.ingestion_alert (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connector_id UUID NOT NULL REFERENCES public.supplier_connector(connector_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Function to log row counts and alert on drop to zero
CREATE OR REPLACE FUNCTION public.log_ingestion_row_count(p_connector_id UUID, p_row_count INTEGER)
RETURNS void AS $$
DECLARE
    last_count INTEGER;
BEGIN
    SELECT row_count INTO last_count
    FROM public.ingestion_feed_stats
    WHERE connector_id = p_connector_id
    ORDER BY recorded_at DESC
    LIMIT 1;

    INSERT INTO public.ingestion_feed_stats(connector_id, row_count)
    VALUES (p_connector_id, p_row_count);

    IF p_row_count = 0 AND last_count IS NOT NULL AND last_count > 0 THEN
        INSERT INTO public.ingestion_alert(connector_id, message)
        VALUES (p_connector_id, 'feed row count dropped to zero');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
