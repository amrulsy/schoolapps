const http = require('http');

const paths = [
    '/api/student/tabungan',
    '/api/student/attendance',
    '/api/student/bk',
    '/api/student/nilai',
    '/api/student/pesan'
];

const results = [];

async function test() {
    for (const path of paths) {
        await new Promise((resolve) => {
            const req = http.get({
                hostname: '127.0.0.1',
                port: 3000,
                path: path,
                headers: {
                    'Authorization': 'Bearer c3R1ZGVudDox'
                }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    results.push({ path, code: res.statusCode, body: data.substring(0, 100) + (data.length > 100 ? '...' : '') });
                    resolve();
                });
            });
            req.on('error', (err) => {
                results.push({ path, error: err.message });
                resolve();
            });
        });
    }
    console.log(JSON.stringify(results, null, 2));
}

test();
