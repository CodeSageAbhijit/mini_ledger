import { NotFoundError } from '../../common/errors';
import type { OtpService, RequestOtpResult } from './otp.service';
import type { UserRepository, UserRecord } from './repositories/UserRepository';
import type { TokenService, TokenPair } from './token.service';

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
  };
}

export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async requestOtp(phone: string): Promise<RequestOtpResult> {
    return this.otpService.requestOtp(phone);
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    await this.otpService.verifyOtp(phone, code);

    // Find or create user on successful OTP verification
    const user = await this.userRepo.findOrCreateByPhone(phone);
    const tokens = await this.tokenService.generateTokenPair(user.id, user.phone);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.rotateRefreshToken(refreshToken, async (userId) => {
      const user = await this.userRepo.findById(userId);
      return user?.phone ?? null;
    });
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async getMe(userId: string): Promise<UserRecord> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }
}
