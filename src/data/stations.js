// Initial seed data
const SEED_STATIONS = [
  {
    id: 1,
    name: 'شارینت - برج میلاد',
    city: 'تهران',
    address: 'تهران، میدان ونک، برج میلاد، پارکینگ B1',
    lat: 35.7448,
    lng: 51.3740,
    type: 'DC',
    connector: 'CCS2',
    power: 120,
    ports: 4,
    status: 'available',
    price: '۱۲۰۰ تومان/kWh',
    hours: '۲۴ ساعته',
    rating: 4.7,
    reviews: [
      { user: 'علی م.', text: 'سریع و تمیز، همیشه یه پورت خالیه', rating: 5 },
      { user: 'سارا ک.', text: 'قیمت مناسب، شارژ سریع', rating: 4 },
    ],
  },
  {
    id: 2,
    name: 'ایران شارژ - پارک آب و آتش',
    city: 'تهران',
    address: 'تهران، خیابان آفریقا، پارک آب و آتش',
    lat: 35.7615,
    lng: 51.4090,
    type: 'DC',
    connector: 'CCS2',
    power: 60,
    ports: 6,
    status: 'busy',
    price: '۱۰۰۰ تومان/kWh',
    hours: '۶ صبح تا ۱۲ شب',
    rating: 3.8,
    reviews: [
      { user: 'مهدی ر.', text: 'معمولاً شلوغه، باید صبر کنی', rating: 3 },
      { user: 'نرگس ت.', text: 'محل خوبیه برای خرید حین شارژ', rating: 4 },
    ],
  },
  {
    id: 3,
    name: 'توانیر - شهرک غرب',
    city: 'تهران',
    address: 'تهران، شهرک غرب، فاز ۲، خیابان ایران‌زمین',
    lat: 35.7520,
    lng: 51.3420,
    type: 'AC',
    connector: 'Type2',
    power: 22,
    ports: 3,
    status: 'available',
    price: '۸۰۰ تومان/kWh',
    hours: '۲۴ ساعته',
    rating: 4.2,
    reviews: [
      { user: 'فاطمه د.', text: 'خوبه ولی گاهی قطعی داره', rating: 4 },
    ],
  },
  {
    id: 4,
    name: 'مال اف ایران - شهرک غرب',
    city: 'تهران',
    address: 'تهران، شهرک غرب، مال اف ایران، طبقه B2',
    lat: 35.7580,
    lng: 51.3520,
    type: 'AC/DC',
    connector: 'CCS2',
    power: 100,
    ports: 8,
    status: 'available',
    price: '۱۳۰۰ تومان/kWh',
    hours: '۱۰ صبح تا ۱۰ شب',
    rating: 4.9,
    reviews: [
      { user: 'امیر ح.', text: 'بهترین شارژر تهران! خیلی سریع', rating: 5 },
      { user: 'زینب م.', text: 'داخل مال هستش، خرید هم می‌کنی', rating: 5 },
    ],
  },
  {
    id: 5,
    name: 'ستاره فارس - شیراز',
    city: 'شیراز',
    address: 'شیراز، بلوار چمران، پارکینگ طبقاتی ستاره فارس',
    lat: 29.5918,
    lng: 52.5836,
    type: 'AC',
    connector: 'Type2',
    power: 22,
    ports: 4,
    status: 'available',
    price: '۹۰۰ تومان/kWh',
    hours: '۸ صبح تا ۱۱ شب',
    rating: 4.3,
    reviews: [
      { user: 'رضا ش.', text: 'تمیز و مرتب', rating: 4 },
    ],
  },
  {
    id: 6,
    name: 'الماس شرق - مشهد',
    city: 'مشهد',
    address: 'مشهد، بلوار وکیل‌آباد، مجتمع الماس شرق',
    lat: 36.2972,
    lng: 59.6067,
    type: 'DC',
    connector: 'CHAdeMO',
    power: 50,
    ports: 2,
    status: 'busy',
    price: '۱۱۰۰ تومان/kWh',
    hours: '۲۴ ساعته',
    rating: 3.5,
    reviews: [
      { user: 'حسین ف.', text: 'گاهی خراب میشه', rating: 3 },
    ],
  },
];

const STORAGE_KEY = 'voltmap_stations';

export function getStations() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  // First time: seed data
  saveStations(SEED_STATIONS);
  return SEED_STATIONS;
}

export function saveStations(stations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stations));
  } catch (e) {}
}

export function addStation(station) {
  const stations = getStations();
  const newStation = {
    ...station,
    id: Date.now(),
    rating: 0,
    reviews: [],
  };
  const updated = [newStation, ...stations];
  saveStations(updated);
  return updated;
}

export function updateStation(id, changes) {
  const stations = getStations();
  const updated = stations.map(s => s.id === id ? { ...s, ...changes } : s);
  saveStations(updated);
  return updated;
}

export function deleteStation(id) {
  const stations = getStations();
  const updated = stations.filter(s => s.id !== id);
  saveStations(updated);
  return updated;
}

export function addReview(stationId, review) {
  const stations = getStations();
  const updated = stations.map(s => {
    if (s.id !== stationId) return s;
    const reviews = [...s.reviews, review];
    const rating = Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10;
    return { ...s, reviews, rating };
  });
  saveStations(updated);
  return updated;
}
