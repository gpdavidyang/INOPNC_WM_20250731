#!/usr/bin/env node

/**
 * INOPNC Backup Service
 * 
 * This service runs in the background and handles scheduled backups.
 * It should be started as a separate process from the main Next.js application.
 * 
 * Usage:
 *   node scripts/backup-service.js [--config /path/to/config]
 *   
 * Environment variables:
 *   - BACKUP_SERVICE_PORT: Port for health check endpoint (default: 3001)
 *   - BACKUP_DIR: Directory to store backups (default: ./backups)
 *   - DATABASE_URL: Database connection string
 *   - LOG_LEVEL: Logging level (default: info)
 */

const { createServer } = require('http')
const path = require('path')
const fs = require('fs').promises

// Setup environment
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const PORT = process.env.BACKUP_SERVICE_PORT || 3001
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

class BackupService {
  constructor() {
    this.scheduler = null
    this.server = null
    this.isRunning = false
    this.startTime = new Date()
    this.stats = {
      backupsCompleted: 0,
      backupsFailed: 0,
      lastBackupTime: null,
      uptime: 0
    }
  }

  async start() {
    try {
      console.log('🚀 Starting INOPNC Backup Service...')
      
      // Initialize backup scheduler
      await this.initializeScheduler()
      
      // Start health check server
      await this.startHealthCheckServer()
      
      // Setup graceful shutdown
      this.setupGracefulShutdown()
      
      this.isRunning = true
      console.log(`✅ Backup service started successfully on port ${PORT}`)
      console.log(`📊 Health check available at http://localhost:${PORT}/health`)
      
    } catch (error) {
      console.error('❌ Failed to start backup service:', error)
      process.exit(1)
    }
  }

  async initializeScheduler() {
    try {
      // Import the backup scheduler (this would normally be done at the top)
      // But we need to ensure the environment is set up first
      const { BackupScheduler } = require('../lib/backup/backup-scheduler.ts')
      
      this.scheduler = new BackupScheduler()
      console.log('📅 Backup scheduler initialized')
    } catch (error) {
      console.error('❌ Failed to initialize scheduler:', error)
      throw error
    }
  }

  async startHealthCheckServer() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`)
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        switch (url.pathname) {
          case '/health':
            this.handleHealthCheck(req, res)
            break
          case '/stats':
            this.handleStats(req, res)
            break
          case '/logs':
            this.handleLogs(req, res)
            break
          default:
            res.writeHead(404, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Not found' }))
        }
      })

      this.server.listen(PORT, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  handleHealthCheck(req, res) {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000)
    
    const health = {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      uptime: uptime,
      timestamp: new Date().toISOString(),
      service: 'inopnc-backup-service',
      version: '1.0.0',
      scheduler: {
        running: this.scheduler ? true : false,
        runningJobs: this.scheduler ? this.scheduler.getRunningJobs().length : 0
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(health))
  }

  handleStats(req, res) {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000)
    
    const stats = {
      ...this.stats,
      uptime,
      startTime: this.startTime.toISOString(),
      runningJobs: this.scheduler ? this.scheduler.getRunningJobs() : []
    }

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(stats))
  }

  async handleLogs(req, res) {
    try {
      // Return recent log entries (this is a simplified implementation)
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Backup service is running',
          service: 'backup-service'
        }
      ]

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ logs }))
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Failed to fetch logs' }))
    }
  }

  setupGracefulShutdown() {
    const signals = ['SIGTERM', 'SIGINT']
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n📡 Received ${signal}, shutting down gracefully...`)
        await this.shutdown()
      })
    })

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error)
      this.shutdown().then(() => process.exit(1))
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
      this.shutdown().then(() => process.exit(1))
    })
  }

  async shutdown() {
    try {
      console.log('🛑 Shutting down backup service...')
      this.isRunning = false

      // Close health check server
      if (this.server) {
        await new Promise((resolve) => {
          this.server.close(resolve)
        })
        console.log('✅ Health check server stopped')
      }

      // Stop scheduler
      if (this.scheduler) {
        // Wait for running jobs to complete (with timeout)
        const runningJobs = await this.scheduler.getRunningJobs()
        if (runningJobs.length > 0) {
          console.log(`⏳ Waiting for ${runningJobs.length} running jobs to complete...`)
          
          // Wait up to 30 seconds for jobs to complete
          let attempts = 0
          while (attempts < 30) {
            const stillRunning = await this.scheduler.getRunningJobs()
            if (stillRunning.length === 0) break
            
            await new Promise(resolve => setTimeout(resolve, 1000))
            attempts++
          }
          
          const finalRunning = await this.scheduler.getRunningJobs()
          if (finalRunning.length > 0) {
            console.log(`⚠️ ${finalRunning.length} jobs still running, forcing shutdown`)
          }
        }
        console.log('✅ Backup scheduler stopped')
      }

      console.log('✅ Backup service shutdown complete')
      process.exit(0)
    } catch (error) {
      console.error('❌ Error during shutdown:', error)
      process.exit(1)
    }
  }
}

// CLI handling
if (require.main === module) {
  const service = new BackupService()
  
  // Parse CLI arguments
  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
INOPNC Backup Service

Usage:
  node scripts/backup-service.js [options]

Options:
  --help, -h          Show this help message
  --config <path>     Path to configuration file
  --port <port>       Health check server port (default: 3001)
  --log-level <level> Logging level (default: info)

Environment Variables:
  BACKUP_SERVICE_PORT   Health check server port
  BACKUP_DIR           Backup storage directory
  DATABASE_URL         Database connection string
  LOG_LEVEL           Logging level

Health Check Endpoints:
  GET /health         Service health status
  GET /stats          Backup statistics
  GET /logs           Recent log entries

Examples:
  node scripts/backup-service.js
  node scripts/backup-service.js --port 3002
  BACKUP_DIR=/data/backups node scripts/backup-service.js
`)
    process.exit(0)
  }

  // Handle port override
  const portIndex = args.indexOf('--port')
  if (portIndex !== -1 && args[portIndex + 1]) {
    process.env.BACKUP_SERVICE_PORT = args[portIndex + 1]
  }

  // Handle log level override
  const logLevelIndex = args.indexOf('--log-level')
  if (logLevelIndex !== -1 && args[logLevelIndex + 1]) {
    process.env.LOG_LEVEL = args[logLevelIndex + 1]
  }

  // Start the service
  service.start().catch(error => {
    console.error('❌ Failed to start backup service:', error)
    process.exit(1)
  })
}

module.exports = BackupService