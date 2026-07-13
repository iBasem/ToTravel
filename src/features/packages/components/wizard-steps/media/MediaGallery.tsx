
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { X, Video } from "lucide-react";

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  isPrimary: boolean;
}

interface MediaGalleryProps {
  media: MediaItem[];
  onRemoveMedia: (id: string) => void;
  onSetPrimary: (id: string) => void;
  onUpdateCaption: (id: string, caption: string) => void;
}

export function MediaGallery({
  media,
  onRemoveMedia,
  onSetPrimary,
  onUpdateCaption
}: MediaGalleryProps) {
  const { t } = useTranslation();

  if (media.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('agencyDashboard.mediaGallery')} ({media.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => (
            <div key={item.id} className="relative group">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.caption}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {item.isPrimary && (
                  <div className="absolute top-2 start-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                    {t('packageWizard.primaryPhoto', 'Primary photo')}
                  </div>
                )}

                <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onRemoveMedia(item.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => onUpdateCaption(item.id, e.target.value)}
                  placeholder={t('common.add') + "..."}
                  className="w-full text-sm border rounded px-2 py-1"
                />

                {!item.isPrimary && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSetPrimary(item.id)}
                    className="w-full"
                  >
                    {t('packageWizard.setAsPrimary', 'Set as primary')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
