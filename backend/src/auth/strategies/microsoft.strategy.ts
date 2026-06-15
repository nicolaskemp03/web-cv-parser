import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('AZURE_CLIENT_ID'),
      clientSecret: configService.get<string>('AZURE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('AZURE_CALLBACK_URL'),
      scope: ['user.read'],
      tenant: configService.get<string>('AZURE_TENANT_ID'),
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { id, displayName, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : null;

    if (!email) {
      throw new UnauthorizedException('No email provided by Microsoft account.');
    }

    const user = await this.authService.validateOrCreateUser({
      msObjectId: id,
      name: displayName,
      email: email,
    });

    return user;
  }
}
