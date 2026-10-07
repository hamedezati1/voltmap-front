import { Map, Zap, Route, Star } from 'lucide-react'
import WelcomeImage from '../assets/onboarding/welcome-ev.jpg'
import MapSearchImage from '../assets/onboarding/map-search.jpg'
import SmartRouteImage from '../assets/onboarding/smart-route.jpg'

export const ONBOARDING_SLIDES = [
  {
    id: 1,
    image: WelcomeImage,
    title: 'به ولت‌مپ خوش آمدید',
    description: 'نزدیک‌ترین ایستگاه‌های شارژ خودرو برقی را پیدا کنید و با خیال راحت سفر کنید.',
    color: '#2ECC71',
    bg: '#f0faf5',
  },
  {
    id: 2,
    image: MapSearchImage,
    title: 'نقشه و جستجوی هوشمند',
    description: 'روی نقشه ببینید کدام ایستگاه خالی است، فیلتر کنید و جزئیات هر شارژر را بخوانید.',
    color: '#3498DB',
    bg: '#EBF5FB',
  },
  {
    id: 3,
    image: SmartRouteImage,
    title: 'مسیر هوشمند سفر',
    description: 'بهترین مسیر با توقف‌های شارژ بهینه را برای سفرهای بین‌شهری برنامه‌ریزی کنید.',
    color: '#9B59B6',
    bg: '#f5eef8',
  },
  {
    id: 4,
    Icon: Star,
    title: 'نظرات و علاقه‌مندی‌ها',
    description: 'تجربه خود را ثبت کنید، ایستگاه‌های مورد علاقه را ذخیره کنید و به جامعه EV بپیوندید.',
    color: '#E67E22',
    bg: '#fef3e2',
  },
]
