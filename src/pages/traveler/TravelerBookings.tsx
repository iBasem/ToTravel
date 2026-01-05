
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Download,
  MessageSquare,
  Star
} from "lucide-react";

const bookings = [
  {
    id: 1,
    title: "Best Of Vietnam in 14 Days",
    destination: "Vietnam",
    date: "March 15, 2024",
    duration: "14 days",
    travelers: 2,
    price: "$1,798",
    status: "Confirmed",
    bookingRef: "TV-001234",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    title: "European Classic Journey",
    destination: "Europe",
    date: "April 22, 2024",
    duration: "12 days",
    travelers: 1,
    price: "$2,165",
    status: "Pending",
    bookingRef: "TV-001235",
    image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    title: "Costa Rica Quest",
    destination: "Costa Rica",
    date: "January 10, 2024",
    duration: "9 days",
    travelers: 2,
    price: "$1,104",
    status: "Completed",
    bookingRef: "TV-001230",
    image: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=400&h=300&fit=crop"
  }
];

export default function TravelerBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === "all") return true;
    if (activeTab === "upcoming") return booking.status === "Confirmed" || booking.status === "Pending";
    if (activeTab === "completed") return booking.status === "Completed";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "Confirmed": return t('travelerDashboard.confirmed');
      case "Pending": return t('travelerDashboard.pending');
      case "Completed": return t('travelerDashboard.completed');
      default: return status;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={isRTL ? 'text-right' : ''}>
        <h1 className="text-2xl font-bold text-gray-900">{t('travelerDashboard.myBookings')}</h1>
        <p className="text-gray-600">{t('travelerDashboard.manageBookings')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">{t('travelerDashboard.allBookings')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('travelerDashboard.upcoming')}</TabsTrigger>
          <TabsTrigger value="completed">{t('travelerDashboard.completed')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className={`flex flex-col md:flex-row ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                  <div className="md:w-64">
                    <img 
                      src={booking.image} 
                      alt={booking.title}
                      className="w-full h-48 md:h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-6">
                    <div className={`flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
                      <div className={isRTL ? 'text-right' : ''}>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{booking.title}</h3>
                        <div className={`flex items-center gap-4 text-sm text-gray-600 mb-3 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <MapPin className="w-4 h-4" />
                            {booking.destination}
                          </div>
                          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Calendar className="w-4 h-4" />
                            {booking.date}
                          </div>
                          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Clock className="w-4 h-4" />
                            {booking.duration}
                          </div>
                          <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Users className="w-4 h-4" />
                            {booking.travelers} {booking.travelers === 1 ? t('booking.travelerSingular') : t('booking.travelerPlural')}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{t('travelerDashboard.bookingRef')}: {booking.bookingRef}</p>
                      </div>
                      <div className={isRTL ? 'text-left' : 'text-right'}>
                        <Badge className={getStatusColor(booking.status)}>
                          {getStatusTranslation(booking.status)}
                        </Badge>
                        <p className="text-xl font-bold text-gray-900 mt-2 tabular-nums">{booking.price}</p>
                      </div>
                    </div>
                    
                    <div className={`flex gap-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <Button size="sm" variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Download className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('travelerDashboard.downloadVoucher')}
                      </Button>
                      <Button size="sm" variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <MessageSquare className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('travelerDashboard.contactSupport')}
                      </Button>
                      {booking.status === "Completed" && (
                        <Button size="sm" variant="outline" className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Star className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          {t('travelerDashboard.writeReview')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
