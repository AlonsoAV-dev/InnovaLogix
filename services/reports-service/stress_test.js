import axios from 'axios';

const API_URL = 'http://localhost:3005/api';
const CONCURRENT_REQUESTS = 20;

async function runStressTest() {
    console.log('🚀 Starting Stress Test (ESC-18: Efficiency)');
    console.log(`🎯 Target: ${CONCURRENT_REQUESTS} concurrent requests to /api/dashboard`);

    // 1. Prime the cache (First request might be slow)
    console.log('\n1️⃣  Priming Cache (First Request)...');
    const startPrime = performance.now();
    await axios.get(`${API_URL}/dashboard`);
    const endPrime = performance.now();
    console.log(`✅ Cache Primed in ${(endPrime - startPrime).toFixed(2)}ms`);

    // 2. Run Concurrent Requests
    console.log(`\n2️⃣  Launching ${CONCURRENT_REQUESTS} requests...`);
    const promises = [];
    const startTest = performance.now();

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        promises.push(axios.get(`${API_URL}/dashboard`));
    }

    try {
        await Promise.all(promises);
        const endTest = performance.now();
        const totalTime = endTest - startTest;
        const avgTime = totalTime / CONCURRENT_REQUESTS;

        console.log('\n📊 Results:');
        console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
        console.log(`   Avg Time per Request: ${avgTime.toFixed(2)}ms`);

        if (avgTime <= 3000) { // 3 seconds limit
            console.log('\n✅ SUCCESS: Performance meets requirement (<= 3000ms)');
        } else {
            console.log('\n❌ FAILURE: Performance too slow');
        }

    } catch (error) {
        console.error('❌ Error during stress test:', error.message);
    }
}

runStressTest();
