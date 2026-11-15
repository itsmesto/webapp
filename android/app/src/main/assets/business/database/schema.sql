PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  company_name TEXT NOT NULL DEFAULT 'Meridian Supply Co.',
  currency TEXT NOT NULL DEFAULT 'LKR',
  locale TEXT NOT NULL DEFAULT 'en-LK',
  email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '', tax_number TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sequences (
  name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, project_key TEXT NOT NULL UNIQUE, title TEXT NOT NULL DEFAULT '',
  customer_id TEXT REFERENCES customers(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  logo_data TEXT NOT NULL DEFAULT '',
  bank_name TEXT NOT NULL DEFAULT '',
  bank_branch TEXT NOT NULL DEFAULT '',
  bank_account_number TEXT NOT NULL DEFAULT '',
  account_holder TEXT NOT NULL DEFAULT '',
  contact_numbers TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
    location_url TEXT NOT NULL DEFAULT '',
    tax_number TEXT NOT NULL DEFAULT '',
    additional_info TEXT NOT NULL DEFAULT '',
    terms_conditions TEXT NOT NULL DEFAULT '',
    document_color TEXT NOT NULL DEFAULT '#1f5fae',
    receiver_key TEXT NOT NULL DEFAULT '',
    is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '', address TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General', unit TEXT NOT NULL DEFAULT 'pcs',
  quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level REAL NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  purchase_price REAL NOT NULL DEFAULT 0 CHECK (purchase_price >= 0),
  selling_price REAL NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  description TEXT NOT NULL DEFAULT '',
  photo_data TEXT NOT NULL DEFAULT '',
  photo_mime TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS company_properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  unit TEXT NOT NULL DEFAULT 'each',
  quantity REAL NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  purchase_cost REAL NOT NULL DEFAULT 0 CHECK (purchase_cost >= 0),
  purchase_date TEXT NOT NULL DEFAULT '',
  condition TEXT NOT NULL DEFAULT 'Good',
  location TEXT NOT NULL DEFAULT '',
  serial_number TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY, code TEXT NOT NULL DEFAULT '', title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', unit_price REAL NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  unit_cost REAL NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
  next_service_date TEXT NOT NULL DEFAULT '', reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (reminder_days >= 0 AND reminder_days <= 365),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, customer_id TEXT NOT NULL REFERENCES customers(id),
  invoice_date TEXT NOT NULL, due_date TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'open',
  notes TEXT NOT NULL DEFAULT '', total REAL NOT NULL DEFAULT 0 CHECK (total >= 0),
  quotation_id TEXT REFERENCES quotations(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) DEFAULT 'company-default',
  subtotal REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_rate REAL NOT NULL DEFAULT 0 CHECK (discount_rate >= 0),
  tax_rate REAL NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  terms TEXT NOT NULL DEFAULT ''
  ,project_key TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id), description TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0), unit_price REAL NOT NULL CHECK (unit_price >= 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0), line_total REAL NOT NULL CHECK (line_total >= 0),
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product','service')),
  service_id TEXT REFERENCES services(id), item_code TEXT NOT NULL DEFAULT '',
  service_title TEXT NOT NULL DEFAULT '', service_description TEXT NOT NULL DEFAULT '',
  discount_percent REAL NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0)
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL REFERENCES invoices(id),
  customer_id TEXT NOT NULL REFERENCES customers(id), amount REAL NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'Cash', reference TEXT NOT NULL DEFAULT '', payment_date TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, customer_id TEXT NOT NULL REFERENCES customers(id),
  document_type TEXT NOT NULL DEFAULT 'quotation' CHECK (document_type IN ('quotation','estimate')),
  quote_date TEXT NOT NULL, valid_until TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT NOT NULL DEFAULT '', total REAL NOT NULL DEFAULT 0 CHECK (total >= 0),
  invoice_id TEXT REFERENCES invoices(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) DEFAULT 'company-default',
  subtotal REAL NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_rate REAL NOT NULL DEFAULT 0 CHECK (discount_rate >= 0),
  tax_rate REAL NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
  tax_amount REAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  terms TEXT NOT NULL DEFAULT ''
  ,project_key TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY, quotation_id TEXT NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id), description TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0), unit_price REAL NOT NULL CHECK (unit_price >= 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0), line_total REAL NOT NULL CHECK (line_total >= 0),
  item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product','service')),
  service_id TEXT REFERENCES services(id), item_code TEXT NOT NULL DEFAULT '',
  service_title TEXT NOT NULL DEFAULT '', service_description TEXT NOT NULL DEFAULT '',
  discount_percent REAL NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_amount REAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0)
);
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  purchase_date TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', notes TEXT NOT NULL DEFAULT '',
  total REAL NOT NULL DEFAULT 0 CHECK (total >= 0), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES companies(id) DEFAULT 'company-default',
  terms TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY, purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id), quantity REAL NOT NULL CHECK (quantity > 0),
  unit_cost REAL NOT NULL CHECK (unit_cost >= 0), line_total REAL NOT NULL CHECK (line_total >= 0)
);
CREATE TABLE IF NOT EXISTS supplier_payments (
  id TEXT PRIMARY KEY, supplier_id TEXT NOT NULL REFERENCES suppliers(id), purchase_id TEXT REFERENCES purchases(id),
  amount REAL NOT NULL CHECK (amount > 0), method TEXT NOT NULL DEFAULT 'Cash', reference TEXT NOT NULL DEFAULT '',
  payment_date TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY, description TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Other',
  amount REAL NOT NULL CHECK (amount > 0), expense_date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash', notes TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  project_key TEXT NOT NULL DEFAULT '', quotation_id TEXT REFERENCES quotations(id), invoice_id TEXT REFERENCES invoices(id),
  customer_id TEXT REFERENCES customers(id), supplier_id TEXT REFERENCES suppliers(id), project_name TEXT NOT NULL DEFAULT '',
  expense_type TEXT NOT NULL DEFAULT 'general', worker_count REAL NOT NULL DEFAULT 0, worker_names TEXT NOT NULL DEFAULT '',
  working_days REAL NOT NULL DEFAULT 0, working_hours REAL NOT NULL DEFAULT 0, labour_rate REAL NOT NULL DEFAULT 0,
  labour_rate_unit TEXT NOT NULL DEFAULT 'day', additional_labour REAL NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS expense_attachments (
  id TEXT PRIMARY KEY, expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, file_data BLOB NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), movement_type TEXT NOT NULL,
  quantity REAL NOT NULL, unit_cost REAL NOT NULL DEFAULT 0, reference TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '', movement_date TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, share_percent REAL NOT NULL DEFAULT 0 CHECK (share_percent >= 0 AND share_percent <= 100),
  email TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS profit_shares (
  id TEXT PRIMARY KEY, partner_id TEXT NOT NULL REFERENCES partners(id), period_start TEXT NOT NULL,
  period_end TEXT NOT NULL, profit_basis REAL NOT NULL, share_percent REAL NOT NULL,
  amount REAL NOT NULL, created_at TEXT NOT NULL,
  UNIQUE(partner_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, movement_date);
CREATE INDEX IF NOT EXISTS idx_services_title ON services(title);
CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense ON expense_attachments(expense_id);

