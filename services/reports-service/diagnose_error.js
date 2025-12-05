import axios from 'axios';

async function test() {
    try {
        console.log('Fetching financial report...');
        const res = await axios.get('http://localhost:3005/api/reports/financial/net-profit');
        console.log('Success:', res.data);
    } catch (err) {
        console.error('❌ Request Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    }
}

test();
