-- First create the function to derive availability status from Icelandic text
CREATE OR REPLACE FUNCTION public.derive_availability_status(availability_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
  IF availability_text IS NULL THEN
    RETURN 'UNKNOWN';
  END IF;
  
  -- Clean and normalize the text
  availability_text := lower(trim(regexp_replace(availability_text, '<[^>]*>', '', 'g')));
  availability_text := regexp_replace(availability_text, '\s+', ' ', 'g');
  
  -- Check for out of stock patterns
  IF availability_text LIKE '%ekki til%' OR 
     availability_text LIKE '%ekki á lager%' OR 
     availability_text LIKE '%útselt%' THEN
    RETURN 'OUT_OF_STOCK';
  END IF;
  
  -- Check for low stock patterns
  IF availability_text LIKE '%lítið%' OR 
     availability_text LIKE '%fátt%' THEN
    RETURN 'LOW_STOCK';
  END IF;
  
  -- Check for in stock patterns
  IF availability_text LIKE '%til á lager%' OR 
     availability_text LIKE '%á lager%' THEN
    RETURN 'IN_STOCK';
  END IF;
  
  RETURN 'UNKNOWN';
END;
$function$;