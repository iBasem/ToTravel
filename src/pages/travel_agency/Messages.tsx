
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Messages() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const conversations = [
    {
      id: 1,
      traveler: "John Smith",
      lastMessage: "Thank you for the booking confirmation!",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      traveler: "Sarah Johnson",
      lastMessage: "Can I modify my travel dates?",
      time: "1 day ago",
      unread: false
    },
    {
      id: 3,
      traveler: "Mike Wilson",
      lastMessage: "The trip was amazing, thank you!",
      time: "3 days ago",
      unread: false
    }
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
        {t('agencyDashboard.messagesCommunication')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className={isRTL ? 'text-right' : ''}>{t('agencyDashboard.conversations')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conversation.unread 
                      ? `bg-blue-50 ${isRTL ? 'border-r-4' : 'border-l-4'} border-blue-500` 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex justify-between items-start mb-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <p className="font-medium">{conversation.traveler}</p>
                    <span className="text-xs text-gray-500">{conversation.time}</span>
                  </div>
                  <p className={`text-sm text-gray-600 truncate ${isRTL ? 'text-right' : ''}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MessageSquare className="w-5 h-5" />
              {t('agencyDashboard.chat')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>{t('agencyDashboard.selectConversation')}</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 mt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Input 
                placeholder={t('agencyDashboard.typeMessage')} 
                className={`flex-1 ${isRTL ? 'text-right' : ''}`} 
              />
              <Button className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
