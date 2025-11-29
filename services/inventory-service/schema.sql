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
    minStock INTEGER NOT NULL DEFAULT 5,
    category VARCHAR(100),
    image TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Movements Table (Kardex)
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    productId INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN'
    quantity INTEGER NOT NULL,
    previousStock INTEGER NOT NULL,
    newStock INTEGER NOT NULL,
    reference VARCHAR(255), -- Sale ID, Purchase ID, etc.
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(productId);
CREATE INDEX IF NOT EXISTS idx_movements_timestamp ON inventory_movements(timestamp);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(type);
