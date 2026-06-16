import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // Passport will automatically redirect the user to Microsoft's login page
  }

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthCallback(@Req() req: any, @Res() res: Response) {
    const { access_token } = this.authService.login(req.user);
    
    // Redirect to frontend with token in URL (or use a secure cookie in production)
    // Here we redirect back to the frontend domain with the token
    // The frontend can parse it from the URL and save it in localStorage
    const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.FRONTEND_PORT || 5173}`;
    res.redirect(`${frontendUrl}/auth/callback?token=${access_token}`);
  }
}
