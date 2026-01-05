
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Percent, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Deals() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const deals = [
    {
      id: 1,
      title: "Early Bird Special",
      description: "Book 3 months in advance and save 20%",
      discount: 20,
      type: "Percentage",
      validUntil: "2024-06-30",
      status: "active",
      bookings: 45
    },
    {
      id: 2,
      title: "Summer Sale",
      description: "Limited time offer for summer packages",
      discount: 15,
      type: "Percentage",
      validUntil: "2024-08-31",
      status: "active",
      bookings: 23
    },
    {
      id: 3,
      title: "Group Discount",
      description: "Special rates for groups of 6 or more",
      discount: 25,
      type: "Percentage",
      validUntil: "2024-12-31",
      status: "draft",
      bookings: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t('agencyDashboard.active');
      case "draft":
        return t('agencyDashboard.draft');
      case "expired":
        return t('agencyDashboard.expired');
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
          {t('agencyDashboard.dealsAndPromotions')}
        </h1>
        <Button className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('agencyDashboard.createDeal')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals.map((deal) => (
          <Card key={deal.id}>
            <CardHeader>
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CardTitle className="text-lg">{deal.title}</CardTitle>
                <Badge className={getStatusColor(deal.status)}>
                  {getStatusLabel(deal.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : ''}`}>{deal.description}</p>
                
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Percent className="w-4 h-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600 tabular-nums">{deal.discount}%</span>
                  <span className="text-sm text-gray-600">{t('common.off')}</span>
                </div>
                
                <div className={`flex items-center gap-2 text-sm text-gray-600 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <Calendar className="w-4 h-4" />
                  <span>{t('agencyDashboard.validUntil')} {deal.validUntil}</span>
                </div>
                
                <div className={`pt-2 border-t ${isRTL ? 'text-right' : ''}`}>
                  <p className="text-sm text-gray-600">{deal.bookings} {t('agencyDashboard.bookingsUsed')}</p>
                </div>
                
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button variant="outline" size="sm" className="flex-1">
                    {t('common.edit')}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    {t('agencyDashboard.view')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
