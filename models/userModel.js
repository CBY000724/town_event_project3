const db = require("../config/dbConnect");

function findByUsername(username) {
  return db.prepare("SELECT id, nickname, password_hash FROM users WHERE username = ?").get(username);
}

function create(username, passwordHash) {
  return db.prepare(`
    INSERT INTO users (username, nickname, password_hash) VALUES (?, ?, ?)
    ON CONFLICT(username) DO NOTHING
  `).run(username, username, passwordHash).changes === 1;
}

module.exports = { findByUsername, create };
