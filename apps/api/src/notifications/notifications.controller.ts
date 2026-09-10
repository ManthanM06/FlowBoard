import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.getUserNotifications(userId)
    return { success: true, data }
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    const data = await this.notificationsService.markAllAsRead(userId)
    return { success: true, data }
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.notificationsService.markAsRead(id, userId)
    return { success: true, data }
  }
}
