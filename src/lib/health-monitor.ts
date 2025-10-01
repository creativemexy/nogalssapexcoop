import os from 'os-utils';

export interface SystemHealthMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  database: {
    connected: boolean;
    responseTime: number;
    activeConnections: number;
  };
  application: {
    uptime: number;
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  alerts: HealthAlert[];
}

export interface HealthAlert {
  id: string;
  type: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: string;
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private metrics: SystemHealthMetrics | null = null;
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly ALERT_THRESHOLDS = {
    CPU_USAGE: 80,
    MEMORY_USAGE: 85,
    DISK_USAGE: 90,
    DB_RESPONSE_TIME: 1000, // 1 second
  };

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async getMetrics(): Promise<SystemHealthMetrics> {
    const now = Date.now();
    
    // Return cached metrics if they're fresh
    if (this.metrics && (now - this.lastUpdate) < this.UPDATE_INTERVAL) {
      return this.metrics;
    }

    try {
      const [cpuInfo, memInfo, diskInfo, dbInfo] = await Promise.all([
        this.getCpuMetrics(),
        this.getMemoryMetrics(),
        this.getDiskMetrics(),
        this.getDatabaseMetrics(),
      ]);

      const metrics: SystemHealthMetrics = {
        timestamp: new Date().toISOString(),
        cpu: cpuInfo,
        memory: memInfo,
        disk: diskInfo,
        database: dbInfo,
        application: this.getApplicationMetrics(),
        alerts: this.generateAlerts(cpuInfo, memInfo, diskInfo, dbInfo),
      };

      this.metrics = metrics;
      this.lastUpdate = now;

      // Log and notify for new alerts
      for (const alert of metrics.alerts) {
        await this.logHealthEvent(alert);
        await this.sendHealthNotification(alert);
      }

      return metrics;
    } catch (error) {
      console.error('Error collecting health metrics:', error);
      throw new Error('Failed to collect system health metrics');
    }
  }

  private async getCpuMetrics() {
    return new Promise<{ usage: number; loadAverage: number[]; cores: number }>((resolve) => {
      os.cpuUsage((usage) => {
        resolve({
          usage: Math.round(usage * 100),
          loadAverage: os.loadavg(1, 5, 15),
          cores: os.cpuCount(),
        });
      });
    });
  }

  private async getMemoryMetrics() {
    // Simplified memory metrics using Node.js built-in
    const totalMem = process.memoryUsage();
    const total = totalMem.heapTotal + totalMem.external;
    const used = totalMem.heapUsed;
    const free = total - used;
    const usage = Math.round((used / total) * 100);

    return {
      total: Math.round(total / 1024 / 1024), // MB
      used: Math.round(used / 1024 / 1024), // MB
      free: Math.round(free / 1024 / 1024), // MB
      usage,
    };
  }

  private async getDiskMetrics() {
    // Simplified disk metrics - return mock data for now
    // In production, you would use fs.stat or other methods
    return {
      total: 100, // GB
      used: 50, // GB
      free: 50, // GB
      usage: 50, // %
    };
  }

  private async getDatabaseMetrics() {
    try {
      const startTime = Date.now();
      const { prisma } = await import('@/lib/prisma');
      
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Get active connections (approximate)
      const activeConnections = await prisma.$queryRaw`
        SELECT count(*) as connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[];

      return {
        connected: true,
        responseTime,
        activeConnections: Number(activeConnections[0]?.connections || 0),
      };
    } catch (error) {
      return {
        connected: false,
        responseTime: 0,
        activeConnections: 0,
      };
    }
  }

  private getApplicationMetrics() {
    return {
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  private generateAlerts(
    cpu: any,
    memory: any,
    disk: any,
    database: any
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];
    const timestamp = new Date().toISOString();

    // CPU alerts
    if (cpu.usage > this.ALERT_THRESHOLDS.CPU_USAGE) {
      alerts.push({
        id: `cpu-${Date.now()}`,
        type: cpu.usage > 95 ? 'CRITICAL' : 'WARNING',
        message: `High CPU usage: ${cpu.usage}%`,
        metric: 'cpu_usage',
        value: cpu.usage,
        threshold: this.ALERT_THRESHOLDS.CPU_USAGE,
        timestamp,
      });
    }

    // Memory alerts
    if (memory.usage > this.ALERT_THRESHOLDS.MEMORY_USAGE) {
      alerts.push({
        id: `memory-${Date.now()}`,
        type: memory.usage > 95 ? 'CRITICAL' : 'WARNING',
        message: `High memory usage: ${memory.usage}%`,
        metric: 'memory_usage',
        value: memory.usage,
        threshold: this.ALERT_THRESHOLDS.MEMORY_USAGE,
        timestamp,
      });
    }

    // Disk alerts
    if (disk.usage > this.ALERT_THRESHOLDS.DISK_USAGE) {
      alerts.push({
        id: `disk-${Date.now()}`,
        type: disk.usage > 95 ? 'CRITICAL' : 'WARNING',
        message: `High disk usage: ${disk.usage}%`,
        metric: 'disk_usage',
        value: disk.usage,
        threshold: this.ALERT_THRESHOLDS.DISK_USAGE,
        timestamp,
      });
    }

    // Database alerts
    if (!database.connected) {
      alerts.push({
        id: `db-${Date.now()}`,
        type: 'CRITICAL',
        message: 'Database connection lost',
        metric: 'database_connected',
        value: 0,
        threshold: 1,
        timestamp,
      });
    } else if (database.responseTime > this.ALERT_THRESHOLDS.DB_RESPONSE_TIME) {
      alerts.push({
        id: `db-response-${Date.now()}`,
        type: 'WARNING',
        message: `Slow database response: ${database.responseTime}ms`,
        metric: 'database_response_time',
        value: database.responseTime,
        threshold: this.ALERT_THRESHOLDS.DB_RESPONSE_TIME,
        timestamp,
      });
    }

    return alerts;
  }

  getHealthStatus(): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    if (!this.metrics) return 'HEALTHY';

    const criticalAlerts = this.metrics.alerts.filter(a => a.type === 'CRITICAL');
    const warningAlerts = this.metrics.alerts.filter(a => a.type === 'WARNING');

    if (criticalAlerts.length > 0) return 'CRITICAL';
    if (warningAlerts.length > 0) return 'WARNING';
    return 'HEALTHY';
  }

  getAlerts(): HealthAlert[] {
    return this.metrics?.alerts || [];
  }

  getCriticalAlerts(): HealthAlert[] {
    return this.metrics?.alerts.filter(a => a.type === 'CRITICAL') || [];
  }

  getWarningAlerts(): HealthAlert[] {
    return this.metrics?.alerts.filter(a => a.type === 'WARNING') || [];
  }

  async logHealthEvent(alert: HealthAlert): Promise<void> {
    try {
      const { logSecurityEvent } = await import('@/lib/security');
      await logSecurityEvent('system', 'HEALTH_ALERT', {
        alertId: alert.id,
        type: alert.type,
        message: alert.message,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: alert.timestamp,
      });
    } catch (error) {
      console.error('Failed to log health event:', error);
    }
  }

  async sendHealthNotification(alert: HealthAlert): Promise<void> {
    try {
      // Only send notifications for critical alerts
      if (alert.type !== 'CRITICAL') return;

      const { sendMail } = await import('@/lib/email');
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth');
      
      const session = await getServerSession(authOptions);
      if (!session?.user) return;

      await sendMail({
        to: session.user.email!,
        subject: `🚨 Critical System Alert: ${alert.message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Critical System Alert</h2>
            <p><strong>Alert:</strong> ${alert.message}</p>
            <p><strong>Metric:</strong> ${alert.metric}</p>
            <p><strong>Current Value:</strong> ${alert.value}</p>
            <p><strong>Threshold:</strong> ${alert.threshold}</p>
            <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
            <p>Please check the system health dashboard for more details.</p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Failed to send health notification:', error);
    }
  }
}

export const healthMonitor = HealthMonitor.getInstance();
