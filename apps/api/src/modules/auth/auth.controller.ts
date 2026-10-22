import type { Request, Response } from 'express';
import type { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  requestOtp = async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.body;
    const result = await this.authService.requestOtp(phone);
    res.status(202).json(result);
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const { phone, code } = req.body;
    const result = await this.authService.verifyOtp(phone, code);
    res.status(200).json(result);
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);
    res.status(200).json(result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;
    await this.authService.logout(refreshToken);
    res.status(204).send();
  };

  getMe = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const user = await this.authService.getMe(userId);
    res.status(200).json({
      id: user.id,
      phone: user.phone,
      name: user.name,
    });
  };
}
