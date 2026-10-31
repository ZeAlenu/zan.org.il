CREATE TABLE join_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  time TEXT NOT NULL,
  profession TEXT NOT NULL,
  area TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (phone IS NOT NULL OR email IS NOT NULL),
  CHECK (time IN ('שעה בשבוע', 'כמה שעות בשבוע', 'משימה חד־פעמית'))
);

CREATE UNIQUE INDEX join_submissions_phone
  ON join_submissions (phone)
  WHERE phone IS NOT NULL;

CREATE UNIQUE INDEX join_submissions_email
  ON join_submissions (email)
  WHERE email IS NOT NULL;

CREATE TABLE join_rate_limits (
  ip TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY (ip, window_start)
);
