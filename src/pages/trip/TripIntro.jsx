import { Navigation, Battery, Zap, Clock, AlertTriangle } from 'lucide-react'

const FEATURES = [
  {
    icon: Battery,
    color: '#2ECC71',
    title: 'محاسبه برد واقعی',
    desc: 'بر اساس برد تجربی شما، دما، و کولر/بخاری',
  },
  {
    icon: Zap,
    color: '#F39C12',
    title: 'امتیازدهی ایستگاه‌ها',
    desc: 'توان شارژ، پورت خالی، گزارش مردمی، انحراف از مسیر',
  },
  {
    icon: Clock,
    color: '#3498DB',
    title: 'محاسبه زمان توقف',
    desc: 'فقط تا همان شارژی که برای رسیدن لازم دارید',
  },
  {
    icon: AlertTriangle,
    color: '#E74C3C',
    title: 'هشدار ریسک مسیر',
    desc: 'اگه ایستگاهی در مسیر نباشد یا وضعیت بدی داشته باشد',
  },
]

export default function TripIntro({ onStart }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900" style={{ paddingBottom: 80 }}>
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-900/30">
          <Navigation size={40} color="#2ECC71" />
        </div>
        <h1 className="mb-3 text-center text-xl font-bold text-gray-900 dark:text-white">
          سفر هوشمند با ولت‌مپ
        </h1>
        <p className="mb-6 text-center text-sm leading-7 text-gray-500 dark:text-gray-400">
          این ابزار مسیر سفر شما را تحلیل می‌کند، بهترین ایستگاه‌های شارژ را پیشنهاد می‌دهد و دقیقاً می‌گوید در هر ایستگاه چقدر شارژ بگیرید.
        </p>

        <div className="mb-8 w-full space-y-3">
          {FEATURES.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: item.color + '20' }}
              >
                <item.icon size={18} color={item.color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
          style={{ background: '#2ECC71', fontFamily: 'Vazirmatn' }}
        >
          شروع برنامه‌ریزی سفر
        </button>
      </div>
    </div>
  )
}
