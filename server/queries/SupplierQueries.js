import pool from '../database.js';

export class SupplierQueries {
    static async getAllSuppliers() {
        const result = await pool.query("SELECT * FROM suppliers ORDER BY id");
        return result.rows;
    }

    static async getSupplierProducts(supplierId) {
        const result = await pool.query(
            `SELECT sp.*, p.name as productName, p.category 
             FROM supplier_products sp 
             JOIN products p ON sp.productId = p.id 
             WHERE sp.supplierId = $1`,
            [supplierId]
        );
        return result.rows;
    }

    static async getAllSupplierProducts() {
        const result = await pool.query(
            `SELECT sp.*, p.name as productName, p.category, s.name as supplierName 
             FROM supplier_products sp 
             JOIN products p ON sp.productId = p.id 
             JOIN suppliers s ON sp.supplierId = s.id`
        );
        return result.rows;
    }
}