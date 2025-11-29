-- ================================================
-- SAMPLE DATA FOR INVENTORY SERVICE
-- ================================================

-- Insert Products
INSERT INTO products (name, price, cost, stock, minStock, category, image) VALUES
('Carpa 4 Personas', 250.00, 180.00, 15, 5, 'Camping', 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=500&q=80'),
('Saco de Dormir', 120.00, 80.00, 25, 8, 'Camping', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80'),
('Linterna LED', 45.00, 25.00, 50, 15, 'Accesorios', 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=500&q=80'),
('Mochila Trekking', 180.00, 120.00, 10, 3, 'Trekking', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80'),
('Botas Trekking', 280.00, 200.00, 12, 4, 'Calzado', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'),
('Casaca Térmica', 350.00, 250.00, 8, 2, 'Ropa', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80'),
('Bastones Trekking', 95.00, 60.00, 20, 6, 'Trekking', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&q=80'),
('Cantimplora 1L', 35.00, 20.00, 40, 10, 'Accesorios', 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&q=80')
ON CONFLICT DO NOTHING;

-- Insert initial inventory movements
INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, notes)
VALUES
(1, 'ADJUSTMENT', 15, 0, 15, 'INIT', 'Stock inicial'),
(2, 'ADJUSTMENT', 25, 0, 25, 'INIT', 'Stock inicial'),
(3, 'ADJUSTMENT', 50, 0, 50, 'INIT', 'Stock inicial'),
(4, 'ADJUSTMENT', 10, 0, 10, 'INIT', 'Stock inicial'),
(5, 'ADJUSTMENT', 12, 0, 12, 'INIT', 'Stock inicial'),
(6, 'ADJUSTMENT', 8, 0, 8, 'INIT', 'Stock inicial'),
(7, 'ADJUSTMENT', 20, 0, 20, 'INIT', 'Stock inicial'),
(8, 'ADJUSTMENT', 40, 0, 40, 'INIT', 'Stock inicial')
ON CONFLICT DO NOTHING;
