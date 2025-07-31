-- Enhanced Construction Schema Migration
-- This migration adds additional construction-specific tables and relationships

-- ==========================================
-- 1. COMPANY & PARTNER MANAGEMENT
-- ==========================================

-- 1.1 Partner companies (협력업체)
CREATE TABLE IF NOT EXISTS partner_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    business_number TEXT UNIQUE,
    company_type TEXT CHECK (company_type IN ('general_contractor', 'subcontractor', 'supplier', 'consultant')),
    trade_type TEXT[], -- ['철근', '콘크리트', '전기', '배관', etc.]
    representative_name TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    bank_name TEXT,
    bank_account TEXT,
    credit_rating TEXT,
    contract_start_date DATE,
    contract_end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'terminated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- 1.2 Site-Partner assignments
CREATE TABLE IF NOT EXISTS site_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    partner_company_id UUID NOT NULL REFERENCES partner_companies(id),
    contract_amount DECIMAL(15,2),
    work_scope TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, partner_company_id)
);

-- ==========================================
-- 2. ENHANCED MATERIAL MANAGEMENT (NPC-1000)
-- ==========================================

-- 2.1 Material suppliers
CREATE TABLE IF NOT EXISTS material_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_company_id UUID REFERENCES partner_companies(id),
    supplier_name TEXT NOT NULL,
    supplier_code TEXT UNIQUE,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms TEXT,
    delivery_lead_time INTEGER, -- days
    is_preferred BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Material inventory
CREATE TABLE IF NOT EXISTS material_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    maximum_stock DECIMAL(10,2),
    last_purchase_date DATE,
    last_purchase_price DECIMAL(10,2),
    storage_location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, material_id)
);

-- 2.3 Material requests
CREATE TABLE IF NOT EXISTS material_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    request_number TEXT UNIQUE NOT NULL,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_by UUID NOT NULL REFERENCES profiles(id),
    required_date DATE NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'cancelled')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.4 Material request items
CREATE TABLE IF NOT EXISTS material_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_request_id UUID NOT NULL REFERENCES material_requests(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    requested_quantity DECIMAL(10,2) NOT NULL,
    approved_quantity DECIMAL(10,2),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(15,2),
    supplier_id UUID REFERENCES material_suppliers(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.5 Material transactions (입출고)
CREATE TABLE IF NOT EXISTS material_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'return', 'waste', 'adjustment')),
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    reference_type TEXT, -- 'daily_report', 'material_request', 'direct_purchase', etc.
    reference_id UUID,
    supplier_id UUID REFERENCES material_suppliers(id),
    delivery_note_number TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ==========================================
-- 3. ENHANCED WORKFORCE MANAGEMENT
-- ==========================================

-- 3.1 Worker skills/certifications
CREATE TABLE IF NOT EXISTS worker_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    certification_type TEXT NOT NULL, -- '용접기능사', '전기기능사', etc.
    certification_number TEXT,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    issuing_authority TEXT,
    file_attachment_id UUID REFERENCES file_attachments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Worker wage rates
CREATE TABLE IF NOT EXISTS worker_wage_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    daily_rate DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    overtime_rate DECIMAL(10,2),
    holiday_rate DECIMAL(10,2),
    skill_level TEXT CHECK (skill_level IN ('apprentice', 'skilled', 'expert', 'master')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 3.3 Enhanced attendance with GPS
CREATE TABLE IF NOT EXISTS attendance_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_record_id UUID NOT NULL REFERENCES attendance_records(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL CHECK (check_type IN ('in', 'out')),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    accuracy DECIMAL(6,2), -- meters
    address TEXT,
    device_info TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. SAFETY MANAGEMENT
-- ==========================================

-- 4.1 Safety training records
CREATE TABLE IF NOT EXISTS safety_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    training_date DATE NOT NULL,
    training_type TEXT NOT NULL, -- '정기안전교육', '특별안전교육', etc.
    trainer_name TEXT NOT NULL,
    duration_hours DECIMAL(4,2) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 4.2 Safety training attendees
CREATE TABLE IF NOT EXISTS safety_training_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_record_id UUID NOT NULL REFERENCES safety_training_records(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES profiles(id),
    attendance_status TEXT DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'late')),
    test_score INTEGER,
    certificate_issued BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(training_record_id, worker_id)
);

-- 4.3 Safety inspections
CREATE TABLE IF NOT EXISTS safety_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL,
    inspection_type TEXT NOT NULL, -- '일일점검', '주간점검', '월간점검', '특별점검'
    inspector_name TEXT NOT NULL,
    inspector_company TEXT,
    overall_status TEXT CHECK (overall_status IN ('safe', 'caution', 'danger')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- 4.4 Safety inspection items
CREATE TABLE IF NOT EXISTS safety_inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES safety_inspections(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- '추락방지', '전기안전', '중장비', etc.
    item_description TEXT NOT NULL,
    status TEXT CHECK (status IN ('pass', 'fail', 'na')),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    corrective_action TEXT,
    due_date DATE,
    responsible_person TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. QUALITY CONTROL
-- ==========================================

-- 5.1 Quality standards
CREATE TABLE IF NOT EXISTS quality_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_type TEXT NOT NULL,
    standard_name TEXT NOT NULL,
    specification TEXT,
    tolerance_range TEXT,
    test_method TEXT,
    reference_document TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5.2 Quality inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    work_log_id UUID REFERENCES work_logs(id),
    inspection_type TEXT NOT NULL, -- '자재검수', '시공검사', '완료검사'
    standard_id UUID REFERENCES quality_standards(id),
    inspector_name TEXT NOT NULL,
    inspection_result TEXT CHECK (inspection_result IN ('pass', 'fail', 'conditional_pass')),
    measured_values JSONB, -- Store various measurements
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- ==========================================
-- 6. PROGRESS & SCHEDULING
-- ==========================================

-- 6.1 Work schedules
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    schedule_name TEXT NOT NULL,
    work_type TEXT NOT NULL,
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    parent_schedule_id UUID REFERENCES work_schedules(id),
    sequence_order INTEGER,
    dependencies UUID[], -- Array of schedule IDs this depends on
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6.2 Schedule milestones
CREATE TABLE IF NOT EXISTS schedule_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES work_schedules(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    target_date DATE NOT NULL,
    completed_date DATE,
    is_critical BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. FINANCIAL TRACKING
-- ==========================================

-- 7.1 Project budgets
CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    budget_category TEXT NOT NULL, -- '노무비', '자재비', '장비비', '경비'
    budget_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    committed_amount DECIMAL(15,2) DEFAULT 0,
    fiscal_year INTEGER NOT NULL,
    fiscal_month INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.2 Daily labor costs
CREATE TABLE IF NOT EXISTS daily_labor_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    total_regular_hours DECIMAL(10,2) DEFAULT 0,
    total_overtime_hours DECIMAL(10,2) DEFAULT 0,
    total_holiday_hours DECIMAL(10,2) DEFAULT 0,
    regular_cost DECIMAL(15,2) DEFAULT 0,
    overtime_cost DECIMAL(15,2) DEFAULT 0,
    holiday_cost DECIMAL(15,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 8. WEATHER & ENVIRONMENTAL
-- ==========================================

-- 8.1 Weather conditions (enhanced)
CREATE TABLE IF NOT EXISTS weather_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    recorded_time TIME NOT NULL,
    weather_type TEXT, -- 'sunny', 'cloudy', 'rainy', 'snowy'
    temperature DECIMAL(4,1),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    precipitation DECIMAL(6,2),
    visibility DECIMAL(6,2),
    dust_level TEXT CHECK (dust_level IN ('good', 'moderate', 'bad', 'very_bad')),
    work_impact TEXT CHECK (work_impact IN ('none', 'minor', 'major', 'stop')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, recorded_date, recorded_time)
);

-- ==========================================
-- 9. DOCUMENT MANAGEMENT ENHANCEMENT
-- ==========================================

-- 9.1 Document categories
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES document_categories(id),
    category_name TEXT NOT NULL,
    category_code TEXT UNIQUE,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9.2 Document access logs
CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    accessed_by UUID NOT NULL REFERENCES profiles(id),
    access_type TEXT CHECK (access_type IN ('view', 'download', 'print', 'edit')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 10. COMMUNICATION & APPROVALS
-- ==========================================

-- 10.1 Work instructions
CREATE TABLE IF NOT EXISTS work_instructions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    instruction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    instruction_number TEXT UNIQUE NOT NULL,
    issued_by UUID NOT NULL REFERENCES profiles(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    due_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10.2 Work instruction recipients
CREATE TABLE IF NOT EXISTS work_instruction_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instruction_id UUID NOT NULL REFERENCES work_instructions(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id),
    is_primary BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(instruction_id, recipient_id)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Partner companies
CREATE INDEX idx_partner_companies_organization ON partner_companies(organization_id);
CREATE INDEX idx_partner_companies_status ON partner_companies(status);

-- Material management
CREATE INDEX idx_material_inventory_site ON material_inventory(site_id);
CREATE INDEX idx_material_requests_site ON material_requests(site_id);
CREATE INDEX idx_material_requests_status ON material_requests(status);
CREATE INDEX idx_material_transactions_site ON material_transactions(site_id);
CREATE INDEX idx_material_transactions_date ON material_transactions(transaction_date);

-- Workforce
CREATE INDEX idx_worker_certifications_worker ON worker_certifications(worker_id);
CREATE INDEX idx_worker_wage_rates_worker ON worker_wage_rates(worker_id);
CREATE INDEX idx_attendance_locations_record ON attendance_locations(attendance_record_id);

-- Safety
CREATE INDEX idx_safety_training_site ON safety_training_records(site_id);
CREATE INDEX idx_safety_training_date ON safety_training_records(training_date);
CREATE INDEX idx_safety_inspections_site ON safety_inspections(site_id);
CREATE INDEX idx_safety_inspections_date ON safety_inspections(inspection_date);

-- Quality
CREATE INDEX idx_quality_inspections_report ON quality_inspections(daily_report_id);

-- Scheduling
CREATE INDEX idx_work_schedules_site ON work_schedules(site_id);
CREATE INDEX idx_work_schedules_dates ON work_schedules(planned_start_date, planned_end_date);

-- Financial
CREATE INDEX idx_project_budgets_site ON project_budgets(site_id);
CREATE INDEX idx_daily_labor_costs_report ON daily_labor_costs(daily_report_id);

-- Weather
CREATE INDEX idx_weather_conditions_site_date ON weather_conditions(site_id, recorded_date);

-- Documents
CREATE INDEX idx_document_access_logs_document ON document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user ON document_access_logs(accessed_by);

-- Work instructions
CREATE INDEX idx_work_instructions_site ON work_instructions(site_id);
CREATE INDEX idx_work_instructions_date ON work_instructions(instruction_date);

-- ==========================================
-- ENABLE RLS ON ALL NEW TABLES
-- ==========================================

ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_wage_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_training_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_labor_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_instruction_recipients ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE TRIGGER FOR UPDATED_AT
-- ==========================================

-- Apply updated_at triggers to all new tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT DISTINCT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name IN (
            'partner_companies', 'site_partners', 'material_suppliers',
            'material_inventory', 'material_requests', 'worker_certifications',
            'worker_wage_rates', 'safety_training_records', 'quality_standards',
            'work_schedules', 'project_budgets', 'work_instructions'
        )
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON %I 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Enhanced construction schema created successfully.';
END $$;