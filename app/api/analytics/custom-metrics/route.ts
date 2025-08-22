import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Custom metrics endpoint' })
}

export async function POST() {
  return NextResponse.json({ message: 'Custom metrics posted' })
}