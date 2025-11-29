-- POS SERVICE DATABASE SCHEMA

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2),
    items INTEGER,
    paymentmethod VARCHAR(50), -- 'Efectivo', 'Tarjeta', 'Yape', 'Plin'
    receipttype VARCHAR(50), -- 'Boleta', 'Factura', 'Nota de Venta'
    receiptnumber VARCHAR(100),
    clientname VARCHAR(255),
    clientdoc VARCHAR(100),
    clientaddress TEXT
);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    saleid INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    productid INTEGER,
    productname VARCHAR(255),
    quantity INTEGER,
    price DECIMAL(10, 2)
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_payment ON sales(paymentmethod);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(saleid);
