import { SmsSender } from "../../application/ports/services/SmsSender.js";
import { logger } from "../../infrastructure/logger.js";
import { AppError } from "../../domain/errors/AppError.js";

const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";

/**
 * ارسال OTP از طریق متد Verify وب‌سرویس sms.ir
 * مستندات: https://sms.ir/rest-api/
 *
 * نیاز به:
 * - کلید API (x-api-key) از پنل → برنامه‌نویسان
 * - شناسه قالب تأییدشده در بخش ارسال سریع
 * - نام پارامتر قالب (معمولاً CODE) بدون #
 */
export class SmsIrSender extends SmsSender {
  constructor({ apiKey, templateId, templateParam }) {
    super();
    this.apiKey = apiKey;
    this.templateId = Number(templateId);
    this.templateParam = templateParam || "CODE";
  }

  async sendOtp(phone, code) {
    const payload = {
      mobile: phone,
      templateId: this.templateId,
      parameters: [{ name: this.templateParam, value: String(code) }],
    };

    let response;
    try {
      response = await fetch(SMS_IR_VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          "x-api-key": this.apiKey,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      logger.error("sms.ir network error", { error: err.message, phone });
      throw new AppError(
        "ارسال پیامک با خطا مواجه شد، کمی بعد دوباره تلاش کنید",
        "SMS_SEND_FAILED",
      );
    }

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { status: response.status, message: text };
    }

    // sms.ir معمولاً status === 1 را موفقیت می‌داند
    const ok = response.ok && (data?.status === 1 || data?.status === "1");
    if (!ok) {
      logger.error("sms.ir verify failed", {
        phone,
        httpStatus: response.status,
        body: data,
      });
      throw new AppError(
        data?.message || "ارسال پیامک ناموفق بود",
        "SMS_SEND_FAILED",
      );
    }

    logger.info("OTP SMS sent via sms.ir", {
      phone,
      messageId: data?.data?.messageId,
    });
    return true;
  }
}
