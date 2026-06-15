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
      clientID: configService.get<string>('AZURE_CLIENT_ID') as string,
      clientSecret: configService.get<string>('AZURE_CLIENT_SECRET') as string,
      callbackURL: configService.get<string>('AZURE_CALLBACK_URL') as string,
      scope: ['user.read'],
      tenant: configService.get<string>('AZURE_TENANT_ID') as string,
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
