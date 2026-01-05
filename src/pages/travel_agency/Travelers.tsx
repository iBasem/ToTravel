
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Filter } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function Travelers() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const travelers = [
    {
      id: 1,
      name: "John Smith",
      email: "john@example.com",
      phone: "+1 234 567 8900",
      totalBookings: 3,
      lastTrip: "Paris Getaway - March 2024"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah@example.com",
      phone: "+1 234 567 8901",
      totalBookings: 1,
      lastTrip: "Tokyo Adventure - April 2024"
    },
    {
      id: 3,
      name: "Mike Wilson",
      email: "mike@example.com",
      phone: "+1 234 567 8902",
      totalBookings: 2,
      lastTrip: "Bali Relaxation - May 2024"
    }
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
          {t('agencyDashboard.travelersManagement')}
        </h1>
        <Button className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Users className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('agencyDashboard.addTraveler')}
        </Button>
      </div>

      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            placeholder={t('agencyDashboard.searchTravelers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${isRTL ? 'pr-10 text-right' : 'pl-10'}`}
          />
        </div>
        <Button variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Filter className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('agencyDashboard.filter')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={isRTL ? 'text-right' : ''}>{t('agencyDashboard.travelerDirectory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {travelers.map((traveler) => (
              <div key={traveler.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium">
                        {traveler.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className={isRTL ? 'text-right' : ''}>
                      <p className="font-medium">{traveler.name}</p>
                      <p className="text-sm text-gray-600">{traveler.email}</p>
                      <p className="text-sm text-gray-600" dir="ltr">{traveler.phone}</p>
                    </div>
                  </div>
                </div>
                <div className={isRTL ? 'text-left' : 'text-right'}>
                  <p className="font-medium">{traveler.totalBookings} {t('agencyDashboard.bookings')}</p>
                  <p className="text-sm text-gray-600">{traveler.lastTrip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
