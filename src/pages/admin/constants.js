import {
  LayoutDashboard,
  MapPin,
  Zap,
  Users,
  BarChart2,
  Settings,
  Newspaper,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  Clock,
  PowerOff,
} from "lucide-react";

export const MEMBERSHIP_OPTIONS = ["رایگان", "ویژه", "طلایی"];

export const NAV = [
  { key: "dashboard", Icon: LayoutDashboard, label: "داشبورد" },
  { key: "stations", Icon: MapPin, label: "ایستگاه‌ها" },
  { key: "chargers", Icon: Zap, label: "شارژرها" },
  { key: "users", Icon: Users, label: "کاربران و نظرات" },
  { key: "news", Icon: Newspaper, label: "اخبار" },
  {
    key: "stationreports",
    Icon: ClipboardList,
    label: "ایستگاه‌های گزارش‌شده",
  },
  { key: "reports", Icon: BarChart2, label: "گزارش‌ها" },
  { key: "settings", Icon: Settings, label: "تنظیمات" },
];

export const STATUSES = [
  {
    value: "available",
    label: "خلوت",
    Icon: CheckCircle,
    color: "#27AE60",
    bg: "#e8faf0",
  },
  {
    value: "busy",
    label: "شلوغ",
    Icon: AlertCircle,
    color: "#E67E22",
    bg: "#fef3e2",
  },
  {
    value: "waiting",
    label: "در انتظار",
    Icon: Clock,
    color: "#3498DB",
    bg: "#EBF5FB",
  },
  {
    value: "offline",
    label: "خاموش",
    Icon: PowerOff,
    color: "#95a5a6",
    bg: "#f0f0f0",
  },
];

export const EMPTY_FORM = {
  code: "",
  name: "",
  operator: "",
  province: "",
  city: "",
  district: "",
  address: "",
  lat: 35.7219,
  lng: 51.3347,
  acPorts: 0,
  dcPorts: 1,
  maxPower: "60",
  connectors: "CCS2",
  parkingSpots: "",
  isFree: false,
  pricePerKwh: "",
  isActive: true,
  isVerified: false,
  hours: "۲۴ ساعته",
  phone: "",
  image1: "",
  description: "",
  status: "available",
  type: "DC",
  connector: "CCS2",
  power: 60,
  ports: 1,
  price: "",
  image: "",
};

export const CHART_DATA = [120, 145, 130, 190, 175, 220, 180];
export const CHART_DAYS = ["۱۸ خرداد", "۱۹", "۲۰", "۲۱", "۲۲", "۲۳", "۲۴"];

export function sidebarWidth(collapsed) {
  return collapsed ? 72 : 240;
}
