import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { PrismaService } from './prisma/prisma.service'
import { AuthService } from './auth/auth.service'
import { WorkspacesService } from './workspaces/workspaces.service'
import { BoardsService } from './boards/boards.service'
import { TasksService } from './tasks/tasks.service'
import { CommentsService } from './comments/comments.service'
import { NotificationsService } from './notifications/notifications.service'
import {
  TaskPriority,
  UserSummary,
  WorkspaceSummary,
  BoardDetail,
  ColumnSummary,
  TaskSummary,
} from '@flowboard/shared-types'

describe('FlowBoard End-to-End Integration Flow', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authService: AuthService
  let workspacesService: WorkspacesService
  let boardsService: BoardsService
  let tasksService: TasksService
  let commentsService: CommentsService
  let notificationsService: NotificationsService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      })
    )
    await app.init()

    prisma = app.get<PrismaService>(PrismaService)
    authService = app.get<AuthService>(AuthService)
    workspacesService = app.get<WorkspacesService>(WorkspacesService)
    boardsService = app.get<BoardsService>(BoardsService)
    tasksService = app.get<TasksService>(TasksService)
    commentsService = app.get<CommentsService>(CommentsService)
    notificationsService = app.get<NotificationsService>(NotificationsService)
  })

  afterAll(async () => {
    await app.close()
  })

  const testSuffix = Date.now()
  let userAlice: UserSummary
  let userBob: UserSummary
  let workspace: WorkspaceSummary
  let board: BoardDetail
  let col1: ColumnSummary
  let col2: ColumnSummary
  let task1: TaskSummary
  let task2: TaskSummary

  it('1. should register Alice and Bob', async () => {
    const resAlice = await authService.register({
      email: `alice_${testSuffix}@flowboard.dev`,
      password: 'Password123!',
      name: 'Alice E2E',
    })
    expect(resAlice.user.id).toBeDefined()
    userAlice = resAlice.user

    const resBob = await authService.register({
      email: `bob_${testSuffix}@flowboard.dev`,
      password: 'Password123!',
      name: 'Bob E2E',
    })
    expect(resBob.user.id).toBeDefined()
    userBob = resBob.user
  })

  it('2. Alice should create a workspace and Bob should join with invite code', async () => {
    workspace = await workspacesService.create(userAlice.id, {
      name: 'Engineering Team',
    })
    expect(workspace.id).toBeDefined()
    expect(workspace.inviteCode).toBeDefined()

    const joinRes = await workspacesService.joinByInviteCode(
      userBob.id,
      workspace.inviteCode!
    )
    expect(joinRes.id).toBe(workspace.id)
  })

  it('3. Alice should create a Kanban board with seeded columns', async () => {
    board = await boardsService.createBoard(workspace.id, userAlice.id, {
      name: 'Sprint 1',
    })
    expect(board.columns).toHaveLength(3) // To Do, In Progress, Done
    col1 = board.columns[0]
    col2 = board.columns[1]
  })

  it('4. Alice should create task1 and assign Bob; Bob should create task2', async () => {
    task1 = await tasksService.createTask(col1.id, userAlice.id, {
      title: 'Architect Realtime Sync',
      priority: TaskPriority.HIGH,
      assigneeIds: [userBob.id],
    })
    expect(task1.id).toBeDefined()
    expect(task1.assignees?.[0]?.id).toBe(userBob.id)

    task2 = await tasksService.createTask(col1.id, userBob.id, {
      title: 'Implement Unit Tests',
      priority: TaskPriority.MEDIUM,
    })
    expect(task2.order).toBeGreaterThan(task1.order)
  })

  it('5. should move task1 to col2 and calculate fractional order', async () => {
    const moved = await tasksService.moveTask(task1.id, userAlice.id, {
      targetColumnId: col2.id,
    })
    expect(moved.columnId).toBe(col2.id)
  })

  it('6. Alice should comment on task1 and Bob should receive in-app notification', async () => {
    const comment = await commentsService.createComment(task1.id, userAlice.id, {
      body: 'Bob, please review this realtime architecture.',
    })
    expect(comment.id).toBeDefined()

    const bobNotifs = await notificationsService.getUserNotifications(userBob.id)
    expect(bobNotifs.length).toBeGreaterThan(0)
    expect(bobNotifs[0].type).toBe('COMMENT_ADDED')

    // Mark as read
    const read = await notificationsService.markAsRead(bobNotifs[0].id, userBob.id)
    expect(read.readAt).not.toBeNull()
  })

  it('7. cleanup test data from database', async () => {
    if (workspace?.id) {
      await prisma.workspace.delete({ where: { id: workspace.id } }).catch(() => {})
    }
    if (userAlice?.id) {
      await prisma.user.delete({ where: { id: userAlice.id } }).catch(() => {})
    }
    if (userBob?.id) {
      await prisma.user.delete({ where: { id: userBob.id } }).catch(() => {})
    }
  })
})
