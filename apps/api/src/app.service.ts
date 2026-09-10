import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthStatus() {
    let dbStatus = 'disconnected'
    try {
      await this.prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'error'
    }

    return {
      status: 'ok',
      service: 'flowboard-api',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  }
}
