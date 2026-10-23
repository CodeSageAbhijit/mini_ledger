import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { buildContainer } from '../src/container';
import { getPrisma, disconnectPrisma } from '../src/infra/prisma';

describe('MiniLedger API End-to-End Integration Tests', () => {
  let app: Express;
  const prisma = getPrisma();

  const testUserPhone = '+919111122222';
  const otherUserPhone = '+919333344444';

  let accessToken = '';
  let refreshToken = '';
  let userId = '';
  let createdLoanId = '';

  beforeAll(async () => {
    // Build app with container
    const container = buildContainer();
    app = createApp(container);

    // Clean test data
    await prisma.receipt.deleteMany({
      where: { loan: { user: { phone: { in: [testUserPhone, otherUserPhone] } } } },
    });
    await prisma.loan.deleteMany({
      where: { user: { phone: { in: [testUserPhone, otherUserPhone] } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { phone: { in: [testUserPhone, otherUserPhone] } } },
    });
    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: [testUserPhone, otherUserPhone] } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [testUserPhone, otherUserPhone] } },
    });
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.receipt.deleteMany({
      where: { loan: { user: { phone: { in: [testUserPhone, otherUserPhone] } } } },
    });
    await prisma.loan.deleteMany({
      where: { user: { phone: { in: [testUserPhone, otherUserPhone] } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { phone: { in: [testUserPhone, otherUserPhone] } } },
    });
    await prisma.otpChallenge.deleteMany({
      where: { phone: { in: [testUserPhone, otherUserPhone] } },
    });
    await prisma.user.deleteMany({
      where: { phone: { in: [testUserPhone, otherUserPhone] } },
    });
    await disconnectPrisma();
  });

  describe('Ops Healthcheck', () => {
    it('GET /health returns 200 with db status up', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok', db: 'up' });
    });
  });

  describe('Authentication Flow', () => {
    it('POST /api/v1/auth/otp/request succeeds with 202', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ phone: testUserPhone });

      expect(res.status).toBe(202);
      expect(res.body.expiresInSeconds).toBe(300);
      expect(res.body.resendAfterSeconds).toBe(30);

      // Verify OTP challenge was persisted in DB
      const challenge = await prisma.otpChallenge.findFirst({
        where: { phone: testUserPhone, consumedAt: null },
      });
      expect(challenge).not.toBeNull();
    });

    it('POST /api/v1/auth/otp/verify fails on wrong code with 401', async () => {
      const res = await request(app).post('/api/v1/auth/otp/verify').send({
        phone: testUserPhone,
        code: '000000',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('OTP_INVALID');
    });

    it('POST /api/v1/auth/otp/verify succeeds when code is correct', async () => {
      // Find active challenge in DB and we simulate verifying
      // To test real verification, we can insert an OTP challenge with known hash
      const knownCode = '123456';
      const { createHmac } = await import('crypto');
      const { config } = await import('../src/config/env');
      const codeHash = createHmac('sha256', config.otp.secret).update(knownCode).digest('hex');

      await prisma.otpChallenge.updateMany({
        where: { phone: testUserPhone, consumedAt: null },
        data: { codeHash },
      });

      const res = await request(app).post('/api/v1/auth/otp/verify').send({
        phone: testUserPhone,
        code: knownCode,
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.phone).toBe(testUserPhone);

      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
      userId = res.body.user.id;
    });

    it('GET /api/v1/me returns user profile with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(userId);
      expect(res.body.phone).toBe(testUserPhone);
    });

    it('GET /api/v1/me rejects request without token with 401', async () => {
      const res = await request(app).get('/api/v1/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('POST /api/v1/auth/refresh rotates refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken); // rotated!

      // Update tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });
  });

  describe('Loans & Summary Flow', () => {
    it('POST /api/v1/loans creates a new loan', async () => {
      const res = await request(app)
        .post('/api/v1/loans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          friendName: 'Arjun Verma',
          amountPaise: 500000, // ₹5,000
          dueDate: '2026-10-15', // past date -> overdue
          note: 'Movie & snacks',
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.friendName).toBe('Arjun Verma');
      expect(res.body.amountPaise).toBe(500000);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.isOverdue).toBe(true);

      createdLoanId = res.body.id;
    });

    it('GET /api/v1/loans lists the created loans', async () => {
      const res = await request(app)
        .get('/api/v1/loans?filter=all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(createdLoanId);
    });

    it('GET /api/v1/summary returns accurate aggregated metrics', async () => {
      const res = await request(app)
        .get('/api/v1/summary')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalLentPaise).toBe(500000);
      expect(res.body.totalRepaidPaise).toBe(0);
      expect(res.body.outstandingPaise).toBe(500000);
      expect(res.body.overduePaise).toBe(500000);
      expect(res.body.counts.pending).toBe(1);
      expect(res.body.counts.overdue).toBe(1);
    });

    it('PATCH /api/v1/loans/:id/repay marks loan as repaid', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/repay`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('REPAID');
      expect(res.body.repaidAt).not.toBeNull();
      expect(res.body.isOverdue).toBe(false);
    });

    it('PATCH /api/v1/loans/:id/repay fails with 409 if already repaid', async () => {
      const res = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/repay`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('ALREADY_REPAID');
    });

    it('GET /api/v1/summary reflects repayment update', async () => {
      const res = await request(app)
        .get('/api/v1/summary')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalLentPaise).toBe(500000);
      expect(res.body.totalRepaidPaise).toBe(500000);
      expect(res.body.outstandingPaise).toBe(0);
      expect(res.body.overduePaise).toBe(0);
      expect(res.body.counts.repaid).toBe(1);
      expect(res.body.counts.pending).toBe(0);
    });
  });

  describe('User Isolation Security', () => {
    it('prevents another user from accessing or modifying loans (returns 404)', async () => {
      // Create user B
      const userB = await prisma.user.create({
        data: { phone: otherUserPhone },
      });
      const { TokenService } = await import('../src/modules/auth/token.service');
      const { PrismaRefreshTokenRepository } = await import(
        '../src/modules/auth/repositories/prisma/PrismaRefreshTokenRepository'
      );
      const { SystemClock } = await import('../src/common/clock');
      const { config } = await import('../src/config/env');

      const tokenService = new TokenService(
        new PrismaRefreshTokenRepository(prisma),
        new SystemClock(),
        config.jwt,
      );
      const userBToken = tokenService.signAccessToken(userB.id, userB.phone);

      // User B attempts to GET User A's loan
      const getRes = await request(app)
        .get(`/api/v1/loans/${createdLoanId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('NOT_FOUND');

      // User B attempts to repay User A's loan
      const repayRes = await request(app)
        .patch(`/api/v1/loans/${createdLoanId}/repay`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(repayRes.status).toBe(404);
      expect(repayRes.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Receipt Upload and Stream', () => {
    it('uploads valid JPEG receipt and streams it back', async () => {
      // Create a minimal valid JPEG buffer (starts with 0xFF 0xD8 0xFF ...)
      const validJpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
        0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0xff, 0xd9,
      ]);

      const uploadRes = await request(app)
        .post(`/api/v1/loans/${createdLoanId}/receipt`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', validJpegBuffer, 'receipt.jpg');

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.id).toBeDefined();
      expect(uploadRes.body.mimeType).toBe('image/jpeg');

      const receiptId = uploadRes.body.id;

      // Stream file back
      const streamRes = await request(app)
        .get(`/api/v1/receipts/${receiptId}/file`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(streamRes.status).toBe(200);
      expect(streamRes.headers['content-type']).toContain('image/jpeg');
    });

    it('rejects invalid file content with bad magic bytes', async () => {
      const fakeTextBuffer = Buffer.from('This is not a real JPEG image file at all.');

      const uploadRes = await request(app)
        .post(`/api/v1/loans/${createdLoanId}/receipt`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', fakeTextBuffer, 'fake.jpg');

      expect(uploadRes.status).toBe(400);
      expect(uploadRes.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
