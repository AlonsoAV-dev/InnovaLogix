-- Setup Reports Database with Foreign Data Wrappers to access other databases
-- This allows the reports service to query data from pos_db, inventory_db, and crm_db

-- Connect to reports_db
\c reports_db;

-- Install postgres_fdw extension if not exists
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign servers for each microservice database
DROP SERVER IF EXISTS pos_server CASCADE;
CREATE SERVER pos_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'localhost', port '5432', dbname 'pos_db');

DROP SERVER IF EXISTS inventory_server CASCADE;
CREATE SERVER inventory_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'localhost', port '5432', dbname 'inventory_db');

DROP SERVER IF EXISTS crm_server CASCADE;
CREATE SERVER crm_server
    FOREIGN DATA WRAPPER postgres_fdw
    OPTIONS (host 'localhost', port '5432', dbname 'crm_db');

-- Create user mappings
CREATE USER MAPPING IF NOT EXISTS FOR postgres
    SERVER pos_server
    OPTIONS (user 'postgres', password 'admin123');

CREATE USER MAPPING IF NOT EXISTS FOR postgres
    SERVER inventory_server
    OPTIONS (user 'postgres', password 'admin123');

CREATE USER MAPPING IF NOT EXISTS FOR postgres
    SERVER crm_server
    OPTIONS (user 'postgres', password 'admin123');

-- Import foreign schemas
DROP SCHEMA IF EXISTS pos_data CASCADE;
CREATE SCHEMA pos_data;
IMPORT FOREIGN SCHEMA public
    FROM SERVER pos_server
    INTO pos_data;

DROP SCHEMA IF EXISTS inventory_data CASCADE;
CREATE SCHEMA inventory_data;
IMPORT FOREIGN SCHEMA public
    FROM SERVER inventory_server
    INTO inventory_data;

DROP SCHEMA IF EXISTS crm_data CASCADE;
CREATE SCHEMA crm_data;
IMPORT FOREIGN SCHEMA public
    FROM SERVER crm_server
    INTO crm_data;

-- Create views in public schema for easy access
CREATE OR REPLACE VIEW sales AS SELECT * FROM pos_data.sales;
CREATE OR REPLACE VIEW customers AS SELECT * FROM crm_data.customers;

-- Create products view with proper column names
CREATE OR REPLACE VIEW products AS 
    SELECT 
        id,
        name,
        category,
        price,
        cost,
        stock,
        minstock,
        image,
        createdat as created_at,
        updatedat as updated_at
    FROM inventory_data.products;

SELECT 'Reports database setup complete!' as status;
