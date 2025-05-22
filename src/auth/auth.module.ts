import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BearerStrategy } from './bearer.strategy';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'bearer' }),
  ],
  providers: [AuthService, BearerStrategy],
})
export class AuthModule {}
