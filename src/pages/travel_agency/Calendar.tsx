
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Calendar() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
        {t('agencyDashboard.calendarScheduling')}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <CalendarIcon className="w-5 h-5" />
            {t('agencyDashboard.travelCalendar')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 text-gray-500">
            <div className="text-center">
              <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t('agencyDashboard.calendarPlaceholder')}</p>
              <p className="text-sm">{t('agencyDashboard.showBookingsDepartures')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
