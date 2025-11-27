import pool from '../database.js';

export class ProductCommands {
    static async createProduct(productData) {
        const { name, price, cost, stock, minStock, category, image } = productData;
        const result = await pool.query(
            "INSERT INTO products (name, price, cost, stock, minStock, category, image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [name, price, cost, stock, minStock, category, image]
        );
        return result.rows[0];
    }

    static async updateProduct(id, productData) {
        const { name, price, cost, stock, minStock, category, image } = productData;
        const result = await pool.query(
            "UPDATE products SET name = $1, price = $2, cost = $3, stock = $4, minStock = $5, category = $6, image = $7 WHERE id = $8 RETURNING *",
            [name, price, cost, stock, minStock, category, image, id]
        );
        return result.rows[0];
    }

    static async deleteProduct(id) {
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        return { id, message: "Deleted" };
    }

    static async updateStock(productId, quantityChange) {
        const result = await pool.query(
            "UPDATE products SET stock = stock + $1 WHERE id = $2 RETURNING *",
            [quantityChange, productId]
        );
        return result.rows[0];
    }
}