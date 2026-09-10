import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { CommentsService } from './comments.service'
import { CreateCommentDto } from './dto/create-comment.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCommentDto
  ) {
    const data = await this.commentsService.createComment(taskId, userId, dto)
    return { success: true, data }
  }

  @Get('tasks/:taskId/comments')
  async getComments(
    @Param('taskId') taskId: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.commentsService.getCommentsByTask(taskId, userId)
    return { success: true, data }
  }

  @Delete('comments/:id')
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.commentsService.deleteComment(id, userId)
    return { success: true, data }
  }
}
