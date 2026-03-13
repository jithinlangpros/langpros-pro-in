# AV Company Inventory Schema (4 Tables)

This schema is designed for Audio-Visual rental companies to manage equipment inventory.

---

## SQL - Create Tables in Supabase

Run these SQL statements in the Supabase SQL Editor to create the tables:

```sql
-- =====================================================
-- TABLE 1: categories
-- Broad equipment groups (top-level classification)
-- =====================================================
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (code, name, description) VALUES
('VID', 'Video', 'Video equipment like cameras, lenses, screens'),
('AUD', 'Audio', 'Audio equipment like mixers, speakers, microphones'),
('LGT', 'Lighting', 'Lighting equipment and accessories'),
('CAB', 'Cables', 'All types of cables and connectors'),
('IT', 'IT Equipment', 'Computers, routers, and IT accessories'),
('ACC', 'Accessories', 'Miscellaneous accessories'),
('ELC', 'Electrical', 'Electrical equipment and adapters'),
('GEN', 'General Consumables', 'General consumable items');

-- =====================================================
-- TABLE 2: subcategories
-- Specific equipment types within a category
-- =====================================================
CREATE TABLE subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subcategories
INSERT INTO subcategories (category_id, code, name) VALUES
-- Video subcategories
((SELECT id FROM categories WHERE code = 'VID'), 'CAM', 'Cameras'),
((SELECT id FROM categories WHERE code = 'VID'), 'LEN', 'Lenses'),
((SELECT id FROM categories WHERE code = 'VID'), 'SCR', 'Screens'),
((SELECT id FROM categories WHERE code = 'VID'), 'CAP', 'Capture Cards'),
((SELECT id FROM categories WHERE code = 'VID'), 'PRJ', 'Projectors'),
-- Audio subcategories
((SELECT id FROM categories WHERE code = 'AUD'), 'MIX', 'Mixers'),
((SELECT id FROM categories WHERE code = 'AUD'), 'AMP', 'Amplifiers'),
((SELECT id FROM categories WHERE code = 'AUD'), 'SPK', 'Speakers'),
((SELECT id FROM categories WHERE code = 'AUD'), 'MIC', 'Microphones'),
((SELECT id FROM categories WHERE code = 'AUD'), 'MON', 'Monitors'),
-- Lighting subcategories
((SELECT id FROM categories WHERE code = 'LGT'), 'LYT', 'Lighting'),
((SELECT id FROM categories WHERE code = 'LGT'), 'LED', 'LED Panels'),
((SELECT id FROM categories WHERE code = 'LGT'), 'STA', 'Stands'),
-- Cables subcategories
((SELECT id FROM categories WHERE code = 'CAB'), 'PWR', 'Power Cables'),
((SELECT id FROM categories WHERE code = 'CAB'), 'XLR', 'XLR Cables'),
((SELECT id FROM categories WHERE code = 'CAB'), 'HDMI', 'HDMI Cables'),
((SELECT id FROM categories WHERE code = 'CAB'), 'SDI', 'SDI Cables');

-- =====================================================
-- TABLE 3: models
-- Actual equipment models/brands - product definitions
-- =====================================================
CREATE TYPE model_type AS ENUM ('serial', 'quantity');

CREATE TABLE models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subcategory_id UUID REFERENCES subcategories(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    description TEXT,
    type model_type DEFAULT 'serial',
    daily_rate DECIMAL(10,2),
    weekly_rate DECIMAL(10,2),
    purchase_cost DECIMAL(12,2),
    min_quantity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample models
INSERT INTO models (subcategory_id, code, name, brand, type, daily_rate, weekly_rate, purchase_cost) VALUES
-- Mixers
((SELECT id FROM subcategories WHERE code = 'MIX'), 'SQ5', 'Allen & Heath SQ-5', 'Allen & Heath', 'serial', 150.00, 750.00, 2500.00),
((SELECT id FROM subcategories WHERE code = 'MIX'), 'SQ7', 'Allen & Heath SQ-7', 'Allen & Heath', 'serial', 200.00, 1000.00, 3500.00),
((SELECT id FROM subcategories WHERE code = 'MIX'), 'ZMX', 'Behringer ZMX164FX', 'Behringer', 'serial', 50.00, 250.00, 400.00),
-- Speakers
((SELECT id FROM subcategories WHERE code = 'SPK'), 'K12', 'QSC K12.2', 'QSC', 'serial', 75.00, 375.00, 1200.00),
((SELECT id FROM subcategories WHERE code = 'SPK'), 'VTX20', 'JBL VTX V20', 'JBL', 'serial', 150.00, 750.00, 2800.00),
-- Cameras
((SELECT id FROM subcategories WHERE code = 'CAM'), 'FX6', 'Sony PXW-FX6', 'Sony', 'serial', 350.00, 1750.00, 6000.00),
((SELECT id FROM subcategories WHERE code = 'CAM'), 'KOMODO', 'RED Komodo', 'RED', 'serial', 400.00, 2000.00, 7000.00),
-- Microphones
((SELECT id FROM subcategories WHERE code = 'MIC'), 'SM58', 'Shure SM58', 'Shure', 'serial', 15.00, 75.00, 100.00),
((SELECT id FROM subcategories WHERE code = 'MIC'), 'Beta58', 'Shure Beta58A', 'Shure', 'serial', 20.00, 100.00, 150.00),
-- LED Panels
((SELECT id FROM subcategories WHERE code = 'LED'), '300X', 'Aputure 300x', 'Aputure', 'serial', 60.00, 300.00, 950.00),
-- XLR Cables
((SELECT id FROM subcategories WHERE code = 'XLR'), 'XLR10', 'XLR Cable 10m', 'Canare', 'quantity', 5.00, 25.00, 25.00),
((SELECT id FROM subcategories WHERE code = 'XLR'), 'XLR25', 'XLR Cable 25m', 'Canare', 'quantity', 8.00, 40.00, 45.00);

-- =====================================================
-- TABLE 4: assets
-- Actual physical assets - individual equipment pieces
-- =====================================================
CREATE TYPE item_status AS ENUM ('available', 'rented', 'reserved', 'maintenance', 'retired');
CREATE TYPE item_condition AS ENUM ('excellent', 'good', 'fair', 'poor');

CREATE TABLE assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID REFERENCES models(id) ON DELETE CASCADE,
    sku VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    barcode VARCHAR(100),
    status item_status DEFAULT 'available',
    condition item_condition DEFAULT 'excellent',
    location VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample assets
INSERT INTO assets (model_id, sku, serial_number, status, condition, location) VALUES
-- Sony FX6 Cameras
((SELECT id FROM models WHERE code = 'FX6'), 'VID-CAM-001', 'SN12345678', 'available', 'excellent', 'Warehouse A'),
((SELECT id FROM models WHERE code = 'FX6'), 'VID-CAM-002', 'SN12345679', 'rented', 'excellent', 'Client - ABC Event'),
-- RED Komodo
((SELECT id FROM models WHERE code = 'KOMODO'), 'VID-CAM-003', 'RD-KOM-001', 'available', 'excellent', 'Warehouse A'),
-- Allen & Heath SQ-5
((SELECT id FROM models WHERE code = 'SQ5'), 'AUD-MIX-001', 'AH-SQ5-001', 'available', 'excellent', 'Warehouse B'),
((SELECT id FROM models WHERE code = 'SQ5'), 'AUD-MIX-002', 'AH-SQ5-002', 'available', 'good', 'Warehouse B'),
-- QSC K12 Speakers
((SELECT id FROM models WHERE code = 'K12'), 'AUD-SPK-001', 'QSC-K12-001', 'available', 'excellent', 'Warehouse A'),
((SELECT id FROM models WHERE code = 'K12'), 'AUD-SPK-002', 'QSC-K12-002', 'rented', 'excellent', 'Client - XYZ Corp'),
-- Shure SM58 Microphones
((SELECT id FROM models WHERE code = 'SM58'), 'AUD-MIC-001', 'SH-SM58-001', 'available', 'good', 'Mic Case 1'),
((SELECT id FROM models WHERE code = 'SM58'), 'AUD-MIC-002', 'SH-SM58-002', 'available', 'good', 'Mic Case 1'),
((SELECT id FROM models WHERE code = 'SM58'), 'AUD-MIC-003', 'SH-SM58-003', 'rented', 'good', 'Client - ABC Event'),
-- XLR 10m Cables (quantity items - no serial)
((SELECT id FROM models WHERE code = 'XLR10'), 'CAB-XLR10-001', NULL, 'available', 'good', 'Cable Rack 1'),
((SELECT id FROM models WHERE code = 'XLR10'), 'CAB-XLR10-002', NULL, 'available', 'good', 'Cable Rack 1'),
((SELECT id FROM models WHERE code = 'XLR10'), 'CAB-XLR10-003', NULL, 'rented', 'fair', 'Client - ABC Event');

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (allow all for authenticated users)
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to subcategories" ON subcategories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to models" ON models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to assets" ON assets FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Create Indexes for Performance
-- =====================================================
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_models_subcategory ON models(subcategory_id);
CREATE INDEX idx_assets_model ON assets(model_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_location ON assets(location);
```

---

## Relationship Hierarchy

```
categories (1)
    ↓
subcategories (many)
    ↓
models (many)
    ↓
assets (many)
```

**Full Path Example:**

- Category: Audio (AUD)
- Subcategory: Mixers (MIX)
- Model: Allen & Heath SQ-5 (SQ5)
- Item: SKU=AUD-MIX-001, Serial=AH-SQ5-001
