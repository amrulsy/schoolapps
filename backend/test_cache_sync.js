const http = require('http');

async function request(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testSync() {
    console.log('--- Testing PPDB Status Sync ---');

    // 1. Get initial public settings (this will cache it)
    console.log('1. Fetching initial public settings...');
    const pub1 = await request({ hostname: 'localhost', port: 3000, path: '/api/public/settings', method: 'GET' });
    console.log('   Public status:', pub1.data.registration_open);

    // 2. Update settings via Admin
    const newValue = pub1.data.registration_open === 'true' || pub1.data.registration_open === '1' ? 'false' : 'true';
    console.log(`2. Updating via Admin to: ${newValue}...`);
    const adminUpdate = await request({
        hostname: 'localhost', port: 3000, path: '/api/admin/cms/settings', method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dummy-token' }
    }, { updates: [{ setting_key: 'registration_open', setting_value: newValue }] });

    if (adminUpdate.status === 200) {
        console.log('   Admin update successful.');
    } else {
        console.error('   Admin update failed:', adminUpdate.data);
        return;
    }

    // 3. Fetch public settings again (should be non-cached or invalidated)
    console.log('3. Fetching public settings again...');
    const pub2 = await request({ hostname: 'localhost', port: 3000, path: '/api/public/settings', method: 'GET' });
    console.log('   Public status:', pub2.data.registration_open);

    if (pub2.data.registration_open === newValue) {
        console.log('✅ SUCCESS: Status synced instantly!');
    } else {
        console.log('❌ FAILED: Status is still cached.');
    }
}

testSync();
