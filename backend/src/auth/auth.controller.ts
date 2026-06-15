import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
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
  async microsoftAuthCallback(@Req() req, @Res() res: Response) {
    const { access_token } = this.authService.login(req.user);
    
    // Redirect to frontend with token in URL (or use a secure cookie in production)
    // Here we redirect back to the frontend domain with the token
    // The frontend can parse it from the URL and save it in localStorage
    res.redirect(`http://localhost:5173/auth/callback?token=${access_token}`);
  }
}
