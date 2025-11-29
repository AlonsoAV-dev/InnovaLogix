-- PURCHASES SERVICE DATABASE SCHEMA

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    ruc VARCHAR(50),
    contact VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    supplierid INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    suppliername VARCHAR(255),
    total DECIMAL(10, 2),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoicenumber VARCHAR(100),
    status VARCHAR(50), -- 'Pendiente', 'Confirmed', 'Cancelado'
    estimateddelivery DATE,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchaseid INTEGER REFERENCES purchases(id) ON DELETE CASCADE,
    productid INTEGER,
    productname VARCHAR(255),
    quantity INTEGER,
    cost DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS supplier_products (
    id SERIAL PRIMARY KEY,
    supplierid INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    productid INTEGER,
    productname VARCHAR(255),
    price DECIMAL(10, 2),
    stock INTEGER,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplierid);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchaseid);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplierid);
