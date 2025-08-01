# INOPNC Work Management - Automated Backup System

## Overview

The INOPNC Work Management system includes a comprehensive automated backup solution designed to protect critical business data and ensure business continuity. The system supports both database and file backups with flexible scheduling, monitoring, and restoration capabilities.

## Features

### 🔄 **Backup Types**
- **Full Backup**: Complete database and file system backup
- **Incremental Backup**: Only changes since last backup
- **Differential Backup**: Changes since last full backup

### 📅 **Scheduling**
- Cron-based scheduling system
- Multiple backup configurations
- Automatic execution with monitoring
- Manual backup execution

### 🗄️ **Storage Options**
- Local file system storage
- Cloud storage integration (S3, GCS, Azure - extensible)
- Compression and encryption support
- Configurable retention policies

### 📊 **Monitoring & Alerts**
- Real-time backup status monitoring
- Health check endpoints
- Failed backup notifications
- Performance metrics and statistics

### 🔒 **Security**
- Role-based access control (Admin only)
- Backup file encryption
- Secure credential management
- Audit logging

## Architecture

### Components

1. **BackupScheduler**: Core scheduling and orchestration engine
2. **DatabaseBackupService**: PostgreSQL database backup handling
3. **FileBackupService**: File system backup management
4. **BackupDashboard**: Web UI for management and monitoring
5. **Backup Service**: Background service for scheduled operations
6. **Backup CLI**: Command-line interface for operations

### Database Schema

The system uses the following database tables:

- `backup_configs`: Backup configuration settings
- `backup_jobs`: Individual backup job records
- `backup_schedules`: Cron-based scheduling configuration
- `backup_monitoring`: Alert and monitoring settings
- `backup_restore_jobs`: Backup restoration tracking

## Installation & Setup

### Prerequisites

- Node.js 18+ with npm
- PostgreSQL database access
- Required system tools:
  - `pg_dump` (for database backups)
  - `tar` (for file compression)
  - `gzip` (for compression)
  - `zip` (optional, for zip compression)

### Environment Variables

Add the following to your `.env.local`:

```env
# Backup Configuration
BACKUP_DIR=/path/to/backup/storage
BACKUP_SERVICE_PORT=3001
DATABASE_URL=postgresql://user:pass@host:port/db

# Optional: Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
```

### Database Setup

Run the backup system migration:

```bash
# Apply the backup tables migration
psql $DATABASE_URL -f supabase/migrations/20240318_create_backup_tables.sql
```

## Usage

### Starting the Backup Service

```bash
# Start the backup service
npm run backup:start

# Check service status
npm run backup:status

# Stop the service
npm run backup:stop
```

### Using the CLI

```bash
# Show all available commands
npm run backup help

# Start backup service
npm run backup start

# Check service status
npm run backup status

# View logs
npm run backup logs

# Execute manual backup
npm run backup backup <config-id>
```

### Web Interface

Access the backup management interface at:
`http://localhost:3000/dashboard/admin/backup`

**Note**: Only users with `admin` or `system_admin` roles can access backup management.

## Configuration

### Creating Backup Configurations

1. Access the web interface at `/dashboard/admin/backup`
2. Click "설정 관리" (Settings Management)
3. Configure backup parameters:
   - **Name**: Descriptive name for the backup
   - **Type**: full, incremental, or differential
   - **Schedule**: Cron expression (e.g., `0 2 * * *` for daily at 2 AM)
   - **Retention**: Number of days to keep backups
   - **Include Database**: Enable database backup
   - **Include Files**: Enable file system backup
   - **Compression**: Enable compression to save space
   - **Encryption**: Enable encryption for security

### Default Configurations

The system comes with pre-configured backup settings:

1. **일일 전체 백업** (Daily Full Backup)
   - Schedule: `0 2 * * *` (2 AM daily)
   - Retention: 7 days
   - Includes: Database + Files
   
2. **주간 증분 백업** (Weekly Incremental Backup)
   - Schedule: `0 3 * * 0` (3 AM Sundays)
   - Retention: 30 days
   - Includes: Database + Files
   
3. **데이터베이스 전용 백업** (Database Only Backup)
   - Schedule: `0 1 * * *` (1 AM daily)
   - Retention: 14 days
   - Includes: Database only

## Monitoring

### Health Checks

The backup service provides health check endpoints:

```bash
# Service health
GET http://localhost:3001/health

# Backup statistics
GET http://localhost:3001/stats

# Recent logs
GET http://localhost:3001/logs
```

### Dashboard Metrics

The web dashboard displays:

- Total backup count and success rate
- Storage usage and compression ratios
- Average backup duration
- Recent backup job status
- Running backup operations

### Alerts and Notifications

Configure monitoring alerts for:

- Consecutive backup failures
- Unusual backup size changes
- Extended backup durations
- Storage space warnings

## Backup Operations

### Manual Backup Execution

**Via Web Interface**:
1. Go to `/dashboard/admin/backup`
2. Find the desired backup configuration
3. Click the play button (▶️)

**Via CLI**:
```bash
npm run backup backup <config-id>
```

**Via API**:
```bash
curl -X POST "http://localhost:3000/api/backup?action=execute" \
  -H "Content-Type: application/json" \
  -d '{"configId": "your-config-id"}'
```

### Backup File Locations

Backups are stored in the configured `BACKUP_DIR` with the following structure:

```
backups/
├── database/
│   ├── backup-full-2024-08-01T02-00-00.sql.gz
│   └── backup-incremental-2024-08-02T02-00-00.sql.gz
└── files/
    ├── backup-files-2024-08-01T02-00-00.tar.gz
    └── backup-files-2024-08-02T02-00-00.tar.gz
```

## Restoration

### Database Restoration

**Manual Process**:
```bash
# Extract backup if compressed
gunzip backup-full-2024-08-01T02-00-00.sql.gz

# Restore to database
psql $DATABASE_URL < backup-full-2024-08-01T02-00-00.sql
```

**Via API** (Future Implementation):
```bash
curl -X POST "http://localhost:3000/api/backup/restore" \
  -H "Content-Type: application/json" \
  -d '{
    "backup_id": "backup-job-id",
    "target_database": "restore_db",
    "include_files": true,
    "overwrite_existing": false
  }'
```

### File Restoration

```bash
# Extract file backup
tar -xzf backup-files-2024-08-01T02-00-00.tar.gz -C /restore/path/
```

## Security Considerations

### Access Control

- Backup management requires admin privileges
- API endpoints validate user roles
- Backup files should be stored in secure locations

### Encryption

Enable encryption for sensitive data:

```javascript
// In backup configuration
{
  "encryption": true,
  "encryption_key": process.env.BACKUP_ENCRYPTION_KEY
}
```

### Credential Management

- Store database credentials securely
- Use environment variables for sensitive config
- Implement credential rotation policies

## Performance Tuning

### Database Backups

- Use `pg_dump` with appropriate options
- Consider parallel dump for large databases
- Monitor backup duration and adjust schedules

### File Backups

- Exclude unnecessary files (logs, temp files)
- Use appropriate compression levels
- Consider incremental file backups for large datasets

### Storage Optimization

- Enable compression to reduce storage usage
- Implement retention policies to manage disk space
- Consider cloud storage for long-term archival

## Troubleshooting

### Common Issues

**Service Won't Start**:
```bash
# Check for port conflicts
netstat -tulpn | grep 3001

# Check logs
npm run backup logs

# Verify environment variables
echo $BACKUP_DIR
echo $DATABASE_URL
```

**Backup Failures**:
1. Check database connectivity
2. Verify file system permissions
3. Ensure sufficient disk space
4. Review backup job logs

**Missing Dependencies**:
```bash
# Install required system tools
sudo apt-get install postgresql-client-common
sudo apt-get install tar gzip zip
```

### Log Analysis

Backup logs are available through:
- Web dashboard
- CLI: `npm run backup logs`
- Direct service endpoint: `GET http://localhost:3001/logs`

### Performance Issues

- Monitor backup duration trends
- Check system resources during backup
- Consider off-peak scheduling
- Optimize backup configurations

## Development

### Adding New Backup Types

1. Extend the `BackupType` enum in `types.ts`
2. Implement backup logic in appropriate service
3. Update UI components
4. Add validation and testing

### Custom Storage Providers

Implement new storage providers by:

1. Creating a new service class
2. Implementing the `BackupLocation` interface
3. Adding configuration options
4. Testing with various backup types

### Testing

```bash
# Run backup system tests
npm test -- --testPathPattern=backup

# Test backup service health
curl http://localhost:3001/health

# Test backup CLI
npm run backup status
```

## Production Deployment

### Process Management

Use a process manager like PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start backup service with PM2
pm2 start scripts/backup-service.js --name "inopnc-backup"

# Monitor
pm2 status
pm2 logs inopnc-backup
```

### Monitoring Integration

Integrate with monitoring systems:

- Health check endpoints for uptime monitoring
- Metrics export for Prometheus/Grafana
- Alert integration with PagerDuty/Slack
- Log forwarding to centralized logging

### High Availability

For production environments:
- Run backup service on multiple nodes
- Use shared storage for backup files
- Implement backup verification
- Set up monitoring and alerting

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review system logs
3. Verify configuration settings
4. Contact system administrators

---

**Last Updated**: August 2024  
**Version**: 1.0.0