import crypto from "node:crypto";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from "../../domain/errors/AppError.js";
import { isValidIranMobile, normalizeIranPhone } from "../../domain/phone.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function refreshExpiryDate(ttl) {
  const match = /^(\d+)([dhm])$/.exec(ttl);
  const now = Date.now();
  if (!match) return new Date(now + 30 * 24 * 60 * 60 * 1000);
  const [, num, unit] = match;
  const ms = { d: 86400000, h: 3600000, m: 60000 }[unit] * Number(num);
  return new Date(now + ms);
}

/**
 * AuthService — ورود و ثبت‌نام با شماره موبایل + OTP (sms.ir)
 */
export class AuthService {
  constructor({
    userRepository,
    refreshTokenRepository,
    otpRepository,
    smsSender,
    tokenService,
    unitOfWork,
    jwtConfig,
    otpConfig,
  }) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.otpRepository = otpRepository;
    this.smsSender = smsSender;
    this.tokenService = tokenService;
    this.unitOfWork = unitOfWork;
    this.jwtConfig = jwtConfig;
    this.otpConfig = otpConfig;
  }

  async #issueTokens(user, repos) {
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = this.tokenService.signRefreshToken({ sub: user.id });
    const tokenHash = hashToken(refreshToken);
    const expiresAt = refreshExpiryDate(this.jwtConfig.refreshTtl);
    await repos.refreshTokens.store(user.id, tokenHash, expiresAt);
    return { accessToken, refreshToken };
  }

  #generateOtpCode() {
    const digits = this.otpConfig.codeLength;
    const max = 10 ** digits;
    const num = crypto.randomInt(0, max);
    return String(num).padStart(digits, "0");
  }

  /**
   * درخواست ارسال کد OTP
   * @param {{ phone: string, purpose: 'login'|'register' }}
   */
  async requestOtp({ phone: rawPhone, purpose }) {
    const phone = normalizeIranPhone(rawPhone);
    if (!isValidIranMobile(phone)) {
      throw new ValidationError("شماره موبایل معتبر نیست (مثال: 09123456789)");
    }
    if (purpose !== "login" && purpose !== "register") {
      throw new ValidationError("نوع درخواست نامعتبر است");
    }

    const existing = await this.userRepository.findByPhone(phone);

    if (purpose === "login" && !existing) {
      throw new ValidationError(
        "حسابی با این شماره یافت نشد. ابتدا ثبت‌نام کنید",
      );
    }
    if (purpose === "register" && existing) {
      throw new ConflictError("این شماره قبلاً ثبت شده است. وارد شوید");
    }

    const latest = await this.otpRepository.findLatest(phone);
    if (latest?.createdAt) {
      const elapsedMs = Date.now() - new Date(latest.createdAt).getTime();
      const waitMs = this.otpConfig.resendCooldownSec * 10;
      // if (elapsedMs < waitMs) {
      //   const retryAfter = Math.ceil((waitMs - elapsedMs) / 1000000000);
      //   throw new ValidationError(
      //     `لطفاً ${retryAfter} ثانیه دیگر دوباره تلاش کنید`,
      //   );
      // }
    }

    const code = this.#generateOtpCode();
    const codeHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + this.otpConfig.ttlSec * 1000);

    await this.otpRepository.invalidateActive(phone);
    await this.otpRepository.create({ phone, codeHash, purpose, expiresAt });
    await this.smsSender.sendOtp(phone, code);

    return {
      ok: true,
      phone,
      expiresIn: this.otpConfig.ttlSec,
      resendAfter: this.otpConfig.resendCooldownSec,
    };
  }

  /**
   * تأیید OTP و صدور توکن
   * @param {{ phone: string, code: string, purpose: 'login'|'register', name?: string }}
   */
  async verifyOtp({ phone: rawPhone, code, purpose, name }) {
    const phone = normalizeIranPhone(rawPhone);
    if (!isValidIranMobile(phone)) {
      throw new ValidationError("شماره موبایل معتبر نیست");
    }
    if (purpose !== "login" && purpose !== "register") {
      throw new ValidationError("نوع درخواست نامعتبر است");
    }

    const trimmedCode = String(code ?? "").trim();
    if (!/^\d{4,8}$/.test(trimmedCode)) {
      throw new ValidationError("کد تأیید نامعتبر است");
    }

    if (purpose === "register") {
      const trimmedName = String(name ?? "").trim();
      if (trimmedName.length < 2 || trimmedName.length > 100) {
        throw new ValidationError("نام باید بین ۲ تا ۱۰۰ کاراکتر باشد");
      }
    }

    return this.unitOfWork.withTransaction(async (repos) => {
      const otp = await repos.otps.findLatestValid(phone, purpose);
      if (!otp) {
        throw new UnauthorizedError(
          "کد منقضی شده یا یافت نشد. دوباره درخواست کنید",
        );
      }

      if (otp.attempts >= this.otpConfig.maxAttempts) {
        await repos.otps.consume(otp.id);
        throw new UnauthorizedError(
          "تعداد تلاش‌ها بیش از حد مجاز است. دوباره کد بگیرید",
        );
      }

      const expected = hashOtp(trimmedCode);
      if (expected !== otp.codeHash) {
        await repos.otps.incrementAttempts(otp.id);
        throw new UnauthorizedError("کد تأیید اشتباه است");
      }

      await repos.otps.consume(otp.id);

      let user = await repos.users.findByPhone(phone);

      if (purpose === "login") {
        if (!user) throw new UnauthorizedError("حسابی با این شماره یافت نشد");
      } else {
        if (user) throw new ConflictError("این شماره قبلاً ثبت شده است");
        user = await repos.users.create({
          name: String(name).trim(),
          phone,
          email: null,
          passwordHash: null,
        });
      }

      const tokens = await this.#issueTokens(user, repos);
      return { user: user.toPublic(), ...tokens };
    });
  }

  async refresh(refreshToken) {
    if (!refreshToken)
      throw new UnauthorizedError("refresh token ارسال نشده است");
    const payload = this.tokenService.verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    return this.unitOfWork.withTransaction(async (repos) => {
      const stored = await repos.refreshTokens.findValid(tokenHash);
      if (!stored)
        throw new UnauthorizedError("نشست شما منقضی شده، دوباره وارد شوید");

      const user = await repos.users.findById(payload.sub);
      if (!user) throw new UnauthorizedError("کاربر یافت نشد");

      await repos.refreshTokens.revoke(tokenHash);
      const tokens = await this.#issueTokens(user, repos);
      return { user: user.toPublic(), ...tokens };
    });
  }

  async logout(refreshToken) {
    if (!refreshToken) return true;
    const tokenHash = hashToken(refreshToken);
    await this.refreshTokenRepository.revoke(tokenHash);
    return true;
  }

  async getSession(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UnauthorizedError("کاربر یافت نشد");
    return user.toPublic();
  }
}
