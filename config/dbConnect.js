const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const db = new Database(":memory:");
const sqlDirectory = path.join(__dirname, "..", "sql");

for (const file of ["테이블 정의.sql", "행사 insert.sql"]) {
  db.exec(fs.readFileSync(path.join(sqlDirectory, file), "utf8"));
}

module.exports = db;
