
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center justify-between ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <h1 className={`text-2xl sm:text-3xl font-bold ${isRTL ? 'text-right' : ''}`}>
          {t('agencyDashboard.mediaGallery')}
        </h1>
        <Button className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Upload className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('agencyDashboard.uploadMedia')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Image className="w-5 h-5" />
              {t('agencyDashboard.photoGallery')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className={`text-center text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>{t('agencyDashboard.uploadManagePhotos')}</p>
                <p className="text-sm">{t('agencyDashboard.supportedFormatsImages')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Video className="w-5 h-5" />
              {t('agencyDashboard.videoGallery')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className={`text-center text-gray-500 ${isRTL ? 'text-right' : ''}`}>
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>{t('agencyDashboard.uploadManageVideos')}</p>
                <p className="text-sm">{t('agencyDashboard.supportedFormatsVideos')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
