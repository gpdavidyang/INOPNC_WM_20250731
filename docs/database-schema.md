# INOPNC Construction Database Schema Documentation

## Overview

The INOPNC Work Management System uses a comprehensive database schema designed specifically for construction project management. The schema supports multi-tenant operations with row-level security (RLS) and covers all aspects of construction management.

## Core Entity Groups

### 1. User & Organization Management
- **profiles**: User profiles with roles and permissions
- **organizations**: Company hierarchy (head office, branches, departments)
- **sites**: Construction sites with project details

### 2. Partner & Subcontractor Management
- **partner_companies**: External companies (contractors, suppliers, consultants)
- **site_partners**: Partner assignments to specific sites
- **subcontractors**: Subcontractor companies
- **subcontractor_workers**: Daily subcontractor workforce records

### 3. Daily Operations
- **daily_reports**: Main daily work logs
- **work_logs**: Detailed work activities
- **work_log_materials**: Materials used in specific work activities
- **attendance_records**: Worker attendance tracking
- **attendance_locations**: GPS-based check-in/out locations

### 4. Material Management (NPC-1000 Standard)
- **material_categories**: Hierarchical material classification
- **materials**: Material master data
- **material_suppliers**: Supplier information
- **material_inventory**: Site-specific stock levels
- **material_requests**: Material requisitions
- **material_request_items**: Line items for requests
- **material_transactions**: Stock movements (in/out/waste)

### 5. Workforce Management
- **worker_certifications**: Skills and certifications
- **worker_wage_rates**: Pay rate history
- **attendance_records**: Daily attendance
- **attendance_locations**: GPS tracking for check-in/out

### 6. Safety Management
- **safety_training_records**: Training sessions
- **safety_training_attendees**: Training participation
- **safety_inspections**: Regular safety checks
- **safety_inspection_items**: Detailed inspection items
- **safety_incidents**: Incident reports

### 7. Equipment Management
- **equipment**: Equipment/machinery registry
- **equipment_usage**: Daily equipment utilization

### 8. Quality Control
- **quality_standards**: Work quality specifications
- **quality_inspections**: Quality check records

### 9. Project Scheduling
- **work_schedules**: Project timeline and milestones
- **schedule_milestones**: Key project dates

### 10. Financial Tracking
- **project_budgets**: Budget allocations by category
- **daily_labor_costs**: Calculated labor costs

### 11. Environmental Conditions
- **weather_conditions**: Weather impact on work

### 12. Document Management
- **documents**: File storage and sharing
- **document_categories**: Document organization
- **document_access_logs**: Access audit trail
- **file_attachments**: Generic file attachments

### 13. Communication & Approvals
- **notifications**: User notifications
- **announcements**: Site/role-based announcements
- **approval_requests**: Workflow approvals
- **work_instructions**: Site directives
- **work_instruction_recipients**: Instruction distribution

## Key Features

### Row Level Security (RLS)
All tables implement RLS policies based on:
- User organization membership
- Site assignments
- Role-based permissions
- Document ownership

### Audit Trail
Most tables include:
- `created_at`, `updated_at` timestamps
- `created_by`, `updated_by` user references
- Automatic trigger for `updated_at`

### Multi-tenancy
- Organization-based data isolation
- Site-level access control
- Role-based feature access

## User Roles

1. **worker**: Basic worker
   - View own attendance
   - Submit daily reports
   - View assigned site information

2. **site_manager**: Site supervisor
   - Manage site operations
   - Approve reports
   - Manage attendance

3. **customer_manager**: External partner access
   - View relevant project data
   - Limited modification rights

4. **admin**: Organization administrator
   - Full access within organization
   - User management
   - Financial visibility

5. **system_admin**: System-wide administrator
   - Cross-organization access
   - System configuration
   - Full database access

## Common Queries

### Get today's attendance for a site
```sql
SELECT a.*, p.full_name 
FROM attendance_records a
JOIN profiles p ON a.worker_id = p.id
WHERE a.daily_report_id IN (
  SELECT id FROM daily_reports 
  WHERE site_id = ? AND report_date = CURRENT_DATE
);
```

### Material stock levels by site
```sql
SELECT m.name, m.code, mi.current_stock, mi.minimum_stock
FROM material_inventory mi
JOIN materials m ON mi.material_id = m.id
WHERE mi.site_id = ?
AND mi.current_stock < mi.minimum_stock;
```

### Daily report with all details
```sql
SELECT 
  dr.*,
  s.name as site_name,
  array_agg(DISTINCT wl.*) as work_logs,
  array_agg(DISTINCT ar.*) as attendance
FROM daily_reports dr
JOIN sites s ON dr.site_id = s.id
LEFT JOIN work_logs wl ON wl.daily_report_id = dr.id
LEFT JOIN attendance_records ar ON ar.daily_report_id = dr.id
WHERE dr.id = ?
GROUP BY dr.id, s.name;
```

## Migration Strategy

1. Run migrations in sequence (check `/supabase/migrations/`)
2. Key migrations:
   - `101_complete_construction_schema.sql`: Core tables
   - `104_enhanced_construction_schema.sql`: Extended features
   - `105_enhanced_rls_policies.sql`: Security policies

3. After migration:
   - Verify RLS policies are active
   - Test with different user roles
   - Check indexes are created

## Best Practices

1. **Always use RLS**: Never disable RLS on tables
2. **Audit fields**: Always populate created_by/updated_by
3. **Soft deletes**: Use status fields instead of hard deletes
4. **Normalized data**: Avoid duplicating reference data
5. **Indexed queries**: Use indexes for common query patterns

## Performance Considerations

1. **Indexes**: Created on all foreign keys and common query fields
2. **Partitioning**: Consider partitioning large tables by date
3. **Archival**: Move old daily_reports to archive tables
4. **Caching**: Cache material and worker data at application level

## Security Notes

1. All user passwords handled by Supabase Auth
2. Sensitive data (wages, financial) restricted by RLS
3. GPS locations stored but access controlled
4. Document access logged for audit trail
5. API keys and secrets never stored in database