-- Community-written posts (Markdown, hosted here) and the images/videos uploaded for them.

CREATE TABLE posts (
  id            INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug          TEXT    NOT NULL UNIQUE,  -- fixed at creation: <title-slug>-<id>
  title         TEXT    NOT NULL,
  summary       TEXT    NOT NULL,
  body_md       TEXT    NOT NULL,
  canonical_url TEXT,                     -- original URL when cross-posted from the author's blog
  status        TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  reviewed_by   INTEGER REFERENCES users(id),
  reject_reason TEXT,
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  published_at  TEXT
);
CREATE INDEX posts_feed ON posts(status, published_at DESC);
CREATE INDEX posts_user ON posts(user_id, updated_at DESC);

CREATE TABLE post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag     TEXT    NOT NULL,
  PRIMARY KEY (post_id, tag)
);
CREATE INDEX post_tags_tag ON post_tags(tag);

-- Objects live in R2 under `key`. A file is public only while an approved post references it
-- (post_id); until then only its uploader and moderators can load it.
CREATE TABLE media (
  key          TEXT    PRIMARY KEY,       -- u/<user_id>/<random>.<ext>
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id      INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  kind         TEXT    NOT NULL CHECK (kind IN ('image', 'video')),
  content_type TEXT    NOT NULL,
  size         INTEGER NOT NULL,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX media_user ON media(user_id, created_at);
CREATE INDEX media_post ON media(post_id);
