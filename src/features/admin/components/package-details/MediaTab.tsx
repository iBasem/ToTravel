import { useTranslation } from 'react-i18next';
import { Badge } from '@/ui/badge';
import { Card, CardContent } from '@/ui/card';
import { EmptyState } from '@/ui/empty-state';
import type { AdminPackageMedia } from '@/features/admin/hooks/useAdminPackageDetails';

interface MediaTabProps {
  media: AdminPackageMedia[];
}

export function MediaTab({ media }: MediaTabProps) {
  const { t } = useTranslation();

  if (media.length === 0) {
    return (
      <EmptyState
        icon="package"
        title={t('adminPackageDetails.noMedia', 'No media uploaded')}
        description={t(
          'adminPackageDetails.noMediaDesc',
          'This package has no photos or videos yet.',
        )}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map((item) => {
        const isVideo = item.media_type === 'video';
        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {isVideo ? (
                <video
                  src={item.file_path}
                  controls
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <img
                  src={item.file_path}
                  alt={item.caption || item.file_name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              <div className="absolute top-2 start-2 flex gap-1.5">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  {isVideo
                    ? t('adminPackageDetails.mediaVideo', 'Video')
                    : t('adminPackageDetails.mediaImage', 'Image')}
                </Badge>
                {item.is_primary && (
                  <Badge className="bg-primary/90">
                    {t('adminPackageDetails.mediaPrimary', 'Primary')}
                  </Badge>
                )}
              </div>
            </div>
            {item.caption && (
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground truncate">{item.caption}</p>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
