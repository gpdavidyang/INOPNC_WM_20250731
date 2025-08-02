#!/usr/bin/env node

const webpush = require('web-push')
const fs = require('fs')
const path = require('path')

console.log('Generating VAPID keys for push notifications...\n')

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys()

console.log('VAPID Keys Generated:')
console.log('===================')
console.log(`Public Key:  ${vapidKeys.publicKey}`)
console.log(`Private Key: ${vapidKeys.privateKey}`)
console.log('')

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local')
let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8')
}

// Add or update VAPID keys in .env.local
const vapidSubject = 'mailto:admin@inopnc.com'
const newVapidKeys = `
# VAPID Keys for Push Notifications
VAPID_SUBJECT=${vapidSubject}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}
VAPID_PRIVATE_KEY=${vapidKeys.privateKey}
`

// Remove existing VAPID keys if present
envContent = envContent.replace(/# VAPID Keys for Push Notifications[\s\S]*?VAPID_PRIVATE_KEY=.*?\n/g, '')

// Add new VAPID keys
envContent += newVapidKeys

fs.writeFileSync(envPath, envContent)

console.log('Environment Configuration:')
console.log('========================')
console.log(`VAPID keys have been added to .env.local`)
console.log(`Subject: ${vapidSubject}`)
console.log('')
console.log('⚠️  Important Security Notes:')
console.log('   - Keep the private key secure and never commit it to version control')
console.log('   - The public key will be used in client-side code')
console.log('   - Store the private key securely in your production environment')
console.log('')
console.log('✅ VAPID keys generated and saved successfully!')
console.log('')
console.log('Next steps:')
console.log('1. Add these keys to your production environment variables')
console.log('2. Restart your development server to load the new environment variables')
console.log('3. Test push notifications using the /api/notifications/push endpoint')