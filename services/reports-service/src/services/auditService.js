import crypto from 'crypto';
import pool from '../../database.js';

class AuditService {
    /**
     * Calculates SHA-256 hash of the record combined with the previous hash
     */
    calculateHash(prevHash, userId, action, resource, details, timestamp) {
        const data = `${prevHash}|${userId}|${action}|${resource}|${JSON.stringify(details)}|${timestamp}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Logs an action with integrity protection (blockchain-like chaining)
     */
    async logAction(userId, action, resource, details = {}) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Get the last hash
            const lastRecordRes = await client.query('SELECT hash FROM audit_logs ORDER BY id DESC LIMIT 1');
            const previousHash = lastRecordRes.rows.length > 0 ? lastRecordRes.rows[0].hash : 'GENESIS_HASH';

            const timestamp = new Date().toISOString();
            const hash = this.calculateHash(previousHash, userId, action, resource, details, timestamp);

            await client.query(
                `INSERT INTO audit_logs (user_id, action, resource, details, timestamp, previous_hash, hash)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, action, resource, details, timestamp, previousHash, hash]
            );

            await client.query('COMMIT');
            console.log(`📝 [Audit] Action logged: ${action} by ${userId}`);
            return hash;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [Audit] Failed to log action:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Verifies the integrity of the audit log chain
     * Returns { valid: boolean, brokenAtId: number | null }
     */
    async verifyIntegrity() {
        const result = await pool.query('SELECT * FROM audit_logs ORDER BY id ASC');
        const logs = result.rows;

        if (logs.length === 0) return { valid: true, brokenAtId: null };

        let previousHash = 'GENESIS_HASH';

        for (const log of logs) {
            const calculatedHash = this.calculateHash(
                previousHash,
                log.user_id,
                log.action,
                log.resource,
                log.details,
                log.timestamp.toISOString() // Ensure format matches
            );

            if (calculatedHash !== log.hash) {
                const debug = {
                    stored: log.hash,
                    calculated: calculatedHash,
                    inputData: `${previousHash}|${log.user_id}|${log.action}|${log.resource}|${JSON.stringify(log.details)}|${log.timestamp.toISOString()}`
                };
                console.error(`❌ Hash Mismatch at ID ${log.id}`, debug);
                return { valid: false, brokenAtId: log.id, debug };
            }

            previousHash = log.hash;
        }

        return { valid: true, brokenAtId: null };
    }

    async getLogs(limit = 100) {
        const result = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
        return result.rows;
    }
}

export const auditService = new AuditService();
