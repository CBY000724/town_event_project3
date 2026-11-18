const db = require("../config/dbConnect");

const categories = ["동네 행사", "캠퍼스", "팝업"];
const fields = "e.id, e.title, e.category, e.location, e.event_date";
const likeCount = "(SELECT COUNT(*) FROM likes WHERE event_id = e.id) AS like_count";

function validate(body) {
  const event = Object.fromEntries(
    ["title", "category", "location", "event_date", "description"].map((key) =>
      [key, typeof body[key] === "string" ? body[key].trim() : ""])
  );
  const date = new Date(event.event_date);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(event.event_date) &&
    Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === event.event_date;
  const valid = event.title.length > 0 && event.title.length <= 80 &&
    categories.includes(event.category) && event.location.length > 0 &&
    event.location.length <= 100 && validDate &&
    event.description.length > 0 && event.description.length <= 2000;
  return { event, valid };
}

function list() {
  return db.prepare(`SELECT ${fields}, ${likeCount} FROM events e ORDER BY e.event_date, e.id DESC`).all();
}

function find(id, userId) {
  return db.prepare(`
    SELECT ${fields}, ${likeCount}, e.user_id, e.description, u.nickname,
      EXISTS(SELECT 1 FROM likes WHERE event_id = e.id AND user_id = ?) AS liked
    FROM events e JOIN users u ON e.user_id = u.id WHERE e.id = ?
  `).get(userId, id);
}

function create(event, userId) {
  return db.prepare(`
    INSERT INTO events (title, category, location, event_date, description, user_id)
    VALUES (@title, @category, @location, @event_date, @description, @userId)
  `).run({ ...event, userId }).lastInsertRowid;
}

function update(event, id, userId) {
  return db.prepare(`
    UPDATE events SET title = @title, category = @category, location = @location,
      event_date = @event_date, description = @description
    WHERE id = @id AND user_id = @userId
  `).run({ ...event, id, userId }).changes;
}

function remove(id, userId) {
  return db.prepare("DELETE FROM events WHERE id = ? AND user_id = ?").run(id, userId).changes;
}

function setLike(id, userId, liked) {
  if (liked) {
    db.prepare("INSERT INTO likes (event_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING").run(id, userId);
  } else {
    db.prepare("DELETE FROM likes WHERE event_id = ? AND user_id = ?").run(id, userId);
  }
}

function comments(id) {
  return db.prepare(`
    SELECT c.body, u.nickname FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.event_id = ? ORDER BY c.id
  `).all(id);
}

function addComment(id, userId, body) {
  db.prepare("INSERT INTO comments (event_id, user_id, body) VALUES (?, ?, ?)").run(id, userId, body);
}

module.exports = { categories, validate, list, find, create, update, remove, setLike, comments, addComment };
