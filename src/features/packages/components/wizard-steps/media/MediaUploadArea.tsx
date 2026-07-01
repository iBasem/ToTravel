
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Upload, Image, Video } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MediaUploadAreaProps {
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddSampleImages: () => void;
}

export function MediaUploadArea({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddSampleImages
}: MediaUploadAreaProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t('packageWizard.uploadPhotosVideos', 'Upload your photos and videos')}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t('packageWizard.dragDropFiles', 'Drag and drop files here, or click to browse')}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button variant="outline" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              {t('packageWizard.addPhotos', 'Add Photos')}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              {t('packageWizard.addVideos', 'Add Videos')}
            </Button>
            <Button onClick={onAddSampleImages} className="bg-primary hover:bg-primary/90">
              {t('packageWizard.addSampleImages', 'Add Sample Images')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
