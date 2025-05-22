import { Module } from '@nestjs/common';
import { RetrievalModule } from './retrieval/retrieval.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RetrievalModule,
    AuthModule,
    StorageModule,
    TerminusModule,
    MediaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
