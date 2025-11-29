-- SAMPLE DATA FOR PURCHASES SERVICE

INSERT INTO suppliers (name, ruc, contact, phone, email) VALUES
('Outdoor Peru S.A.C.', '20123456789', 'Juan Perez', '987654321', 'ventas@outdoorperu.com'),
('Importaciones Andinas', '20987654321', 'Maria Lopez', '912345678', 'contacto@andinas.com'),
('Equipamiento Total', '20555666777', 'Pedro Gomez', '955444333', 'ventas@eqtotal.com')
ON CONFLICT DO NOTHING;

INSERT INTO supplier_products (supplierid, productid, productname, price, stock) VALUES
(1, 1, 'Carpa 4 Personas', 175.00, 50),
(1, 2, 'Saco de Dormir', 75.00, 25),
(1, 3, 'Linterna LED', 22.00, 100),
(2, 1, 'Carpa 4 Personas', 170.00, 10),
(2, 4, 'Mochila Trekking', 115.00, 20),
(2, 5, 'Botas Trekking', 195.00, 15),
(3, 2, 'Saco de Dormir', 78.00, 30),
(3, 3, 'Linterna LED', 20.00, 100),
(3, 6, 'Casaca Térmica', 240.00, 15)
ON CONFLICT DO NOTHING;

INSERT INTO purchases (supplierid, suppliername, total, date, invoicenumber, status, estimateddelivery) VALUES
(1, 'Outdoor Peru S.A.C.', 1750.00, NOW() - INTERVAL '5 days', 'INV-001', 'Confirmed', CURRENT_DATE + INTERVAL '3 days'),
(2, 'Importaciones Andinas', 2300.00, NOW() - INTERVAL '2 days', 'INV-002', 'Pending', CURRENT_DATE + INTERVAL '7 days')
ON CONFLICT DO NOTHING;

INSERT INTO purchase_items (purchaseid, productid, productname, quantity, cost) VALUES
(1, 1, 'Carpa 4 Personas', 10, 175.00),
(2, 4, 'Mochila Trekking', 20, 115.00)
ON CONFLICT DO NOTHING;
