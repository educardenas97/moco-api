import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageHealthIndicator } from './storage.health';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [TerminusModule],
  providers: [StorageService, StorageHealthIndicator],
  exports: [StorageService, StorageHealthIndicator],
})
export class StorageModule {}
