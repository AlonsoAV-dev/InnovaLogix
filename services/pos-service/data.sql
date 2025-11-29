-- SAMPLE DATA FOR POS SERVICE

INSERT INTO sales (date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc) VALUES
(NOW() - INTERVAL '1 day', 370.00, 2, 'Tarjeta', 'Boleta', 'B001-0001', 'Juan Pérez', '12345678'),
(NOW() - INTERVAL '2 days', 520.00, 3, 'Efectivo', 'Factura', 'F001-0001', 'Maria Lopez', '20123456789')
ON CONFLICT DO NOTHING;

INSERT INTO sale_items (saleId, productId, productName, quantity, price) VALUES
(1, 1, 'Carpa 4 Personas', 1, 250.00),
(1, 2, 'Saco de Dormir', 1, 120.00),
(2, 4, 'Mochila Trekking', 2, 180.00),
(2, 3, 'Linterna LED', 4, 45.00)
ON CONFLICT DO NOTHING;
