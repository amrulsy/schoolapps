const http = require('http');
const paths = ['/api/student/tabungan', '/api/student/attendance', '/api/student/bk', '/api/student/nilai', '/api/student/pesan'];
async function test() {
    for (const path of paths) {
        await new Promise((resolve) => {
            http.get({ hostname: '127.0.0.1', port: 3000, path: path, headers: { 'Authorization': 'Bearer c3R1ZGVudDox' } }, (res) => {
                console.log(`${path}: ${res.statusCode}`);
                resolve();
            }).on('error', (err) => { console.log(`${path}: ERROR ${err.message}`); resolve(); });
        });
    }
}
test();
