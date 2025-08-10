-- Sample sites data for testing
-- 테스트용 샘플 현장 데이터 추가

-- Insert sample organizations first (if not exists)
INSERT INTO organizations (id, name, type, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '이노피앤씨', 'partner', 'active'),
  ('22222222-2222-2222-2222-222222222222', '삼성건설', 'customer', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample sites
INSERT INTO sites (name, code, address, status, organization_id, construction_start, construction_end)
VALUES 
  ('삼성전자 평택캠퍼스 P3', 'P3-2024', '경기도 평택시 고덕산업단지', 'active', '22222222-2222-2222-2222-222222222222', '2024-01-01', '2025-12-31'),
  ('SK하이닉스 이천 M16', 'M16-2024', '경기도 이천시 부발읍', 'active', '22222222-2222-2222-2222-222222222222', '2024-03-01', '2025-06-30'),
  ('LG에너지솔루션 오창공장', 'LG-2024', '충청북도 청주시 오창읍', 'active', '22222222-2222-2222-2222-222222222222', '2024-02-15', '2025-08-31'),
  ('현대자동차 울산공장 증축', 'HMC-2024', '울산광역시 북구 양정동', 'active', '22222222-2222-2222-2222-222222222222', '2024-04-01', '2025-10-31'),
  ('포스코 광양제철소 고로 개수', 'POSCO-2024', '전라남도 광양시 태인동', 'completed', '22222222-2222-2222-2222-222222222222', '2023-01-01', '2024-06-30')
ON CONFLICT (name) DO UPDATE SET
  status = EXCLUDED.status,
  address = EXCLUDED.address,
  construction_start = EXCLUDED.construction_start,
  construction_end = EXCLUDED.construction_end;

-- Add site managers (현장 관리자 추가)
-- First, make sure we have some manager profiles
UPDATE profiles 
SET role = 'site_manager' 
WHERE email IN ('manager@inopnc.com', 'admin@inopnc.com')
  AND role != 'site_manager';

-- You can also add site addresses if needed
-- INSERT INTO site_addresses (site_id, full_address, latitude, longitude, postal_code)
-- SELECT id, address, NULL, NULL, NULL 
-- FROM sites
-- WHERE NOT EXISTS (
--   SELECT 1 FROM site_addresses WHERE site_addresses.site_id = sites.id
-- );