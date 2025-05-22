import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly validTokens: string[];

  constructor(private configService: ConfigService) {
    // Obtener los tokens válidos de las variables de ambiente
    const tokensString = this.configService.get<string>('VALID_TOKENS');
    this.validTokens = tokensString ? tokensString.split(',') : [];
  }

  async validateToken(token: string): Promise<any> {
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    // Verificar si el token está en la lista de tokens válidos
    const isValidToken = this.validTokens.includes(token);

    if (!isValidToken) {
      throw new UnauthorizedException('Token inválido');
    }
    // Si el token es válido, retornamos la información del usuario
    // TODO: Como no se encuentra implementado un esquema de usuario, retornamos un objeto de usuario ficticio
    return {
      userId: 'user-id',
      username: 'username',
      roles: ['user'],
    };
  }
}
