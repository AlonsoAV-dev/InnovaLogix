-- POS SERVICE DATABASE SCHEMA

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2),
    items INTEGER,
    paymentMethod VARCHAR(50), -- 'Efectivo', 'Tarjeta', 'Yape', 'Plin'
    receiptType VARCHAR(50), -- 'Boleta', 'Factura', 'Nota de Venta'
    receiptNumber VARCHAR(100),
    clientName VARCHAR(255),
    clientDoc VARCHAR(100),
    clientAddress TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    saleId INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    productId INTEGER,
    productName VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(paymentMethod);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(saleId);
