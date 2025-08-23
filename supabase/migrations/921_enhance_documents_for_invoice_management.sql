-- Enhanced Documents Table for Invoice Document Management
-- Adds fields required for 기성청구문서함 (Invoice Document Management)

-- 1. Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS contract_phase VARCHAR(50) CHECK (contract_phase IN ('pre_contract', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS partner_company_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_required')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category);
CREATE INDEX IF NOT EXISTS idx_documents_contract_phase ON documents(contract_phase);
CREATE INDEX IF NOT EXISTS idx_documents_partner_company ON documents(partner_company_id);
CREATE INDEX IF NOT EXISTS idx_documents_approval_status ON documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_due_date ON documents(due_date);

-- 3. Update document_type values for consistency
-- Map existing document types to appropriate categories
UPDATE documents 
SET document_category = CASE 
    WHEN document_type IN ('contract', 'invoice', 'payment_request', 'tax_invoice') THEN 'invoice'
    WHEN document_type IN ('report', 'daily_report') THEN 'report'
    WHEN document_type IN ('blueprint', 'drawing') THEN 'technical'
    WHEN document_type = 'photo' THEN 'photo'
    ELSE 'general'
END
WHERE document_category = 'general';

-- 4. Add RLS policies for invoice documents
-- Partners can only view their own invoice documents
CREATE POLICY "Partners can view their invoice documents" ON documents
  FOR SELECT USING (
    document_category = 'invoice' AND 
    partner_company_id IN (
      SELECT o.id FROM organizations o
      JOIN profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid() AND p.role = 'partner'
    )
  );

-- Partners can create invoice documents for their company
CREATE POLICY "Partners can create their invoice documents" ON documents
  FOR INSERT WITH CHECK (
    document_category = 'invoice' AND 
    partner_company_id IN (
      SELECT o.id FROM organizations o
      JOIN profiles p ON p.organization_id = o.id
      WHERE p.id = auth.uid() AND p.role = 'partner'
    ) AND
    owner_id = auth.uid()
  );

-- Partners can update their own invoice documents (if not approved)
CREATE POLICY "Partners can update their invoice documents" ON documents
  FOR UPDATE USING (
    document_category = 'invoice' AND 
    owner_id = auth.uid() AND
    approval_status IN ('pending', 'revision_required')
  );

-- Admins can manage all invoice documents
CREATE POLICY "Admins can manage all invoice documents" ON documents
  FOR ALL USING (
    document_category = 'invoice' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'system_admin')
    )
  );

-- 5. Create invoice document workflow functions
CREATE OR REPLACE FUNCTION approve_invoice_document(
  document_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if approver is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = approver_id 
    AND role IN ('admin', 'system_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins can approve invoice documents';
  END IF;

  -- Update document approval status
  UPDATE documents 
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = NOW()
  WHERE id = document_id
  AND document_category = 'invoice';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create invoice document rejection function
CREATE OR REPLACE FUNCTION reject_invoice_document(
  document_id UUID,
  approver_id UUID,
  rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if approver is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = approver_id 
    AND role IN ('admin', 'system_admin')
  ) THEN
    RAISE EXCEPTION 'Only admins can reject invoice documents';
  END IF;

  -- Update document approval status
  UPDATE documents 
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = NOW(),
    description = COALESCE(description, '') || 
      CASE WHEN rejection_reason IS NOT NULL 
      THEN E'\n\n[거부 사유: ' || rejection_reason || ']'
      ELSE ''
      END
  WHERE id = document_id
  AND document_category = 'invoice';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create view for invoice document statistics
CREATE OR REPLACE VIEW invoice_document_stats AS
SELECT 
  partner_company_id,
  o.name as partner_company_name,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_documents,
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_documents,
  COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_documents,
  SUM(CASE WHEN approval_status = 'approved' THEN COALESCE(amount, 0) ELSE 0 END) as approved_amount,
  SUM(COALESCE(amount, 0)) as total_amount
FROM documents d
LEFT JOIN organizations o ON d.partner_company_id = o.id
WHERE d.document_category = 'invoice'
GROUP BY partner_company_id, o.name;

-- 8. Add comments for documentation
COMMENT ON COLUMN documents.document_category IS 'Document category: general, invoice, report, technical, photo';
COMMENT ON COLUMN documents.contract_phase IS 'Contract phase for invoice documents: pre_contract, in_progress, completed';
COMMENT ON COLUMN documents.partner_company_id IS 'Reference to partner company/organization for invoice documents';
COMMENT ON COLUMN documents.amount IS 'Monetary amount for invoice documents';
COMMENT ON COLUMN documents.approval_status IS 'Approval status for invoice documents: pending, approved, rejected, revision_required';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Invoice document management enhancements completed successfully.';
  RAISE NOTICE 'Added columns: document_category, contract_phase, partner_company_id, amount, due_date, approval_status, approved_by, approved_at';
  RAISE NOTICE 'Created RLS policies for partner access control';
  RAISE NOTICE 'Created approval/rejection functions for admin workflow';
END $$;