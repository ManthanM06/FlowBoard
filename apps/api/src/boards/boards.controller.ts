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
import { BoardsService } from './boards.service'
import { CreateBoardDto } from './dto/create-board.dto'
import { UpdateBoardDto } from './dto/update-board.dto'
import {
  CreateColumnDto,
  UpdateColumnDto,
  ReorderColumnsDto,
} from './dto/column.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller()
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post('workspaces/:workspaceId/boards')
  @HttpCode(HttpStatus.CREATED)
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBoardDto
  ) {
    const data = await this.boardsService.createBoard(workspaceId, userId, dto)
    return { success: true, data }
  }

  @Get('workspaces/:workspaceId/boards')
  async findAllByWorkspace(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.boardsService.findAllByWorkspace(workspaceId, userId)
    return { success: true, data }
  }

  @Get('boards/:id')
  async findById(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.boardsService.findById(id, userId)
    return { success: true, data }
  }

  @Patch('boards/:id')
  async updateBoard(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBoardDto
  ) {
    const data = await this.boardsService.updateBoard(id, userId, dto)
    return { success: true, data }
  }

  @Delete('boards/:id')
  async deleteBoard(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.boardsService.deleteBoard(id, userId)
    return { success: true, data }
  }

  @Post('boards/:boardId/columns')
  @HttpCode(HttpStatus.CREATED)
  async createColumn(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateColumnDto
  ) {
    const data = await this.boardsService.createColumn(boardId, userId, dto)
    return { success: true, data }
  }

  @Patch('columns/:id')
  async updateColumn(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateColumnDto
  ) {
    const data = await this.boardsService.updateColumn(id, userId, dto)
    return { success: true, data }
  }

  @Delete('columns/:id')
  async deleteColumn(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    const data = await this.boardsService.deleteColumn(id, userId)
    return { success: true, data }
  }

  @Patch('boards/:boardId/columns/reorder')
  async reorderColumns(
    @Param('boardId') boardId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ReorderColumnsDto
  ) {
    const data = await this.boardsService.reorderColumns(
      boardId,
      userId,
      dto.columnIds
    )
    return { success: true, data }
  }
}
