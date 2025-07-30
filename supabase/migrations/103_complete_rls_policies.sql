-- Complete RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_report_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Activity Logs policies
CREATE POLICY "Users can view activity logs for their organization" ON public.activity_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.organization_id = (SELECT organization_id FROM profiles WHERE id = activity_logs.user_id)
      OR p.role IN ('admin', 'system_admin')
    )
  )
);

-- Announcements policies
CREATE POLICY "Anyone can view active announcements" ON public.announcements
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage announcements" ON public.announcements
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
  )
);

-- Approval Requests policies
CREATE POLICY "Users can view their approval requests" ON public.approval_requests
FOR SELECT USING (
  requester_id = auth.uid() OR 
  approver_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'site_manager')
  )
);

CREATE POLICY "Users can create approval requests" ON public.approval_requests
FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Approvers can update requests" ON public.approval_requests
FOR UPDATE USING (
  approver_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
  )
);

-- Salary Info policies
CREATE POLICY "Users can view own salary info" ON public.salary_info
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage salary info" ON public.salary_info
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
  )
);

-- Site Assignments policies
CREATE POLICY "Users can view their site assignments" ON public.site_assignments
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'site_manager')
  )
);

CREATE POLICY "Managers can manage site assignments" ON public.site_assignments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'site_manager')
  )
);

-- Document Shares policies
CREATE POLICY "Users can view shares for documents they own or are shared with" ON public.document_shares
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_shares.document_id
    AND (d.owner_id = auth.uid() OR document_shares.shared_with_id = auth.uid())
  )
);

CREATE POLICY "Document owners can manage shares" ON public.document_shares
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_shares.document_id AND d.owner_id = auth.uid()
  )
);

-- Daily Report Workers policies
CREATE POLICY "View daily report workers" ON public.daily_report_workers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM daily_reports dr
    WHERE dr.id = daily_report_workers.report_id
    AND (
      dr.reported_by = auth.uid() OR
      daily_report_workers.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'system_admin', 'site_manager')
      )
    )
  )
);

CREATE POLICY "Report creators can manage workers" ON public.daily_report_workers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM daily_reports dr
    WHERE dr.id = daily_report_workers.report_id AND dr.reported_by = auth.uid()
  )
);

-- User Organizations policies
CREATE POLICY "Users can view their organization memberships" ON public.user_organizations
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage organization memberships" ON public.user_organizations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'system_admin')
  )
);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;