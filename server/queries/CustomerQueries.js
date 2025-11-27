import pool from '../database.js';

export class CustomerQueries {
    static async getAllCustomers() {
        const result = await pool.query("SELECT * FROM customers ORDER BY id");
        return result.rows;
    }

    static async getClaims() {
        const result = await pool.query("SELECT * FROM claims ORDER BY id DESC");
        return result.rows;
    }

    static async getSurveys() {
        const result = await pool.query("SELECT * FROM surveys ORDER BY id DESC");
        return result.rows;
    }
}