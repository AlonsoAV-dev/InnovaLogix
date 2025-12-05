import axios from 'axios';

const API_URL = 'http://localhost:3005/api';

async function verifyAudit() {
    console.log('🔍 Starting Audit Control Verification...');

    try {
        // 1. Trigger an action that should be logged
        console.log('1️⃣  Triggering Report Export (Inventory)...');
        try {
            await axios.get(`${API_URL}/reports/export/inventory`, { responseType: 'blob' });
            console.log('✅ Report exported successfully.');
        } catch (error) {
            console.error('⚠️  Export failed (might be expected due to random failure simulation):', error.message);
        }

        // 2. Fetch Audit Logs
        console.log('\n2️⃣  Fetching Audit Logs...');
        const response = await axios.get(`${API_URL}/audit-logs`);
        const { integrity, logs } = response.data;

        console.log(`📊 Total Logs: ${logs.length}`);
        console.log(`🛡️  Integrity Status: ${integrity.valid ? 'VALID ✅' : 'INVALID ❌'}`);

        if (!integrity.valid) {
            console.error(`❌ Chain broken at ID: ${integrity.brokenAtId}`);
            if (integrity.debug) {
                console.log('\n🔍 Debug Info:');
                console.log(`   Input Data: ${integrity.debug.inputData}`);
                console.log(`   Stored Hash:     ${integrity.debug.stored}`);
                console.log(`   Calculated Hash: ${integrity.debug.calculated}`);
            }
        }

        // 3. Verify and List Logs
        if (logs.length > 0) {
            console.log('\n📜 Recent Audit Logs (Last 5):');
            logs.slice(0, 5).forEach((log, index) => {
                console.log(`\n   [${index + 1}] ID: ${log.id} | Time: ${new Date(log.timestamp).toLocaleString()}`);
                console.log(`       User: ${log.user_id}`);
                console.log(`       Action: ${log.action}`);
                console.log(`       Resource: ${log.resource}`);
                console.log(`       Hash: ${log.hash.substring(0, 15)}...`);
            });

            const lastLog = logs[0];
            if (lastLog.action === 'EXPORT_REPORT' && lastLog.resource === 'INVENTORY') {
                console.log('\n✅ Verification SUCCESS: The test action (Inventory Export) was correctly logged.');
            } else {
                console.log('\n⚠️  Note: The last action was not the test action. (Did you perform another action simultaneously?)');
            }
        } else {
            console.error('\n❌ Verification FAILED: No logs found.');
        }

    } catch (error) {
        console.error('\n❌ Verification Error:', error.message);
        console.log('💡 Note: Ensure the reports-service is running and updated.');
    }
}

verifyAudit();
