const fs = require('fs');

const localFile = 'c:\\dev\\schoolapps\\backend\\schema.sql';
const hostingFile = 'c:\\dev\\schoolapps\\sya40748_smkpprq_sch_id.sql';

const localSql = fs.readFileSync(localFile, 'utf8');
const hostingSql = fs.readFileSync(hostingFile, 'utf8');

function extractTables(sql) {
  const tables = {};
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)/gi;
  let match;
  while ((match = regex.exec(sql)) !== null) {
    const tableName = match[1].toLowerCase();
    const columnsStr = match[2];
    
    const columns = {};
    const lines = columnsStr.split(/\r?\n/);
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('--') || line.startsWith('PRIMARY KEY') || line.startsWith('FOREIGN KEY') || line.startsWith('UNIQUE KEY') || line.startsWith('KEY') || line.startsWith('CONSTRAINT')) {
        continue;
      }
      
      const colMatch = line.match(/^`?(\w+)`?\s+(.*?),?$/);
      if (colMatch) {
         columns[colMatch[1].toLowerCase()] = colMatch[2].trim().replace(/,$/, '');
      }
    }
    tables[tableName] = columns;
  }
  return tables;
}

const localTables = extractTables(localSql);
const hostingTables = extractTables(hostingSql);

console.log("=== TABLES IN LOCAL BUT NOT IN HOSTING ===");
for (let t in localTables) {
  if (!hostingTables[t]) console.log("- " + t);
}

console.log("\n=== TABLES IN HOSTING BUT NOT IN LOCAL ===");
for (let t in hostingTables) {
  if (!localTables[t]) console.log("- " + t);
}

console.log("\n=== COLUMN DIFFERENCES IN TABLES EXISTING IN BOTH ===");
for (let t in localTables) {
  if (hostingTables[t]) {
    const localCols = localTables[t];
    const hostCols = hostingTables[t];
    
    const diffs = [];
    
    for (let c in localCols) {
      if (!hostCols[c]) {
        diffs.push(`MISSING in Hosting: ${c} (${localCols[c]})`);
      } else if (localCols[c].toLowerCase().replace(/\s+/g,'') !== hostCols[c].toLowerCase().replace(/\s+/g,'')) {
        diffs.push(`TYPE DIFF: ${c} | Local: ${localCols[c]} | Host: ${hostCols[c]}`);
      }
    }
    
    for (let c in hostCols) {
      if (!localCols[c]) {
        diffs.push(`EXTRA in Hosting: ${c} (${hostCols[c]})`);
      }
    }
    
    if (diffs.length > 0 || ['siswa', 'tahun_pelajaran', 'akademik'].some(key => t.includes(key))) {
      if (diffs.length > 0) {
        console.log(`\nTable: ${t}`);
        diffs.forEach(d => console.log("  " + d));
      } else {
        console.log(`\nTable: ${t} - NO DIFFERENCES FOUND.`);
      }
    }
  }
}
