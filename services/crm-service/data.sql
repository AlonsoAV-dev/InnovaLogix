-- SAMPLE DATA FOR CRM SERVICE

INSERT INTO customers (name, email, phone, type, points, totalPurchases, lastVisit) VALUES
('Juan Pérez', 'juan@mail.com', '999888777', 'Frecuente', 120, 1500.00, '2023-11-20'),
('Maria Lopez', 'maria@mail.com', '999111222', 'Nuevo', 50, 300.00, '2023-11-22'),
('Carlos Ruiz', 'carlos@mail.com', '999333444', 'Mayorista', 500, 5000.00, '2023-11-18'),
('Ana Torres', 'ana@mail.com', '999555666', 'VIP', 850, 8500.00, '2023-11-25'),
('Pedro Sánchez', 'pedro@mail.com', '999777888', 'Frecuente', 200, 2000.00, '2023-11-21')
ON CONFLICT DO NOTHING;

INSERT INTO claims (customerId, type, product, reason, status, date) VALUES
(1, 'Producto Defectuoso', 'Carpa 4 Personas', 'Cremallera rota', 'En Proceso', NOW() - INTERVAL '2 days'),
(2, 'Garantía', 'Linterna LED', 'No enciende', 'Pendiente', NOW() - INTERVAL '1 day'),
(3, 'Servicio', 'N/A', 'Demora en entrega', 'Resuelto', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO surveys (customerId, rating, comment, date) VALUES
(1, 4, 'Buen servicio, pero la entrega tardó un poco', NOW() - INTERVAL '1 day'),
(3, 5, 'Excelente atención y productos de calidad', NOW() - INTERVAL '3 days'),
(4, 5, 'Muy satisfecho con la compra', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;
