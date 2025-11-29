-- ================================================
-- INVENTORY SERVICE DATABASE SCHEMA
-- ================================================

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    minstock INTEGER NOT NULL DEFAULT 5,
    category VARCHAR(100),
    image TEXT,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table (Kardex)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    productid INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN'
    quantity INTEGER NOT NULL,
    previousstock INTEGER NOT NULL,
    newstock INTEGER NOT NULL,
    reference VARCHAR(255), -- Sale ID, Purchase ID, etc.
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(productid);
CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON inventory_movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(type);
