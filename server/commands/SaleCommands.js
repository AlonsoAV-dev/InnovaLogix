import pool from '../database.js';

export class SaleCommands {
    static async createSale(saleData) {
        const { total, items, paymentMethod, receiptType, receiptNumber, clientData, cartItems } = saleData;
        const date = new Date().toISOString();
        const clientName = clientData?.name || '';
        const clientDoc = clientData?.docNumber || '';
        const clientAddress = clientData?.address || '';

        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');

            // Insert Sale
            const saleRes = await client.query(
                `INSERT INTO sales (date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc, clientAddress) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [date, total, items, paymentMethod, receiptType, receiptNumber, clientName, clientDoc, clientAddress]
            );
            const saleId = saleRes.rows[0].id;

            const stockUpdates = [];

            // Process each sale item
            for (const item of cartItems) {
                // Check stock and update
                const productRes = await client.query("SELECT id, stock FROM products WHERE name = $1", [item.name]);
                if (productRes.rows.length === 0) {
                    throw new Error(`Producto no encontrado: ${item.name}`);
                }
                
                const productId = productRes.rows[0].id;
                const currentStock = productRes.rows[0].stock;
                
                if (currentStock < item.quantity) {
                    throw new Error(`Stock insuficiente para ${item.name}. Disponible: ${currentStock}, Solicitado: ${item.quantity}`);
                }

                // Insert sale item
                await client.query(
                    "INSERT INTO sale_items (saleId, productName, quantity, price) VALUES ($1, $2, $3, $4)",
                    [saleId, item.name, item.quantity, item.price]
                );

                // Update product stock
                await client.query(
                    "UPDATE products SET stock = stock - $1 WHERE name = $2",
                    [item.quantity, item.name]
                );

                // Record inventory movement
                await client.query(
                    `INSERT INTO inventory_movements (productId, type, quantity, previousStock, newStock, reference, timestamp)
                     VALUES ($1, 'SALE', $2, $3, $4, $5, $6)`,
                    [productId, -item.quantity, currentStock, currentStock - item.quantity, `Sale #${saleId}`, date]
                );

                stockUpdates.push({
                    productId,
                    productName: item.name,
                    stock: currentStock - item.quantity,
                    quantitySold: item.quantity
                });
            }

            await client.query('COMMIT');
            return { saleId, stockUpdates };

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}