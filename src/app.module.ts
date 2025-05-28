import { Module } from '@nestjs/common';
import { RetrievalModule } from './retrieval/retrieval.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { MediaModule } from './media/media.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { MongoDBProvider } from './providers/mongodb.provider';
import { MongoDBHealthIndicator } from './providers/mongodb.health';

@Module({
  imports: [
    ConfigModule.forRoot(),
    RetrievalModule,
    AuthModule,
    StorageModule,
    TerminusModule,
    MediaModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [MongoDBProvider, MongoDBHealthIndicator],
})
export class AppModule {}
