const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Check if column exists, if not, add it
    db.all("PRAGMA table_info(cms_posts)", (err, columns) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        
        const hasViews = columns.some(c => c.name === 'views');
        if (!hasViews) {
            db.run("ALTER TABLE cms_posts ADD COLUMN views INTEGER DEFAULT 0", (err) => {
                if (err) {
                    console.error("Failed to add views column:", err);
                    process.exit(1);
                } else {
                    console.log("Successfully added 'views' column to cms_posts.");
                }
            });
        } else {
            console.log("'views' column already exists in cms_posts.");
        }
    });
});

setTimeout(() => {
    db.close();
    process.exit(0);
}, 1000);
