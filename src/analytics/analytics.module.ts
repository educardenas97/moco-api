import { Module } from '@nestjs/common';
import { QAAnalyticsController } from './qa-analytics.controller';
import { QAService } from '../providers/qa.service';
import { MongoDBProvider } from '../providers/mongodb.provider';

@Module({
  controllers: [QAAnalyticsController],
  providers: [
    QAService,
    MongoDBProvider,
  ],
  exports: [QAService],
})
export class AnalyticsModule {}
