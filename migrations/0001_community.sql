-- Community links and resources (Phases 2–3). Applied with
--   wrangler d1 migrations apply kandra-site --local    (dev)
--   wrangler d1 migrations apply kandra-site --remote   (production)

-- GitHub is the only sign-in provider; we keep the public profile basics and nothing else.
CREATE TABLE users (
  id          INTEGER PRIMARY KEY,
  github_id   INTEGER NOT NULL UNIQUE,
  login       TEXT    NOT NULL,
  name        TEXT,
  avatar_url  TEXT,
  role        TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  banned      INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Opaque random session ids in an HttpOnly cookie; deleting the row signs the user out.
CREATE TABLE sessions (
  id          TEXT    PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT    NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

-- One table for both kinds. kind='link' is someone's own article/video elsewhere; kind='resource'
-- is a directory entry (library, sample, talk, tool, template). Hosted posts come later.
CREATE TABLE submissions (
  id             INTEGER PRIMARY KEY,
  kind           TEXT    NOT NULL CHECK (kind IN ('link', 'resource')),
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url            TEXT    NOT NULL,
  url_key        TEXT    NOT NULL UNIQUE,  -- normalized url, blocks duplicate submissions
  title          TEXT    NOT NULL,
  summary        TEXT    NOT NULL,
  resource_type  TEXT    CHECK (resource_type IN ('library', 'sample', 'talk', 'tool', 'template', 'guide')),
  kandra_version TEXT,
  status         TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by    INTEGER REFERENCES users(id),
  reject_reason  TEXT,
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at   TEXT
);
CREATE INDEX submissions_feed ON submissions(kind, status, published_at DESC);
CREATE INDEX submissions_user ON submissions(user_id, created_at);

CREATE TABLE submission_tags (
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  tag           TEXT    NOT NULL,
  PRIMARY KEY (submission_id, tag)
);
CREATE INDEX submission_tags_tag ON submission_tags(tag);

CREATE TABLE votes (
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (submission_id, user_id)
);

CREATE TABLE reports (
  id            INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason        TEXT    NOT NULL,
  resolved      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (submission_id, user_id)
);
