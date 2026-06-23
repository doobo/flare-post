CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content_md TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'markdown',
  category_id INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS redirect_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_url TEXT NOT NULL,
  referer TEXT,
  ip TEXT,
  user_agent TEXT,
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
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) 
VALUES (100, '分类列表', 'category_list', 'normal', 0, 1);

INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (101, '虚拟机', 'category_list', 'normal', 100, 1);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (102, 'VPN', 'category_list', 'normal', 100, 2);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (103, '域名', 'category_list', 'normal', 100, 3);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (104, '服务器', 'category_list', 'normal', 100, 4);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (105, '网络工具', 'category_list', 'normal', 100, 5);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (106, '安全工具', 'category_list', 'normal', 100, 6);

INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (107, 'KVM', 'category_list', 'normal', 101, 1);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (108, 'VMware', 'category_list', 'normal', 101, 2);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (109, '商业VPN', 'category_list', 'normal', 102, 1);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (110, '自建VPN', 'category_list', 'normal', 102, 2);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (111, '注册商', 'category_list', 'normal', 103, 1);
INSERT OR IGNORE INTO dictionaries (id, name, code, type, parent_id, sort_order) VALUES (112, 'DNS解析', 'category_list', 'normal', 103, 2);

INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (200, '系统标题', 'admin_title', 'Data Center', 'normal', 0, 0);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (201, '热门标签', 'hot_tags', 'kvm,vps,annual,unlimited,domain', 'normal', 0, 0);

INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order, description) VALUES (300, '存储类型', 'storage_type', NULL, 'normal', 0, 0, '存储适配器类型');
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order, description) VALUES (301, 'im.ge', '', 'common', 'normal', 300, 0, '默认 im.ge 图片托管服务');
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order, description) VALUES (302, 'S3', '', 'S3', 'normal', 300, 1, 'AWS S3 兼容对象存储');
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order, description) VALUES (303, 'R2', '', 'R2', 'normal', 300, 2, 'Cloudflare R2 对象存储');

INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order, description) VALUES (400, '跳转白名单', 'redirect_whitelist', NULL, 'normal', 0, 0, '链接跳转安全域名白名单');
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (401, 'GitHub', 'redirect_whitelist', 'github.com', 'normal', 400, 1);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (402, 'Cloudflare', 'redirect_whitelist', 'cloudflare.com', 'normal', 400, 2);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (403, 'Google', 'redirect_whitelist', 'google.com', 'normal', 400, 3);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (404, 'Workers', 'redirect_whitelist', 'workers.cloudflare.com', 'normal', 400, 4);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (405, 'NPM Trends', 'redirect_whitelist', 'npmtrends.com', 'normal', 400, 5);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (406, 'NPM', 'redirect_whitelist', 'npmjs.com', 'normal', 400, 6);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (407, 'Vue.js', 'redirect_whitelist', 'vuejs.org', 'normal', 400, 7);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (408, 'Vite', 'redirect_whitelist', 'vite.dev', 'normal', 400, 8);
INSERT OR IGNORE INTO dictionaries (id, name, code, value, type, parent_id, sort_order) VALUES (409, 'Didton', 'redirect_whitelist', 'didton.com', 'normal', 400, 9);

CREATE TABLE IF NOT EXISTS upload_configs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_proxy INTEGER NOT NULL DEFAULT 0,
  proxy_prefix TEXT,
  storage_type TEXT NOT NULL DEFAULT 'common',
  upload_url TEXT,
  access_key TEXT,
  secret_key TEXT,
  refresh_token TEXT,
  status INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  mime_type TEXT,
  original_url TEXT NOT NULL,
  proxy_url TEXT,
  ext_config TEXT,
  upload_config_id INTEGER,
  storage_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO upload_configs (id, name, is_default, is_proxy, proxy_prefix, storage_type, status, sort_order, remark)
VALUES (1, 'Default Common', 1, 1, '', 'common', 1, 0, 'System default common image storage');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (6, 'Upload', 'upload_configs', 0, '/admin/upload-configs', 'menu', 6, 'ri-cloud-line');

INSERT OR IGNORE INTO menus (id, menu_name, menu_key, parent_id, path, type, sort, icon)
VALUES (7, 'Files', 'manage_files', 0, '/admin/files', 'menu', 7, 'ri-file-list-line');
