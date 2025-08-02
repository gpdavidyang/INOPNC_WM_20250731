#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testWorkerAssignmentSystem() {
  console.log('🧪 Testing Worker Assignment System...\n')
  
  try {
    // 1. Test Worker Skills Table
    console.log('1️⃣ Testing Worker Skills Table...')
    const { data: skills, error: skillsError } = await supabase
      .from('worker_skills')
      .select('*')
      .limit(5)
    
    if (skillsError) {
      console.error('❌ Error fetching worker skills:', skillsError)
    } else {
      console.log('✅ Worker skills found:', skills?.length || 0)
      if (skills && skills.length > 0) {
        console.log('   Sample skill:', skills[0])
      }
    }
    
    // 2. Test Worker Skill Assignments
    console.log('\n2️⃣ Testing Worker Skill Assignments...')
    const { data: assignments, error: assignmentsError } = await supabase
      .from('worker_skill_assignments')
      .select(`
        *,
        worker:profiles!worker_id(id, full_name),
        skill:worker_skills(id, name, category)
      `)
      .limit(5)
    
    if (assignmentsError) {
      console.error('❌ Error fetching skill assignments:', assignmentsError)
    } else {
      console.log('✅ Worker skill assignments found:', assignments?.length || 0)
      if (assignments && assignments.length > 0) {
        console.log('   Sample assignment:', {
          worker: assignments[0].worker?.full_name,
          skill: assignments[0].skill?.name,
          proficiency: assignments[0].proficiency_level,
          hourlyRate: assignments[0].hourly_rate,
          overtimeRate: assignments[0].overtime_rate
        })
      }
    }
    
    // 3. Test Resource Allocations
    console.log('\n3️⃣ Testing Resource Allocations...')
    const today = new Date().toISOString().split('T')[0]
    const { data: allocations, error: allocationsError } = await supabase
      .from('resource_allocations')
      .select(`
        *,
        worker:profiles!resource_id(id, full_name),
        site:sites(id, name)
      `)
      .eq('allocation_type', 'worker')
      .gte('allocation_date', today)
      .limit(5)
    
    if (allocationsError) {
      console.error('❌ Error fetching resource allocations:', allocationsError)
    } else {
      console.log('✅ Resource allocations found:', allocations?.length || 0)
      if (allocations && allocations.length > 0) {
        console.log('   Sample allocation:', {
          worker: allocations[0].worker?.full_name,
          site: allocations[0].site?.name,
          date: allocations[0].allocation_date,
          hours: allocations[0].hours_worked,
          totalCost: allocations[0].total_cost
        })
      }
    }
    
    // 4. Test Creating a New Skill Assignment
    console.log('\n4️⃣ Testing Create Skill Assignment...')
    
    // First get a worker and a skill
    const { data: workers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'worker')
      .limit(1)
    
    const { data: skillsForAssignment } = await supabase
      .from('worker_skills')
      .select('id, name')
      .limit(1)
    
    if (workers && workers.length > 0 && skillsForAssignment && skillsForAssignment.length > 0) {
      const testAssignment = {
        worker_id: workers[0].id,
        skill_id: skillsForAssignment[0].id,
        proficiency_level: 'intermediate',
        hourly_rate: 25000,
        overtime_rate: 37500,
        certified: false
      }
      
      const { data: newAssignment, error: createError } = await supabase
        .from('worker_skill_assignments')
        .upsert(testAssignment)
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating skill assignment:', createError)
      } else {
        console.log('✅ Successfully created/updated skill assignment')
        console.log('   Worker:', workers[0].full_name)
        console.log('   Skill:', skillsForAssignment[0].name)
        console.log('   Hourly Rate:', testAssignment.hourly_rate)
      }
    }
    
    // 5. Test Creating a Resource Allocation
    console.log('\n5️⃣ Testing Create Resource Allocation...')
    
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .limit(1)
    
    if (workers && workers.length > 0 && sites && sites.length > 0) {
      const testAllocation = {
        allocation_type: 'worker',
        resource_id: workers[0].id,
        site_id: sites[0].id,
        allocation_date: today,
        start_time: '08:00',
        end_time: '17:00',
        hours_worked: 8,
        overtime_hours: 1,
        hourly_rate: 25000,
        overtime_rate: 37500,
        total_cost: (8 * 25000) + (1 * 37500),
        task_description: 'Test allocation from automated test',
        status: 'confirmed'
      }
      
      const { data: newAllocation, error: allocationError } = await supabase
        .from('resource_allocations')
        .insert(testAllocation)
        .select()
        .single()
      
      if (allocationError) {
        console.error('❌ Error creating resource allocation:', allocationError)
      } else {
        console.log('✅ Successfully created resource allocation')
        console.log('   Worker:', workers[0].full_name)
        console.log('   Site:', sites[0].name)
        console.log('   Total Cost:', testAllocation.total_cost)
        
        // Clean up - delete the test allocation
        await supabase
          .from('resource_allocations')
          .delete()
          .eq('id', newAllocation.id)
        console.log('   (Test allocation cleaned up)')
      }
    }
    
    console.log('\n✅ Worker Assignment System Test Complete!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run the test
testWorkerAssignmentSystem()