/**
 * فیلدهای الزامی فرم «ثبت ایستگاه».
 * هم فرم کاربر و هم پنل ادمین از همین لیست استفاده می‌کنند تا
 * ادمین بتواند فیلدهای ناقص را (مثلاً در گزارش‌های قدیمی) ببیند.
 */
export const REPORT_REQUIRED_FIELDS = [
  { key: "name", label: "نام ایستگاه" },
  { key: "city", label: "شهر" },
  { key: "hours", label: "ساعت کاری" },
  { key: "address", label: "آدرس دقیق" },
  { key: "lat", label: "عرض جغرافیایی" },
  { key: "lng", label: "طول جغرافیایی" },
  { key: "type", label: "نوع شارژر" },
  { key: "connector", label: "کانکتور" },
  { key: "power", label: "توان (kW)" },
  { key: "ports", label: "تعداد پورت" },
  { key: "price", label: "قیمت هر kWh" },
  { key: "notes", label: "توضیحات" },
  { key: "image", label: "عکس ایستگاه" },
];

function filled(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

/** برچسب فیلدهای خالی یک گزارش */
export function missingReportFields(report) {
  if (!report) return [];
  return REPORT_REQUIRED_FIELDS.filter(({ key }) => {
    const value = key === "notes" ? (report.notes ?? report.ownerNote) : report[key];
    return !filled(value);
  }).map((f) => f.label);
}
