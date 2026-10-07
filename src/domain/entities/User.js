/**
 * Entity کاربر — منطق دامنه‌ی خالص، بدون وابستگی به DB یا HTTP.
 */
export const MEMBERSHIP = { FREE: "رایگان", PLUS: "ویژه", PRO: "طلایی" };
export const ROLE = { USER: "user", ADMIN: "admin" };

export class User {
  constructor({
    id,
    name,
    email,
    phone,
    passwordHash,
    role,
    membership,
    totalSessions,
    totalKwh,
    createdAt,
    updatedAt,
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.passwordHash = passwordHash;
    this.role = role || ROLE.USER;
    this.membership = membership || MEMBERSHIP.FREE;
    this.totalSessions = totalSessions ?? 0;
    this.totalKwh = totalKwh ?? 0;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isAdmin() {
    return this.role === ROLE.ADMIN;
  }

  /** خروجی امن برای ارسال به کلاینت — هرگز passwordHash رو برنمی‌گردونه */
  toPublic() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      membership: this.membership,
      totalSessions: this.totalSessions,
      totalKwh: this.totalKwh,
    };
  }
}
