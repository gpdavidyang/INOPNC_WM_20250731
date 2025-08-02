/**
 * Deployment Notification System
 * 
 * Sends notifications to various channels about deployment status:
 * - Slack/Discord webhooks
 * - Email notifications
 * - Monitoring system alerts
 * - Status page updates
 */

export interface DeploymentEvent {
  deployment_id: string
  environment: 'staging' | 'production'
  status: 'started' | 'success' | 'failed' | 'rollback'
  version: string
  commit_sha: string
  branch: string
  strategy: 'blue-green' | 'rolling' | 'canary'
  duration_ms?: number
  error_message?: string
  timestamp: string
  metadata: {
    triggered_by: string
    build_url?: string
    pr_url?: string
    release_notes?: string
  }
}

export interface NotificationChannel {
  type: 'slack' | 'discord' | 'email' | 'webhook' | 'status_page'
  config: Record<string, any>
  enabled: boolean
  environments: string[]
  events: string[]
}

/**
 * Deployment Notification Manager
 */
export class DeploymentNotificationManager {
  private channels: NotificationChannel[]

  constructor(channels: NotificationChannel[] = []) {
    this.channels = channels
  }

  /**
   * Send deployment notification to all relevant channels
   */
  async sendNotification(event: DeploymentEvent): Promise<void> {
    const relevantChannels = this.getRelevantChannels(event)
    
    const notifications = relevantChannels.map(channel => 
      this.sendToChannel(channel, event)
    )

    try {
      await Promise.allSettled(notifications)
      console.log(`Sent deployment notification to ${relevantChannels.length} channels`)
    } catch (error) {
      console.error('Failed to send some deployment notifications:', error)
    }
  }

  /**
   * Get channels relevant for this event
   */
  private getRelevantChannels(event: DeploymentEvent): NotificationChannel[] {
    return this.channels.filter(channel => 
      channel.enabled &&
      channel.environments.includes(event.environment) &&
      channel.events.includes(event.status)
    )
  }

  /**
   * Send notification to specific channel
   */
  private async sendToChannel(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    try {
      switch (channel.type) {
        case 'slack':
          await this.sendSlackNotification(channel, event)
          break
        case 'discord':
          await this.sendDiscordNotification(channel, event)
          break
        case 'email':
          await this.sendEmailNotification(channel, event)
          break
        case 'webhook':
          await this.sendWebhookNotification(channel, event)
          break
        case 'status_page':
          await this.updateStatusPage(channel, event)
          break
        default:
          console.warn(`Unknown notification channel type: ${channel.type}`)
      }
    } catch (error) {
      console.error(`Failed to send notification to ${channel.type}:`, error)
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    const { webhook_url, channel_name = '#deployments' } = channel.config
    
    if (!webhook_url) {
      throw new Error('Slack webhook URL not configured')
    }

    const payload = {
      channel: channel_name,
      username: 'Deployment Bot',
      icon_emoji: this.getStatusEmoji(event.status),
      attachments: [{
        color: this.getStatusColor(event.status),
        title: this.getNotificationTitle(event),
        fields: [
          {
            title: 'Environment',
            value: event.environment,
            short: true
          },
          {
            title: 'Version',
            value: event.version,
            short: true
          },
          {
            title: 'Strategy',
            value: event.strategy,
            short: true
          },
          {
            title: 'Duration',
            value: event.duration_ms ? this.formatDuration(event.duration_ms) : 'N/A',
            short: true
          },
          {
            title: 'Commit',
            value: `<${this.getCommitUrl(event.commit_sha)}|${event.commit_sha.substring(0, 7)}>`,
            short: true
          },
          {
            title: 'Triggered By',
            value: event.metadata.triggered_by,
            short: true
          }
        ],
        footer: 'INOPNC Deployment Pipeline',
        ts: Math.floor(new Date(event.timestamp).getTime() / 1000)
      }]
    }

    // Add error message if deployment failed
    if (event.status === 'failed' && event.error_message) {
      payload.attachments[0].fields.push({
        title: 'Error',
        value: event.error_message.substring(0, 500),
        short: false
      })
    }

    // Add release notes if available
    if (event.metadata.release_notes) {
      payload.attachments[0].fields.push({
        title: 'Release Notes',
        value: event.metadata.release_notes.substring(0, 500),
        short: false
      })
    }

    await this.sendHttpRequest(webhook_url, payload)
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    const { webhook_url } = channel.config
    
    if (!webhook_url) {
      throw new Error('Discord webhook URL not configured')
    }

    const embed = {
      title: this.getNotificationTitle(event),
      color: this.getDiscordColor(event.status),
      fields: [
        {
          name: 'Environment',
          value: event.environment,
          inline: true
        },
        {
          name: 'Version',
          value: event.version,
          inline: true
        },
        {
          name: 'Strategy',
          value: event.strategy,
          inline: true
        },
        {
          name: 'Duration',
          value: event.duration_ms ? this.formatDuration(event.duration_ms) : 'N/A',
          inline: true
        },
        {
          name: 'Commit',
          value: `[${event.commit_sha.substring(0, 7)}](${this.getCommitUrl(event.commit_sha)})`,
          inline: true
        },
        {
          name: 'Triggered By',
          value: event.metadata.triggered_by,
          inline: true
        }
      ],
      timestamp: event.timestamp,
      footer: {
        text: 'INOPNC Deployment Pipeline'
      }
    }

    if (event.status === 'failed' && event.error_message) {
      embed.fields.push({
        name: 'Error',
        value: event.error_message.substring(0, 1000),
        inline: false
      })
    }

    const payload = {
      embeds: [embed]
    }

    await this.sendHttpRequest(webhook_url, payload)
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    const { recipients, smtp_config } = channel.config
    
    if (!recipients || recipients.length === 0) {
      throw new Error('Email recipients not configured')
    }

    const subject = this.getEmailSubject(event)
    const body = this.getEmailBody(event)

    // In a real implementation, this would use an email service like SendGrid, AWS SES, etc.
    console.log('Sending email notification:', {
      to: recipients,
      subject,
      body: body.substring(0, 200) + '...'
    })

    // Placeholder for actual email sending
    // await emailService.send({ to: recipients, subject, html: body })
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    const { url, headers = {} } = channel.config
    
    if (!url) {
      throw new Error('Webhook URL not configured')
    }

    await this.sendHttpRequest(url, event, headers)
  }

  /**
   * Update status page
   */
  private async updateStatusPage(channel: NotificationChannel, event: DeploymentEvent): Promise<void> {
    const { api_url, api_key, component_id } = channel.config
    
    if (!api_url || !api_key) {
      throw new Error('Status page API configuration missing')
    }

    const status = this.getStatusPageStatus(event.status)
    const message = this.getStatusPageMessage(event)

    const payload = {
      component_id,
      status,
      message,
      timestamp: event.timestamp
    }

    const headers = {
      'Authorization': `Bearer ${api_key}`,
      'Content-Type': 'application/json'
    }

    await this.sendHttpRequest(api_url, payload, headers)
  }

  /**
   * Send HTTP request
   */
  private async sendHttpRequest(url: string, payload: any, headers: Record<string, string> = {}): Promise<void> {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'INOPNC-Deployment-Bot/1.0',
      ...headers
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
  }

  /**
   * Get status emoji for Slack
   */
  private getStatusEmoji(status: string): string {
    const emojis = {
      started: ':rocket:',
      success: ':white_check_mark:',
      failed: ':x:',
      rollback: ':warning:'
    }
    return emojis[status] || ':question:'
  }

  /**
   * Get status color for Slack
   */
  private getStatusColor(status: string): string {
    const colors = {
      started: 'warning',
      success: 'good',
      failed: 'danger',
      rollback: 'warning'
    }
    return colors[status] || '#808080'
  }

  /**
   * Get Discord color
   */
  private getDiscordColor(status: string): number {
    const colors = {
      started: 0xFFA500, // Orange
      success: 0x00FF00, // Green
      failed: 0xFF0000,  // Red
      rollback: 0xFFFF00 // Yellow
    }
    return colors[status] || 0x808080
  }

  /**
   * Get notification title
   */
  private getNotificationTitle(event: DeploymentEvent): string {
    const titles = {
      started: `🚀 Deployment Started - ${event.environment}`,
      success: `✅ Deployment Successful - ${event.environment}`,
      failed: `❌ Deployment Failed - ${event.environment}`,
      rollback: `⏪ Rollback Completed - ${event.environment}`
    }
    return titles[event.status] || `Deployment Update - ${event.environment}`
  }

  /**
   * Get email subject
   */
  private getEmailSubject(event: DeploymentEvent): string {
    return `[INOPNC] ${this.getNotificationTitle(event)}`
  }

  /**
   * Get email body
   */
  private getEmailBody(event: DeploymentEvent): string {
    return `
      <html>
        <body>
          <h2>${this.getNotificationTitle(event)}</h2>
          
          <table border="1" cellpadding="5" cellspacing="0">
            <tr><td><strong>Environment</strong></td><td>${event.environment}</td></tr>
            <tr><td><strong>Version</strong></td><td>${event.version}</td></tr>
            <tr><td><strong>Strategy</strong></td><td>${event.strategy}</td></tr>
            <tr><td><strong>Duration</strong></td><td>${event.duration_ms ? this.formatDuration(event.duration_ms) : 'N/A'}</td></tr>
            <tr><td><strong>Commit</strong></td><td><a href="${this.getCommitUrl(event.commit_sha)}">${event.commit_sha.substring(0, 7)}</a></td></tr>
            <tr><td><strong>Triggered By</strong></td><td>${event.metadata.triggered_by}</td></tr>
            <tr><td><strong>Timestamp</strong></td><td>${event.timestamp}</td></tr>
          </table>
          
          ${event.status === 'failed' && event.error_message ? `
            <h3>Error Details</h3>
            <pre>${event.error_message}</pre>
          ` : ''}
          
          ${event.metadata.release_notes ? `
            <h3>Release Notes</h3>
            <p>${event.metadata.release_notes}</p>
          ` : ''}
          
          <hr>
          <p><em>INOPNC Deployment Pipeline</em></p>
        </body>
      </html>
    `
  }

  /**
   * Get status page status
   */
  private getStatusPageStatus(status: string): string {
    const statusMap = {
      started: 'under_maintenance',
      success: 'operational',
      failed: 'major_outage',
      rollback: 'partial_outage'
    }
    return statusMap[status] || 'operational'
  }

  /**
   * Get status page message
   */
  private getStatusPageMessage(event: DeploymentEvent): string {
    const messages = {
      started: `Deployment in progress for version ${event.version}`,
      success: `Successfully deployed version ${event.version}`,
      failed: `Deployment failed for version ${event.version}`,
      rollback: `Rolled back from version ${event.version}`
    }
    return messages[event.status] || 'Deployment update'
  }

  /**
   * Format duration
   */
  private formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  /**
   * Get commit URL
   */
  private getCommitUrl(sha: string): string {
    // This would be configured based on your git provider
    return `https://github.com/your-org/inopnc-wm/commit/${sha}`
  }
}

/**
 * Default notification channels configuration
 */
export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannel[] = [
  {
    type: 'slack',
    config: {
      webhook_url: process.env.SLACK_WEBHOOK_URL,
      channel_name: '#deployments'
    },
    enabled: Boolean(process.env.SLACK_WEBHOOK_URL),
    environments: ['staging', 'production'],
    events: ['started', 'success', 'failed', 'rollback']
  },
  {
    type: 'slack',
    config: {
      webhook_url: process.env.SLACK_ALERT_WEBHOOK_URL,
      channel_name: '#alerts'
    },
    enabled: Boolean(process.env.SLACK_ALERT_WEBHOOK_URL),
    environments: ['production'],
    events: ['failed', 'rollback']
  },
  {
    type: 'email',
    config: {
      recipients: process.env.DEPLOYMENT_EMAIL_RECIPIENTS?.split(',') || [],
      smtp_config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      }
    },
    enabled: Boolean(process.env.DEPLOYMENT_EMAIL_RECIPIENTS),
    environments: ['production'],
    events: ['success', 'failed', 'rollback']
  },
  {
    type: 'webhook',
    config: {
      url: process.env.DEPLOYMENT_WEBHOOK_URL,
      headers: {
        'Authorization': `Bearer ${process.env.DEPLOYMENT_WEBHOOK_TOKEN}`
      }
    },
    enabled: Boolean(process.env.DEPLOYMENT_WEBHOOK_URL),
    environments: ['staging', 'production'],
    events: ['started', 'success', 'failed', 'rollback']
  },
  {
    type: 'status_page',
    config: {
      api_url: process.env.STATUS_PAGE_API_URL,
      api_key: process.env.STATUS_PAGE_API_KEY,
      component_id: process.env.STATUS_PAGE_COMPONENT_ID
    },
    enabled: Boolean(process.env.STATUS_PAGE_API_URL),
    environments: ['production'],
    events: ['started', 'success', 'failed', 'rollback']
  }
]

// Singleton instance
let notificationManager: DeploymentNotificationManager | null = null

export function getDeploymentNotificationManager(): DeploymentNotificationManager {
  if (!notificationManager) {
    notificationManager = new DeploymentNotificationManager(DEFAULT_NOTIFICATION_CHANNELS)
  }
  return notificationManager
}

/**
 * Utility function to send deployment notification
 */
export async function sendDeploymentNotification(event: DeploymentEvent): Promise<void> {
  const manager = getDeploymentNotificationManager()
  await manager.sendNotification(event)
}

/**
 * Create deployment event from GitHub Actions context
 */
export function createDeploymentEvent(
  status: DeploymentEvent['status'],
  metadata: {
    deployment_id: string
    environment: 'staging' | 'production'
    version: string
    commit_sha: string
    branch: string
    strategy: DeploymentEvent['strategy']
    duration_ms?: number
    error_message?: string
    triggered_by: string
    build_url?: string
    pr_url?: string
    release_notes?: string
  }
): DeploymentEvent {
  return {
    deployment_id: metadata.deployment_id,
    environment: metadata.environment,
    status,
    version: metadata.version,
    commit_sha: metadata.commit_sha,
    branch: metadata.branch,
    strategy: metadata.strategy,
    duration_ms: metadata.duration_ms,
    error_message: metadata.error_message,
    timestamp: new Date().toISOString(),
    metadata: {
      triggered_by: metadata.triggered_by,
      build_url: metadata.build_url,
      pr_url: metadata.pr_url,
      release_notes: metadata.release_notes
    }
  }
}