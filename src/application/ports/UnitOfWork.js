/**
 * Port برای مدیریت تراکنش (ACID).
 * پیاده‌سازی MySQL از یک connection اختصاصی با BEGIN/COMMIT/ROLLBACK استفاده می‌کند.
 * Use-caseها با فراخوانی uow.withTransaction(async (repos) => {...}) تراکنشی عمل می‌کنند.
 */
export class UnitOfWork {
  async withTransaction(_work) { throw new Error('Not implemented') }
}
