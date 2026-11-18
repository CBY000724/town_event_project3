const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDirectory = path.join(__dirname, "data");
const filename = process.env.DB_PATH || path.join(dataDirectory, "events.sqlite");
if (filename !== ":memory:") fs.mkdirSync(path.dirname(filename), { recursive: true });

const db = new Database(filename);
db.pragma("foreign_keys = ON");
const userColumns = `
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT,
  CHECK ((username IS NULL AND password_hash IS NULL) OR
         (username IS NOT NULL AND password_hash IS NOT NULL))
`;

if (db.pragma("table_info(users)").some((column) => column.name === "kakao_id")) {
  db.pragma("foreign_keys = OFF");
  try {
    db.transaction(() => {
      if (!db.pragma("table_info(users)").some((column) => column.name === "kakao_id")) return;
      db.exec(`
        CREATE TABLE users_new (${userColumns});
        INSERT INTO users_new (id, nickname) SELECT id, nickname FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
      `);
      if (db.pragma("foreign_key_check").length) throw new Error("User migration failed foreign key validation");
    }).immediate();
  } finally {
    db.pragma("foreign_keys = ON");
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (${userColumns});
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('동네 행사', '캠퍼스', '팝업')),
    location TEXT NOT NULL,
    event_date TEXT NOT NULL,
    description TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS likes (
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, event_id)
  );
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    body TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS likes_event ON likes(event_id);
  CREATE INDEX IF NOT EXISTS comments_event ON comments(event_id);
`);
module.exports = db;
