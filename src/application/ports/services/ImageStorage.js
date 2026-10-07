/**
 * Port ذخیرهٔ فایل عکس.
 * پیاده‌سازی فعلی: LocalImageStorage (پوشهٔ storage روی همین سرور)
 */
export class ImageStorage {
  /**
   * @returns {Promise<{ id: string, path: string }>}
   * path آدرس نسبی است، مثل stations/<id>.jpg
   */
  async saveStationImage(_file) {
    throw new Error('Not implemented')
  }
}
