import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { MoveTaskDto } from './dto/move-task.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('columns/:columnId/tasks')
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Param('columnId') columnId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto
  ) {
    const data = await this.tasksService.createTask(columnId, userId, dto)
    return { success: true, data }
  }

  @Get('tasks/:id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.tasksService.findById(id, userId)
    return { success: true, data }
  }

  @Patch('tasks/:id')
  async updateTask(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTaskDto
  ) {
    const data = await this.tasksService.updateTask(id, userId, dto)
    return { success: true, data }
  }

  @Patch('tasks/:id/move')
  async moveTask(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MoveTaskDto
  ) {
    const data = await this.tasksService.moveTask(id, userId, dto)
    return { success: true, data }
  }

  @Delete('tasks/:id')
  async deleteTask(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.tasksService.deleteTask(id, userId)
    return { success: true, data }
  }
}
