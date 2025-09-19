-- Test connection and create a simple table
CREATE TABLE IF NOT EXISTS test_table (
    id serial PRIMARY KEY,
    created_at timestamp DEFAULT now()
);

INSERT INTO test_table DEFAULT VALUES;

SELECT * FROM test_table;