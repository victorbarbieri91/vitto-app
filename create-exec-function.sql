-- Create a function to execute SQL dynamically
CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE query;
    RETURN 'SUCCESS';
EXCEPTION
    WHEN others THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$;