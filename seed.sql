-- ================================================
-- INNOVALOGIX DATABASE SEED
-- ================================================

-- 1. PRODUCTS (Inventory Service)
INSERT INTO products (name, price, cost, stock, minstock, category, image) VALUES
('Carpa 4 Personas', 299.90, 180.00, 45, 10, 'Carpas', 'https://example.com/tent.jpg'),
('Mochila 60L Trekking', 199.90, 120.00, 124, 15, 'Mochilas', 'https://example.com/backpack.jpg'),
('Sleeping Bag -10°C', 299.90, 165.00, 65, 10, 'Sleeping Bags', 'https://example.com/sleeping.jpg'),
('Linterna LED 500lm', 75.00, 45.00, 203, 20, 'Linternas', 'https://example.com/flashlight.jpg'),
('Chaqueta Impermeable', 150.00, 90.00, 95, 15, 'Ropa Técnica', 'https://example.com/jacket.jpg'),
('Carpa 2 Personas', 199.90, 110.00, 2, 5, 'Carpas', 'https://example.com/tent2.jpg'), -- Low Stock
('Botas Trekking T42', 280.00, 160.00, 12, 8, 'Calzado', 'https://example.com/boots.jpg'),
('Gas Butano 230g', 25.00, 12.00, 4, 10, 'Accesorios', 'https://example.com/gas.jpg'); -- Critical Stock

-- 2. CUSTOMERS (CRM Service)
INSERT INTO customers (name, email, phone, type, points, totalPurchases) VALUES
('Juan Pérez', 'juan@example.com', '999888777', 'Frecuente', 150, 1200.50),
('María García', 'maria@example.com', '999111222', 'VIP', 500, 4500.00),
('Carlos López', 'carlos@example.com', '999333444', 'Nuevo', 20, 150.00),
('Ana Torres', 'ana@example.com', '999555666', 'Frecuente', 200, 1800.00),
('Empresa Turismo SAC', 'contacto@turismo.com', '999000000', 'Mayorista', 1000, 15000.00);

-- 3. SUPPLIERS (Purchases Service)
INSERT INTO suppliers (name, ruc, contact, phone, email) VALUES
('Outdoor Gear Peru', '20123456789', 'Roberto Gomez', '987654321', 'ventas@outdoorgear.pe'),
('Importaciones Andinas', '20987654321', 'Lucia Mendez', '912345678', 'contacto@andinas.pe'),
('Textiles del Sur', '20555555555', 'Pedro Castillo', '955555555', 'pedro@textiles.pe');

-- 4. SALES (POS Service)
-- Generar ventas pasadas para reportes
INSERT INTO sales (date, total, items, paymentmethod, receipttype, receiptnumber, clientname) VALUES
(NOW() - INTERVAL '1 day', 499.80, 2, 'Tarjeta', 'Boleta', 'B001-0001', 'Juan Pérez'),
(NOW() - INTERVAL '2 days', 75.00, 1, 'Efectivo', 'Boleta', 'B001-0002', 'Cliente General'),
(NOW() - INTERVAL '3 days', 1500.00, 5, 'Transferencia', 'Factura', 'F001-0001', 'Empresa Turismo SAC'),
(NOW() - INTERVAL '5 days', 299.90, 1, 'Yape', 'Boleta', 'B001-0003', 'Carlos López'),
(NOW() - INTERVAL '1 week', 899.70, 3, 'Tarjeta', 'Boleta', 'B001-0004', 'María García');

-- Sale Items
INSERT INTO sale_items (saleid, productid, productname, quantity, price) VALUES
(1, 1, 'Carpa 4 Personas', 1, 299.90),
(1, 2, 'Mochila 60L Trekking', 1, 199.90),
(2, 4, 'Linterna LED 500lm', 1, 75.00),
(3, 3, 'Sleeping Bag -10°C', 5, 299.90),
(4, 1, 'Carpa 4 Personas', 1, 299.90),
(5, 1, 'Carpa 4 Personas', 1, 299.90),
(5, 2, 'Mochila 60L Trekking', 2, 199.90);

-- 5. INVENTORY MOVEMENTS (Inventory Service)
INSERT INTO inventory_movements (productid, type, quantity, previousstock, newstock, reference, notes) VALUES
(1, 'PURCHASE', 50, 0, 50, 'OC-001', 'Stock inicial'),
(2, 'PURCHASE', 130, 0, 130, 'OC-001', 'Stock inicial'),
(1, 'SALE', 1, 50, 49, 'B001-0001', 'Venta mostrador'),
(2, 'SALE', 1, 130, 129, 'B001-0001', 'Venta mostrador'),
(4, 'SALE', 1, 204, 203, 'B001-0002', 'Venta mostrador');

-- 6. PURCHASES (Purchases Service)
INSERT INTO purchases (supplierid, suppliername, total, date, status, invoicenumber) VALUES
(1, 'Outdoor Gear Peru', 5000.00, NOW() - INTERVAL '1 month', 'Confirmed', 'F001-456'),
(2, 'Importaciones Andinas', 3200.00, NOW() - INTERVAL '2 weeks', 'Confirmed', 'F002-789');

-- 7. SURVEYS (CRM Service)
INSERT INTO surveys (customerId, rating, comment) VALUES
(1, 5, 'Excelente atención y productos de calidad'),
(2, 4, 'Buenos precios pero demoraron en atender'),
(4, 5, 'Me encanta la tienda');
