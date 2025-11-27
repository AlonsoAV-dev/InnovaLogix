import pool from '../database.js';

export class ProductQueries {
    static async getAllProducts() {
        const result = await pool.query("SELECT * FROM products ORDER BY id");
        return result.rows;
    }

    static async getProductById(id) {
        const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async getProductStock(id) {
        const result = await pool.query("SELECT id, name, stock FROM products WHERE id = $1", [id]);
        return result.rows[0];
    }

    static async getLowStockAlerts() {
        const salesData = await pool.query(`
            SELECT si.productName, SUM(si.quantity) as totalSold
            FROM sale_items si
            JOIN sales s ON si.saleId = s.id
            WHERE s.date >= NOW() - INTERVAL '30 days'
            GROUP BY si.productName
        `);

        const products = await pool.query("SELECT * FROM products");
        
        const alerts = products.rows.map(p => {
            const saleStat = salesData.rows.find(s => s.productname === p.name);
            const totalSold30Days = saleStat ? parseInt(saleStat.totalsold) : 0;
            const avgDailySales = totalSold30Days / 30;
            const leadTimeDays = 7;
            const dynamicMinStock = Math.ceil(avgDailySales * leadTimeDays);
            const effectiveMinStock = Math.max(dynamicMinStock, p.minstock || 0);

            if (p.stock <= effectiveMinStock) {
                return {
                    ...p,
                    avgDailySales: avgDailySales.toFixed(2),
                    dynamicMinStock,
                    effectiveMinStock,
                    suggestedReorder: Math.max(effectiveMinStock * 2 - p.stock, 10)
                };
            }
            return null;
        }).filter(Boolean);

        return alerts;
    }

    static async getInventoryKardex(productId) {
        const result = await pool.query(
            "SELECT * FROM inventory_movements WHERE productId = $1 ORDER BY id DESC",
            [productId]
        );
        return result.rows;
    }
}