import { SystemClock } from './common/clock';
import { config } from './config/env';
import { getPrisma } from './infra/prisma';
import { createFileStorage } from './infra/storage/fileStorageFactory';
import { AuthService } from './modules/auth/auth.service';
import { OtpService } from './modules/auth/otp.service';
import { createOtpSender } from './modules/auth/otp-senders/otpSenderFactory';
import { PrismaOtpRepository } from './modules/auth/repositories/prisma/PrismaOtpRepository';
import { PrismaRefreshTokenRepository } from './modules/auth/repositories/prisma/PrismaRefreshTokenRepository';
import { PrismaUserRepository } from './modules/auth/repositories/prisma/PrismaUserRepository';
import { TokenService } from './modules/auth/token.service';
import { LoansService } from './modules/loans/loans.service';
import { PrismaLoanRepository } from './modules/loans/prisma/PrismaLoanRepository';
import { ReceiptsService } from './modules/receipts/receipts.service';
import { SummaryService } from './modules/summary/summary.service';

export interface AppContainer {
  authService: AuthService;
  tokenService: TokenService;
  loansService: LoansService;
  summaryService: SummaryService;
  receiptsService: ReceiptsService;
  clock: SystemClock;
}

export function buildContainer(): AppContainer {
  const clock = new SystemClock(config.APP_TIMEZONE);
  const prisma = getPrisma();

  const otpSender = createOtpSender(config);
  const otpRepo = new PrismaOtpRepository(prisma);
  const otpService = new OtpService(otpRepo, otpSender, clock, config.otp);

  const refreshTokenRepo = new PrismaRefreshTokenRepository(prisma);
  const tokenService = new TokenService(refreshTokenRepo, clock, config.jwt);

  const userRepo = new PrismaUserRepository(prisma);
  const authService = new AuthService(otpService, userRepo, tokenService);

  const loanRepo = new PrismaLoanRepository(prisma);
  const loansService = new LoansService(loanRepo, clock);
  const summaryService = new SummaryService(loanRepo, clock);

  const fileStorage = createFileStorage(config);
  const receiptsService = new ReceiptsService(loanRepo, fileStorage);

  return {
    authService,
    tokenService,
    loansService,
    summaryService,
    receiptsService,
    clock,
  };
}
