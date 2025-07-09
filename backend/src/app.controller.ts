import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      message: 'Comment App Backend API is running',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0'
    };
  }

  @Get('health')
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
