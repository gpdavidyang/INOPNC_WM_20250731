/**
 * Test data factories for consistent mock data generation
 * Provides factory functions for creating test data objects
 */

import { Profile, Site, DailyReport, AttendanceRecord, Organization } from '@/types'

/**
 * Counter for generating unique IDs
 */
let idCounter = 1000
const generateId = () => `test-id-${idCounter++}`

/**
 * Generate a random date within a range
 */
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Organization factory
 */
export const createMockOrganization = (overrides: Partial<Organization> = {}): Organization => ({
  id: generateId(),
  name: 'Test Construction Company',
  type: 'construction',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

/**
 * Profile factory
 */
export const createMockProfile = (overrides: Partial<Profile> = {}): Profile => {
  const organization = createMockOrganization()
  
  return {
    id: generateId(),
    email: 'test.user@example.com',
    full_name: 'Test User',
    phone: '+1234567890',
    role: 'worker',
    organization_id: organization.id,
    site_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization: organization,
    ...overrides,
  }
}

/**
 * Site factory
 */
export const createMockSite = (overrides: Partial<Site> = {}): Site => {
  const organization = createMockOrganization()
  
  return {
    id: generateId(),
    name: 'Test Construction Site',
    location: '123 Test Street, Test City',
    description: 'A test construction site for unit testing',
    status: 'active',
    start_date: new Date('2024-01-01').toISOString(),
    end_date: new Date('2024-12-31').toISOString(),
    organization_id: organization.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    organization: organization,
    ...overrides,
  }
}

/**
 * Daily report factory
 */
export const createMockDailyReport = (overrides: Partial<DailyReport> = {}): DailyReport => {
  const site = createMockSite()
  const profile = createMockProfile({ site_id: site.id })
  
  return {
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    weather_condition: 'sunny',
    temperature: 22,
    work_description: 'Test work activities performed today',
    materials_used: 'Concrete, Steel bars, Tools',
    equipment_used: 'Excavator, Crane',
    safety_incidents: null,
    quality_issues: null,
    progress_notes: 'Work progressing as scheduled',
    site_id: site.id,
    created_by: profile.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    site: site,
    creator: profile,
    ...overrides,
  }
}

/**
 * Attendance record factory
 */
export const createMockAttendanceRecord = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => {
  const site = createMockSite()
  const profile = createMockProfile({ site_id: site.id })
  
  return {
    id: generateId(),
    date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00:00',
    check_out_time: '17:00:00',
    total_hours: 8,
    overtime_hours: 0,
    notes: 'Regular work day',
    status: 'present',
    worker_id: profile.id,
    site_id: site.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    worker: profile,
    site: site,
    ...overrides,
  }
}

/**
 * Factory for creating multiple related records
 */
export const createMockWorkflowData = (options: {
  organizationCount?: number
  sitesPerOrganization?: number
  workersPerSite?: number
  reportsPerWorker?: number
} = {}) => {
  const {
    organizationCount = 1,
    sitesPerOrganization = 2,
    workersPerSite = 3,
    reportsPerWorker = 5,
  } = options

  const organizations: Organization[] = []
  const sites: Site[] = []
  const profiles: Profile[] = []
  const dailyReports: DailyReport[] = []
  const attendanceRecords: AttendanceRecord[] = []

  // Create organizations
  for (let i = 0; i < organizationCount; i++) {
    const org = createMockOrganization({
      name: `Test Organization ${i + 1}`,
    })
    organizations.push(org)

    // Create sites for each organization
    for (let j = 0; j < sitesPerOrganization; j++) {
      const site = createMockSite({
        name: `Test Site ${j + 1}`,
        organization_id: org.id,
        organization: org,
      })
      sites.push(site)

      // Create workers for each site
      for (let k = 0; k < workersPerSite; k++) {
        const worker = createMockProfile({
          full_name: `Test Worker ${k + 1}`,
          email: `worker${k + 1}.site${j + 1}.org${i + 1}@example.com`,
          organization_id: org.id,
          site_id: site.id,
          organization: org,
        })
        profiles.push(worker)

        // Create reports for each worker
        for (let l = 0; l < reportsPerWorker; l++) {
          const date = new Date()
          date.setDate(date.getDate() - l)
          
          const report = createMockDailyReport({
            date: date.toISOString().split('T')[0],
            site_id: site.id,
            created_by: worker.id,
            site: site,
            creator: worker,
          })
          dailyReports.push(report)

          const attendance = createMockAttendanceRecord({
            date: date.toISOString().split('T')[0],
            worker_id: worker.id,
            site_id: site.id,
            worker: worker,
            site: site,
          })
          attendanceRecords.push(attendance)
        }
      }
    }
  }

  return {
    organizations,
    sites,
    profiles,
    dailyReports,
    attendanceRecords,
  }
}

/**
 * Factory for creating test users with specific roles
 */
export const createMockUsersByRole = () => {
  const organization = createMockOrganization()
  const site = createMockSite({ organization_id: organization.id })

  return {
    worker: createMockProfile({
      role: 'worker',
      organization_id: organization.id,
      site_id: site.id,
      full_name: 'Test Worker',
      email: 'worker@test.com',
    }),
    siteManager: createMockProfile({
      role: 'site_manager',
      organization_id: organization.id,
      site_id: site.id,
      full_name: 'Test Site Manager',
      email: 'manager@test.com',
    }),
    customerManager: createMockProfile({
      role: 'customer_manager',
      organization_id: organization.id,
      site_id: null,
      full_name: 'Test Customer Manager',
      email: 'customer@test.com',
    }),
    admin: createMockProfile({
      role: 'admin',
      organization_id: organization.id,
      site_id: null,
      full_name: 'Test Admin',
      email: 'admin@test.com',
    }),
    systemAdmin: createMockProfile({
      role: 'system_admin',
      organization_id: null,
      site_id: null,
      full_name: 'Test System Admin',
      email: 'system.admin@test.com',
    }),
  }
}

/**
 * Factory for creating error scenarios
 */
export const createMockErrorScenarios = () => ({
  databaseError: {
    message: 'Database connection failed',
    details: 'Unable to connect to PostgreSQL database',
    hint: 'Check database credentials and network connectivity',
    code: '08006',
  },
  validationError: {
    message: 'Validation failed',
    details: 'One or more fields contain invalid data',
    hint: 'Check required fields and data formats',
    code: '23514',
  },
  authenticationError: {
    message: 'Authentication failed',
    details: 'Invalid credentials provided',
    hint: 'Check email and password',
    code: '28000',
  },
  authorizationError: {
    message: 'Insufficient permissions',
    details: 'User does not have required role',
    hint: 'Contact administrator for access',
    code: '42501',
  },
  notFoundError: {
    message: 'Record not found',
    details: 'The requested resource does not exist',
    hint: 'Check the ID and try again',
    code: '02000',
  },
})

/**
 * Factory for creating form test data
 */
export const createMockFormData = () => ({
  validDailyReport: {
    date: new Date().toISOString().split('T')[0],
    weather_condition: 'sunny',
    temperature: '22',
    work_description: 'Completed foundation work',
    materials_used: 'Concrete, steel reinforcement',
    equipment_used: 'Excavator, concrete mixer',
    progress_notes: 'Work proceeding on schedule',
  },
  validAttendance: {
    date: new Date().toISOString().split('T')[0],
    check_in_time: '08:00',
    check_out_time: '17:00',
    notes: 'Regular work day',
  },
  validProfile: {
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    role: 'worker',
  },
  invalidFormData: {
    emptyRequired: {
      date: '',
      work_description: '',
    },
    invalidEmail: {
      email: 'invalid-email-format',
    },
    invalidPhone: {
      phone: '123', // Too short
    },
    invalidDate: {
      date: '2025-13-45', // Invalid date
    },
  },
})

/**
 * Factory for creating API response data
 */
export const createMockApiResponses = () => ({
  successResponse: {
    data: createMockDailyReport(),
    error: null,
  },
  errorResponse: {
    data: null,
    error: createMockErrorScenarios().databaseError,
  },
  emptyResponse: {
    data: [],
    error: null,
  },
  paginatedResponse: {
    data: Array.from({ length: 10 }, () => createMockDailyReport()),
    count: 50,
    error: null,
  },
})

/**
 * Utility to create bulk test data
 */
export const createBulkTestData = <T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] => {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesFn ? overridesFn(index) : {}
    return factory(overrides)
  })
}

/**
 * Utility to create test data with relationships
 */
export const createRelatedTestData = () => {
  const organization = createMockOrganization()
  const site = createMockSite({ organization_id: organization.id })
  const worker = createMockProfile({ 
    organization_id: organization.id, 
    site_id: site.id 
  })
  const manager = createMockProfile({ 
    role: 'site_manager',
    organization_id: organization.id, 
    site_id: site.id 
  })
  const report = createMockDailyReport({ 
    site_id: site.id, 
    created_by: worker.id 
  })
  const attendance = createMockAttendanceRecord({ 
    worker_id: worker.id, 
    site_id: site.id 
  })

  return {
    organization,
    site,
    worker,
    manager,
    report,
    attendance,
  }
}