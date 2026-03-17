const http = require('http');

const endpoints = [
    '/siswa',
    '/units',
    '/kelas',
    '/categories',
    '/tagihan',
    '/tahun-ajaran',
    '/transactions',
    '/cashflow',
    '/users'
];

async function test() {
    for (const ep of endpoints) {
        process.stdout.write(`Testing /api${ep}... `);
        try {
            await new Promise((resolve, reject) => {
                const req = http.get(`http://localhost:3000/api${ep}`, (res) => {
                    if (res.statusCode === 200) {
                        let body = '';
                        res.on('data', (d) => body += d);
                        res.on('end', () => {
                            try {
                                JSON.parse(body);
                                console.log('✅ OK');
                                resolve();
                            } catch (e) {
                                console.log('❌ NOT JSON');
                                reject(e);
                            }
                        });
                    } else {
                        console.log(`❌ ERROR ${res.statusCode}`);
                        reject(new Error(`Status ${res.statusCode}`));
                    }
                });
                req.on('error', (e) => {
                    console.log(`❌ FAILED: ${e.message}`);
                    reject(e);
                });
                req.setTimeout(2000, () => {
                    console.log('❌ TIMEOUT');
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
        } catch (err) {
            // continue
        }
    }
}

test();
