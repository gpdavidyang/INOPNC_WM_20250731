#!/usr/bin/env node

/**
 * INOPNC Backup CLI
 * 
 * Command line interface for backup operations
 */

const path = require('path')
const { spawn } = require('child_process')

// Setup environment
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const COMMANDS = {
  'start': 'Start the backup service',
  'stop': 'Stop the backup service',
  'status': 'Check backup service status',
  'backup': 'Execute manual backup',
  'list': 'List backup configurations',
  'logs': 'Show backup service logs',
  'help': 'Show this help message'
}

class BackupCLI {
  constructor() {
    this.servicePort = process.env.BACKUP_SERVICE_PORT || 3001
  }

  async run() {
    const args = process.argv.slice(2)
    const command = args[0]

    if (!command || command === 'help') {
      this.showHelp()
      return
    }

    switch (command) {
      case 'start':
        await this.startService()
        break
      case 'stop':
        await this.stopService()
        break
      case 'status':
        await this.checkStatus()
        break
      case 'backup':
        await this.executeBackup(args[1])
        break
      case 'list':
        await this.listConfigs()
        break
      case 'logs':
        await this.showLogs()
        break
      default:
        console.error(`❌ Unknown command: ${command}`)
        this.showHelp()
        process.exit(1)
    }
  }

  showHelp() {
    console.log(`
🔄 INOPNC Backup CLI

Usage: npm run backup <command> [options]

Commands:`)
    
    Object.entries(COMMANDS).forEach(([cmd, desc]) => {
      console.log(`  ${cmd.padEnd(10)} ${desc}`)
    })

    console.log(`
Examples:
  npm run backup start          Start backup service
  npm run backup status         Check service status
  npm run backup backup <id>    Execute manual backup
  npm run backup logs           Show recent logs

Environment Variables:
  BACKUP_SERVICE_PORT   Health check server port (default: 3001)
  BACKUP_DIR           Backup storage directory
  DATABASE_URL         Database connection string
`)
  }

  async startService() {
    console.log('🚀 Starting backup service...')
    
    try {
      // Check if service is already running
      const isRunning = await this.isServiceRunning()
      if (isRunning) {
        console.log('✅ Backup service is already running')
        return
      }

      // Start the service
      const servicePath = path.join(__dirname, 'backup-service.js')
      const child = spawn('node', [servicePath], {
        detached: true,
        stdio: 'ignore'
      })

      child.unref()

      // Wait a moment and check if it started successfully
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const running = await this.isServiceRunning()
      if (running) {
        console.log(`✅ Backup service started successfully`)
        console.log(`📊 Health check: http://localhost:${this.servicePort}/health`)
      } else {
        console.error('❌ Failed to start backup service')
        process.exit(1)
      }
    } catch (error) {
      console.error('❌ Error starting service:', error.message)
      process.exit(1)
    }
  }

  async stopService() {
    console.log('🛑 Stopping backup service...')
    
    try {
      const isRunning = await this.isServiceRunning()
      if (!isRunning) {
        console.log('⚠️ Backup service is not running')
        return
      }

      // Send shutdown signal to service
      // This is a simplified implementation - in production you'd want proper process management
      console.log('⚠️ Manual service shutdown required')
      console.log('Use: kill $(ps aux | grep backup-service | grep -v grep | awk \'{print $2}\')')
      
    } catch (error) {
      console.error('❌ Error stopping service:', error.message)
      process.exit(1)
    }
  }

  async checkStatus() {
    try {
      const response = await fetch(`http://localhost:${this.servicePort}/health`)
      
      if (response.ok) {
        const health = await response.json()
        console.log('✅ Backup service is running')
        console.log('📊 Status:', JSON.stringify(health, null, 2))
      } else {
        console.log('❌ Backup service is not responding')
      }
    } catch (error) {
      console.log('❌ Backup service is not running')
      console.log('💡 Run "npm run backup start" to start the service')
    }
  }

  async executeBackup(configId) {
    if (!configId) {
      console.error('❌ Config ID is required')
      console.log('Usage: npm run backup backup <config-id>')
      return
    }

    console.log(`🔄 Executing backup for config: ${configId}`)
    
    try {
      // This would normally call the backup API
      console.log('⚠️ Manual backup execution not implemented in CLI')
      console.log('💡 Use the web interface at /dashboard/admin/backup to execute backups')
    } catch (error) {
      console.error('❌ Error executing backup:', error.message)
    }
  }

  async listConfigs() {
    console.log('📋 Listing backup configurations...')
    
    try {
      // This would normally call the backup API
      console.log('⚠️ Config listing not implemented in CLI')
      console.log('💡 Use the web interface at /dashboard/admin/backup to view configurations')
    } catch (error) {
      console.error('❌ Error listing configs:', error.message)
    }
  }

  async showLogs() {
    try {
      const response = await fetch(`http://localhost:${this.servicePort}/logs`)
      
      if (response.ok) {
        const { logs } = await response.json()
        console.log('📜 Recent backup service logs:')
        logs.forEach(log => {
          console.log(`[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
        })
      } else {
        console.log('❌ Could not fetch logs')
      }
    } catch (error) {
      console.log('❌ Backup service is not running')
    }
  }

  async isServiceRunning() {
    try {
      const response = await fetch(`http://localhost:${this.servicePort}/health`, {
        method: 'GET',
        timeout: 2000
      })
      return response.ok
    } catch (error) {
      return false
    }
  }
}

// Run CLI if called directly
if (require.main === module) {
  const cli = new BackupCLI()
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error.message)
    process.exit(1)
  })
}

module.exports = BackupCLI