import pool from '../database.js';

export class PurchaseQueries {
    static async getAllPurchases() {
        const result = await pool.query(`
            SELECT p.*, 
            (SELECT json_agg(pi.*) FROM purchase_items pi WHERE pi.purchaseId = p.id) as items 
            FROM purchases p ORDER BY p.id DESC
        `);
        return result.rows;
    }

    static async getPurchaseById(id) {
        const result = await pool.query(`
            SELECT p.*, 
            (SELECT json_agg(pi.*) FROM purchase_items pi WHERE pi.purchaseId = p.id) as items 
            FROM purchases p WHERE p.id = $1
        `, [id]);
        return result.rows[0];
    }
}