CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  post_id INTEGER,
  target_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (password is 'admin123' hashed with SHA-256)
-- Hash of 'admin123' is 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT OR IGNORE INTO users (id, username, password_hash, email, role) 
VALUES (1, 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@example.com', 'admin');

CREATE TABLE IF NOT EXISTS dictionaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'normal',
  parent_id INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  menu_name TEXT NOT NULL,
  menu_key TEXT UNIQUE NOT NULL,
  parent_id INTEGER NOT NULL DEFAULT 0,
  path TEXT,
  component TEXT,
  type TEXT NOT NULL DEFAULT 'menu', 
  sort INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  class_name TEXT,
  url TEXT,
  is_external INTEGER NOT NULL DEFAULT 0, 
  target TEXT DEFAULT '_self',
  permission TEXT,
  status INTEGER NOT NULL DEFAULT 1, 
  hidden INTEGER NOT NULL DEFAULT 0, 
  redirect TEXT,
  keep_alive INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin menus
INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (1, 'Publish', 'publish_offer', 0, '/admin', 'menu', 1, 'ri-edit-2-fill');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (2, 'Offers', 'manage_offers', 0, '/admin/list', 'menu', 2, 'ri-menu-line');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (3, 'Users', 'manage_users', 0, '/admin/users', 'menu', 3, 'ri-user-settings-line');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (4, 'Dictionary', 'manage_dicts', 0, '/admin/dictionaries', 'menu', 4, 'ri-book-3-line');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (5, 'Menus', 'manage_menus', 0, '/admin/menus', 'menu', 5, 'ri-settings-3-fill');
