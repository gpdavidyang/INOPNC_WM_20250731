-- Comprehensive NPC-1000 Material Data Migration
-- Insert realistic material data for NPC-1000 management tab
-- Ensures proper mapping to sites, daily reports, and data integrity

-- ==========================================
-- 1. INSERT ADDITIONAL MATERIAL SUPPLIERS
-- ==========================================
INSERT INTO material_suppliers (name, contact_person, phone, email, address, business_number) VALUES
('삼성종합건설(주)', '김현준', '02-2145-7890', 'materials@samsung.co.kr', '서울시 강남구 테헤란로 521', '456-78-90123'),
('대우건설자재', '박소영', '031-234-5678', 'supply@daewoo.co.kr', '경기도 성남시 분당구 판교로 235', '567-89-01234'),
('현대건설재료(주)', '이승호', '02-789-0123', 'info@hyundai-materials.com', '서울시 서초구 반포대로 58', '678-90-12345'),
('포스코건설자재', '정미래', '032-456-7890', 'sales@posco.co.kr', '인천시 연수구 송도과학로 267', '789-01-23456'),
('GS건설재료', '최동욱', '02-345-6789', 'contact@gs-materials.kr', '서울시 종로구 종로 33', '890-12-34567')
ON CONFLICT (business_number) DO NOTHING;

-- ==========================================
-- 2. INSERT ADDITIONAL MATERIAL CATEGORIES
-- ==========================================
INSERT INTO material_categories (code, name, description, parent_id, level, display_order) 
SELECT 
  'C03', '그라우트', 'Grout materials', id, 2, 3
FROM material_categories WHERE code = 'C';

INSERT INTO material_categories (code, name, description, parent_id, level, display_order) 
SELECT 
  'C04', '몰탈', 'Mortar materials', id, 2, 4
FROM material_categories WHERE code = 'C';

INSERT INTO material_categories (code, name, description, parent_id, level, display_order) 
SELECT 
  'C05', '접착제', 'Adhesive materials', id, 2, 5
FROM material_categories WHERE code = 'C';

-- ==========================================
-- 3. INSERT COMPREHENSIVE NPC-1000 MATERIALS
-- ==========================================
INSERT INTO materials (category_id, name, unit, unit_price, material_code, supplier_id, description) VALUES
-- NPC-1000 Series
(
    (SELECT id FROM material_categories WHERE name = '그라우트' LIMIT 1),
    'NPC-1000 무수축 그라우트',
    'kg',
    1200.00,
    'NPC-1000',
    (SELECT id FROM material_suppliers WHERE name = '한국건설자재(주)' LIMIT 1),
    '고강도 무수축 그라우트, 압축강도 60MPa 이상'
),
(
    (SELECT id FROM material_categories WHERE name = '그라우트' LIMIT 1),
    'NPC-1000S 속경성 그라우트',
    'kg',
    1350.00,
    'NPC-1000S',
    (SELECT id FROM material_suppliers WHERE name = '한국건설자재(주)' LIMIT 1),
    '속경성 무수축 그라우트, 조기강도 발현'
),
(
    (SELECT id FROM material_categories WHERE name = '그라우트' LIMIT 1),
    'NPC-1000F 유동성 그라우트',
    'kg',
    1280.00,
    'NPC-1000F',
    (SELECT id FROM material_suppliers WHERE name = '대한시멘트' LIMIT 1),
    '고유동성 무수축 그라우트, 펌핑성 우수'
),
(
    (SELECT id FROM material_categories WHERE name = '그라우트' LIMIT 1),
    'NPC-1000W 방수 그라우트',
    'kg',
    1450.00,
    'NPC-1000W',
    (SELECT id FROM material_suppliers WHERE name = '삼성종합건설(주)' LIMIT 1),
    '방수형 무수축 그라우트, 수밀성 강화'
),
(
    (SELECT id FROM material_categories WHERE name = '그라우트' LIMIT 1),
    'NPC-1000H 고온용 그라우트',
    'kg',
    1380.00,
    'NPC-1000H',
    (SELECT id FROM material_suppliers WHERE name = '현대건설재료(주)' LIMIT 1),
    '고온환경용 무수축 그라우트, 80℃까지 사용가능'
),
-- Related Materials
(
    (SELECT id FROM material_categories WHERE name = '시멘트' LIMIT 1),
    'NPC 전용 시멘트',
    'kg',
    450.00,
    'NPC-CEMENT',
    (SELECT id FROM material_suppliers WHERE name = '대한시멘트' LIMIT 1),
    'NPC-1000 시리즈 전용 특수 시멘트'
),
(
    (SELECT id FROM material_categories WHERE name = '접착제' LIMIT 1),
    'NPC 접착증강제',
    'L',
    2800.00,
    'NPC-BOND',
    (SELECT id FROM material_suppliers WHERE name = '포스코건설자재' LIMIT 1),
    'NPC 그라우트 접착력 증강용 첨가제'
),
(
    (SELECT id FROM material_categories WHERE name = '몰탈' LIMIT 1),
    'NPC 보수몰탈',
    'kg',
    890.00,
    'NPC-REPAIR',
    (SELECT id FROM material_suppliers WHERE name = 'GS건설재료' LIMIT 1),
    'NPC 계열 콘크리트 보수용 몰탈'
)
ON CONFLICT (material_code) DO NOTHING;

-- ==========================================
-- 4. INSERT MATERIAL INVENTORY FOR ALL SITES
-- ==========================================

-- Get all sites and insert inventory for each
INSERT INTO material_inventory (site_id, material_id, current_stock, minimum_stock, maximum_stock, last_checked_at, created_by)
SELECT 
    s.id as site_id,
    m.id as material_id,
    CASE 
        WHEN m.material_code = 'NPC-1000' THEN 850.00 + (RANDOM() * 300)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000S' THEN 420.00 + (RANDOM() * 200)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000F' THEN 380.00 + (RANDOM() * 150)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000W' THEN 290.00 + (RANDOM() * 100)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000H' THEN 180.00 + (RANDOM() * 80)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-CEMENT' THEN 1200.00 + (RANDOM() * 500)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-BOND' THEN 45.00 + (RANDOM() * 25)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-REPAIR' THEN 320.00 + (RANDOM() * 180)::DECIMAL(10,2)
        ELSE 100.00
    END as current_stock,
    CASE 
        WHEN m.material_code = 'NPC-1000' THEN 500.00
        WHEN m.material_code = 'NPC-1000S' THEN 300.00
        WHEN m.material_code = 'NPC-1000F' THEN 250.00
        WHEN m.material_code = 'NPC-1000W' THEN 200.00
        WHEN m.material_code = 'NPC-1000H' THEN 150.00
        WHEN m.material_code = 'NPC-CEMENT' THEN 800.00
        WHEN m.material_code = 'NPC-BOND' THEN 30.00
        WHEN m.material_code = 'NPC-REPAIR' THEN 200.00
        ELSE 50.00
    END as minimum_stock,
    CASE 
        WHEN m.material_code = 'NPC-1000' THEN 2000.00
        WHEN m.material_code = 'NPC-1000S' THEN 1000.00
        WHEN m.material_code = 'NPC-1000F' THEN 800.00
        WHEN m.material_code = 'NPC-1000W' THEN 600.00
        WHEN m.material_code = 'NPC-1000H' THEN 500.00
        WHEN m.material_code = 'NPC-CEMENT' THEN 3000.00
        WHEN m.material_code = 'NPC-BOND' THEN 100.00
        WHEN m.material_code = 'NPC-REPAIR' THEN 800.00
        ELSE 200.00
    END as maximum_stock,
    NOW() - INTERVAL '1 day' * (RANDOM() * 7)::INTEGER as last_checked_at,
    (SELECT id FROM profiles WHERE role IN ('admin', 'system_admin') LIMIT 1) as created_by
FROM sites s
CROSS JOIN materials m
WHERE m.material_code IN ('NPC-1000', 'NPC-1000S', 'NPC-1000F', 'NPC-1000W', 'NPC-1000H', 'NPC-CEMENT', 'NPC-BOND', 'NPC-REPAIR')
ON CONFLICT (site_id, material_id) DO UPDATE SET
    current_stock = EXCLUDED.current_stock,
    minimum_stock = EXCLUDED.minimum_stock,
    maximum_stock = EXCLUDED.maximum_stock,
    last_checked_at = EXCLUDED.last_checked_at;

-- ==========================================
-- 5. INSERT MATERIAL REQUESTS
-- ==========================================

-- Insert material requests for active sites
INSERT INTO material_requests (site_id, requested_by, required_date, priority, status, notes, created_at)
SELECT 
    s.id as site_id,
    p.id as requested_by,
    CURRENT_DATE + INTERVAL '3 days' + (RANDOM() * INTERVAL '10 days') as required_date,
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN 'urgent'
        WHEN 1 THEN 'high'
        WHEN 2 THEN 'normal'
        ELSE 'low'
    END as priority,
    CASE (RANDOM() * 5)::INTEGER
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'approved'
        WHEN 2 THEN 'ordered'
        WHEN 3 THEN 'delivered'
        ELSE 'pending'
    END as status,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN '기초공사용 NPC-1000 그라우트 필요'
        WHEN 1 THEN '긴급 보수작업을 위한 자재 요청'
        ELSE '정기 자재 보충 요청'
    END as notes,
    NOW() - INTERVAL '1 day' * (RANDOM() * 14)::INTEGER as created_at
FROM sites s
CROSS JOIN profiles p
WHERE s.site_status = 'active'
AND p.role IN ('worker', 'site_manager')
LIMIT 15;

-- Insert material request items
INSERT INTO material_request_items (request_id, material_id, requested_quantity, approved_quantity, delivered_quantity, notes)
SELECT 
    mr.id as request_id,
    m.id as material_id,
    CASE 
        WHEN m.material_code = 'NPC-1000' THEN 200.00 + (RANDOM() * 300)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000S' THEN 100.00 + (RANDOM() * 150)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000F' THEN 150.00 + (RANDOM() * 100)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-CEMENT' THEN 500.00 + (RANDOM() * 200)::DECIMAL(10,2)
        ELSE 50.00 + (RANDOM() * 100)::DECIMAL(10,2)
    END as requested_quantity,
    CASE mr.status
        WHEN 'approved' THEN (200.00 + (RANDOM() * 300)::DECIMAL(10,2)) * 0.9
        WHEN 'delivered' THEN (200.00 + (RANDOM() * 300)::DECIMAL(10,2)) * 0.95
        ELSE NULL
    END as approved_quantity,
    CASE mr.status
        WHEN 'delivered' THEN (200.00 + (RANDOM() * 300)::DECIMAL(10,2)) * 0.92
        ELSE NULL
    END as delivered_quantity,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN '기초 앵커볼트 고정용'
        WHEN 1 THEN '콘크리트 보수 작업용'
        ELSE '구조물 접합부 충진용'
    END as notes
FROM material_requests mr
CROSS JOIN materials m
WHERE m.material_code IN ('NPC-1000', 'NPC-1000S', 'NPC-1000F', 'NPC-CEMENT')
AND RANDOM() < 0.6; -- Only add items to 60% of requests

-- ==========================================
-- 6. INSERT MATERIAL TRANSACTIONS
-- ==========================================

-- Insert realistic material transactions
INSERT INTO material_transactions (site_id, material_id, transaction_type, quantity, reference_type, performed_by, notes, created_at)
SELECT 
    s.id as site_id,
    m.id as material_id,
    CASE (RANDOM() * 5)::INTEGER
        WHEN 0 THEN 'in'
        WHEN 1 THEN 'out'
        WHEN 2 THEN 'return'
        WHEN 3 THEN 'waste'
        ELSE 'adjustment'
    END as transaction_type,
    CASE 
        WHEN m.material_code = 'NPC-1000' THEN 25.00 + (RANDOM() * 75)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000S' THEN 15.00 + (RANDOM() * 45)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-1000F' THEN 20.00 + (RANDOM() * 60)::DECIMAL(10,2)
        WHEN m.material_code = 'NPC-CEMENT' THEN 50.00 + (RANDOM() * 150)::DECIMAL(10,2)
        ELSE 10.00 + (RANDOM() * 30)::DECIMAL(10,2)
    END as quantity,
    CASE (RANDOM() * 3)::INTEGER
        WHEN 0 THEN 'daily_report'
        WHEN 1 THEN 'material_request'
        ELSE 'manual'
    END as reference_type,
    p.id as performed_by,
    CASE (RANDOM() * 4)::INTEGER
        WHEN 0 THEN '기초공사 NPC-1000 사용'
        WHEN 1 THEN '앵커볼트 고정 작업'
        WHEN 2 THEN '콘크리트 보수 작업'
        ELSE '구조물 접합부 시공'
    END as notes,
    NOW() - INTERVAL '1 day' * (RANDOM() * 30)::INTEGER as created_at
FROM sites s
CROSS JOIN materials m
CROSS JOIN profiles p
WHERE s.site_status = 'active'
AND m.material_code IN ('NPC-1000', 'NPC-1000S', 'NPC-1000F', 'NPC-1000W', 'NPC-CEMENT', 'NPC-BOND')
AND p.role IN ('worker', 'site_manager')
AND RANDOM() < 0.3 -- Only create transactions for 30% of combinations
LIMIT 100;

-- ==========================================
-- 7. UPDATE INVENTORY BASED ON TRANSACTIONS
-- ==========================================

-- Update current stock based on transactions
UPDATE material_inventory 
SET current_stock = current_stock + COALESCE(transaction_totals.net_quantity, 0),
    updated_at = NOW()
FROM (
    SELECT 
        site_id,
        material_id,
        SUM(
            CASE 
                WHEN transaction_type = 'in' THEN quantity
                WHEN transaction_type = 'out' THEN -quantity
                WHEN transaction_type = 'return' THEN quantity
                WHEN transaction_type = 'waste' THEN -quantity
                WHEN transaction_type = 'adjustment' THEN quantity
                ELSE 0
            END
        ) as net_quantity
    FROM material_transactions
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY site_id, material_id
) as transaction_totals
WHERE material_inventory.site_id = transaction_totals.site_id
AND material_inventory.material_id = transaction_totals.material_id;

-- ==========================================
-- 8. CREATE SOME LOW STOCK ALERTS
-- ==========================================

-- Intentionally set some materials to low stock for demonstration
UPDATE material_inventory 
SET current_stock = minimum_stock * 0.8
WHERE material_id IN (
    SELECT id FROM materials WHERE material_code IN ('NPC-1000', 'NPC-1000S') LIMIT 2
)
AND site_id IN (
    SELECT id FROM sites WHERE site_status = 'active' LIMIT 2
);

-- ==========================================
-- 9. ADD MATERIAL USAGE TO DAILY REPORTS
-- ==========================================

-- Link some material usage to existing daily reports for better integration
UPDATE daily_reports 
SET 
    materials_used = CASE 
        WHEN RANDOM() < 0.7 THEN jsonb_build_array(
            jsonb_build_object(
                'material_code', 'NPC-1000',
                'material_name', 'NPC-1000 무수축 그라우트',
                'quantity_used', (25 + RANDOM() * 50)::INTEGER,
                'unit', 'kg',
                'usage_purpose', '기초 앵커볼트 고정'
            ),
            jsonb_build_object(
                'material_code', 'NPC-CEMENT',
                'material_name', 'NPC 전용 시멘트',
                'quantity_used', (15 + RANDOM() * 30)::INTEGER,
                'unit', 'kg',
                'usage_purpose', '그라우트 혼합용'
            )
        )
        ELSE '[]'::jsonb
    END,
    updated_at = NOW()
WHERE created_at >= NOW() - INTERVAL '30 days'
AND site_id IN (SELECT id FROM sites WHERE site_status = 'active')
AND RANDOM() < 0.4; -- Update 40% of recent daily reports

-- ==========================================
-- 10. SUMMARY STATISTICS UPDATE
-- ==========================================

-- Create a function to get material summary statistics
CREATE OR REPLACE FUNCTION get_material_summary_stats()
RETURNS TABLE (
    total_materials INTEGER,
    total_inventory_value DECIMAL(15,2),
    low_stock_items INTEGER,
    pending_requests INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM materials WHERE material_code LIKE 'NPC-%'),
        (SELECT COALESCE(SUM(mi.current_stock * m.unit_price), 0)
         FROM material_inventory mi
         JOIN materials m ON mi.material_id = m.id
         WHERE m.material_code LIKE 'NPC-%'),
        (SELECT COUNT(*)::INTEGER 
         FROM material_inventory mi 
         WHERE mi.current_stock <= mi.minimum_stock),
        (SELECT COUNT(*)::INTEGER 
         FROM material_requests 
         WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql;

-- Add comment for tracking
COMMENT ON FUNCTION get_material_summary_stats() IS 'Returns summary statistics for NPC-1000 material management dashboard';