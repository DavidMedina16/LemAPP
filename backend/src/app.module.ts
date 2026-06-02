import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { TasksModule } from './tasks/tasks.module';
import { InvoicesModule } from './invoices/invoices.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    TasksModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 1) Autenticación (JWT) — corre primero, inyecta request.user
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2) Autorización (roles) — corre después, ya con request.user disponible
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
