-- 동네소식 SQLite 테이블과 인덱스 생성
PRAGMA foreign_keys = ON;
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT,
  CHECK ((username IS NULL AND password_hash IS NULL) OR
         (username IS NOT NULL AND password_hash IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('동네 행사', '캠퍼스', '팝업')),
  location TEXT NOT NULL,
  event_date TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS likes (
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  body TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS likes_event ON likes(event_id);
CREATE INDEX IF NOT EXISTS comments_event ON comments(event_id);

COMMIT;
