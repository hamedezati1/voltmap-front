import { Zap } from "lucide-react";
import StationReportForm from "../components/StationReportForm";

export default function MyStation() {
  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col"
      style={{ paddingBottom: 80 }}
    >
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-emerald-500" />
          <span className="text-base font-bold text-gray-900 dark:text-white">
            ایستگاه من
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          ایستگاه خانگی یا عمومی خود را ثبت کنید
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <StationReportForm hideHeader />
      </div>
    </div>
  );
}
