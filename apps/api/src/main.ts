import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  app.useGlobalFilters(new HttpExceptionFilter())

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })

  const port = process.env.PORT || 3001
  await app.listen(port)
  logger.log(`FlowBoard API is running on: http://localhost:${port}/api`)
}

bootstrap()
