import pool from '../database.js';

export class SaleQueries {
    static async getAllSales() {
        const result = await pool.query("SELECT * FROM sales ORDER BY id DESC");
        return result.rows;
    }

    static async getSaleById(id) {
        const result = await pool.query("SELECT * FROM sales WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async getSaleItems(saleId) {
        const result = await pool.query("SELECT * FROM sale_items WHERE saleId = $1", [saleId]);
        return result.rows;
    }

    static async getDailySalesReport() {
        const result = await pool.query("SELECT * FROM ventas_diarias_mv ORDER BY dia DESC");
        return result.rows;
    }

    static async getTopProductsReport() {
        const result = await pool.query("SELECT * FROM top_productos_mv ORDER BY total_vendido DESC LIMIT 10");
        return result.rows;
    }

    static async getSalesDetailReport() {
        const result = await pool.query("SELECT * FROM ventas_detalle_mv ORDER BY date DESC");
        return result.rows;
    }
}