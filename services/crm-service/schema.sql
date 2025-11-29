-- CRM SERVICE DATABASE SCHEMA

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    type VARCHAR(50), -- 'Nuevo', 'Frecuente', 'Mayorista', 'VIP'
    points INTEGER DEFAULT 0,
    totalPurchases DECIMAL(10, 2) DEFAULT 0,
    lastVisit TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claims (
    id SERIAL PRIMARY KEY,
    customerId INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    type VARCHAR(100), -- 'Producto Defectuoso', 'Servicio', 'Garantía', etc.
    product VARCHAR(255),
    reason TEXT,
    status VARCHAR(50), -- 'Pendiente', 'En Proceso', 'Resuelto', 'Rechazado'
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolution TEXT,
    resolvedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
    id SERIAL PRIMARY KEY,
    customerId INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_claims_customer ON claims(customerId);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_surveys_customer ON surveys(customerId);
