import pool from '../database.js';

export class PurchaseCommands {
    static async createPurchase(purchaseData) {
        const { supplierId, supplierName, total, items, invoiceNumber, status, estimatedDelivery } = purchaseData;
        const date = new Date().toISOString();

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const purchaseRes = await client.query(
                `INSERT INTO purchases (supplierId, supplierName, total, date, invoiceNumber, status, estimatedDelivery) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [supplierId, supplierName, total, date, invoiceNumber, status, estimatedDelivery]
            );
            const purchaseId = purchaseRes.rows[0].id;

            for (const item of items) {
                await client.query(
                    "INSERT INTO purchase_items (purchaseId, productId, productName, quantity, cost) VALUES ($1, $2, $3, $4, $5)",
                    [purchaseId, item.productId, item.productName, item.quantity, item.cost]
                );
            }

            await client.query('COMMIT');
            return { purchaseId, message: "Purchase recorded" };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    static async updatePurchaseStatus(purchaseId, status, currentStatus) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            const result = await client.query(
                "UPDATE purchases SET status = $1 WHERE id = $2 RETURNING *",
                [status, purchaseId]
            );

            const stockUpdates = [];

            if (status === 'Confirmed' && currentStatus !== 'Confirmed') {
                const itemsRes = await client.query("SELECT * FROM purchase_items WHERE purchaseId = $1", [purchaseId]);
                
                for (const item of itemsRes.rows) {
                    const pRes = await client.query("SELECT stock FROM products WHERE id = $1", [item.productid]);
                    const currentStock = pRes.rows[0].stock;

                    await client.query(
                        "UPDATE products SET stock = stock + $1 WHERE id = $2",
                        [item.quantity, item.productid]
                    );

                    await client.query(
                        `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                         VALUES ($1, 'PURCHASE_CONFIRM', $2, $3, $4, $5, NOW())`,
                        [item.productid, item.quantity, currentStock, currentStock + item.quantity, `Purchase #${purchaseId}`]
                    );

                    const productRes = await client.query("SELECT name, stock FROM products WHERE id = $1", [item.productid]);
                    if (productRes.rows.length > 0) {
                        const product = productRes.rows[0];
                        stockUpdates.push({
                            productId: item.productid,
                            productName: product.name,
                            stock: product.stock,
                            quantityAdded: item.quantity
                        });
                    }
                }
            } else if (status === 'Cancelled' && currentStatus === 'Confirmed') {
                const itemsRes = await client.query("SELECT * FROM purchase_items WHERE purchaseId = $1", [purchaseId]);
                
                for (const item of itemsRes.rows) {
                    const pRes = await client.query("SELECT stock FROM products WHERE id = $1", [item.productid]);
                    const currentStock = pRes.rows[0].stock;

                    await client.query(
                        "UPDATE products SET stock = stock - $1 WHERE id = $2",
                        [item.quantity, item.productid]
                    );

                    const productRes = await client.query("SELECT name, stock FROM products WHERE id = $1", [item.productid]);
                    if (productRes.rows.length > 0) {
                        const product = productRes.rows[0];
                        stockUpdates.push({
                            productId: item.productid,
                            productName: product.name,
                            stock: product.stock,
                            quantityRemoved: item.quantity
                        });
                    }

                    await client.query(
                        `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                         VALUES ($1, 'PURCHASE_CANCEL', $2, $3, $4, $5, NOW())`,
                        [item.productid, -item.quantity, currentStock, currentStock - item.quantity, `Purchase #${purchaseId}`]
                    );
                }
            }

            await client.query('COMMIT');
            return { purchase: result.rows[0], stockUpdates };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}