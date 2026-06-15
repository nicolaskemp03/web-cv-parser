import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateOrCreateUser(profile: { msObjectId: string; name: string; email: string }): Promise<User> {
    let user = await this.userRepository.findOne({ where: { email: profile.email } });

    if (!user) {
      user = this.userRepository.create({
        email: profile.email,
        name: profile.name,
        ms_object_id: profile.msObjectId,
        role: 'recruiter', // default role
      });
    } else if (!user.ms_object_id) {
      // Link account if it existed without MS Object ID
      user.ms_object_id = profile.msObjectId;
    }

    user.last_login = new Date();
    await this.userRepository.save(user);

    return user;
  }

  login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
