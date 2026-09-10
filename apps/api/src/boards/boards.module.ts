import { Module } from '@nestjs/common'
import { BoardsService } from './boards.service'
import { BoardsController } from './boards.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { RealtimeModule } from '../realtime/realtime.module'

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
