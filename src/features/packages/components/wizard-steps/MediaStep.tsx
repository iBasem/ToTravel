
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MediaGallery } from "./media/MediaGallery";
import { Button } from "@/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Loader2 } from "lucide-react";

interface MediaStepProps {
  data: MediaItem[];
  onUpdate: (data: MediaItem[]) => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption: string;
  isPrimary: boolean;
  file_name?: string;
  file_path?: string;
}

export function MediaStep({ data, onUpdate }: MediaStepProps) {
  const { t } = useTranslation();
  const [media, setMedia] = useState<MediaItem[]>(data || []);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  // Storage paths of files uploaded during this wizard session, keyed by media item id.
  const sessionUploadsRef = useRef(new Map<string, string>());

  useEffect(() => {
    onUpdate(media);
  }, [media, onUpdate]);

  const handleFileUpload = async (files: FileList) => {
    if (!user) {
      toast.error(t('auth.signInRequired', { defaultValue: 'You must be logged in to upload files' }));
      return;
    }

    setUploading(true);
    try {
      const newMediaItems: MediaItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('package-media')
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError.message, uploadError);
          toast.error(t('toasts.uploadFileFailed', 'Failed to upload {{name}}', { name: file.name }));
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('package-media')
          .getPublicUrl(filePath);

        const mediaItem: MediaItem = {
          id: Math.random().toString(36).substr(2, 9),
          type: file.type.startsWith('image/') ? 'image' : 'video',
          url: publicUrl,
          caption: file.name,
          isPrimary: media.length === 0 && i === 0 && newMediaItems.length === 0,
          file_name: file.name,
          file_path: publicUrl
        };

        sessionUploadsRef.current.set(mediaItem.id, filePath);
        newMediaItems.push(mediaItem);
      }

      if (newMediaItems.length > 0) {
        setMedia(prev => [...prev, ...newMediaItems]);
        toast.success(`${newMediaItems.length} ${t('packageWizard.filesUploaded')}`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error(t('packageWizard.failedToUpload'));
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));

    // Files uploaded in this session are safe to delete from storage right
    // away (nothing references them until save). Previously saved files are
    // left in place so cancelling the wizard doesn't break the stored package.
    const uploadedPath = sessionUploadsRef.current.get(id);
    if (uploadedPath) {
      sessionUploadsRef.current.delete(id);
      supabase.storage
        .from('package-media')
        .remove([uploadedPath])
        .then(({ error }) => {
          if (error) console.error('Failed to delete uploaded media file:', error);
        });
    }
  };

  const setPrimary = (id: string) => {
    setMedia(prev => prev.map(item => ({
      ...item,
      isPrimary: item.id === id
    })));
  };

  const updateCaption = (id: string, caption: string) => {
    setMedia(prev => prev.map(item =>
      item.id === id ? { ...item, caption } : item
    ));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-start">
        <h3 className="text-lg font-semibold mb-2">{t('packageWizard.packageMedia')}</h3>
        <p className="text-muted-foreground">{t('packageWizard.uploadPhotosVideos')}</p>
      </div>

      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border"
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                {t('packageWizard.uploadYourMedia')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('packageWizard.dragDropFiles')}
              </p>
            </div>

            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('packageWizard.uploading')}</span>
              </div>
            ) : (
              <div className="flex gap-2 justify-center flex-wrap">
                <input
                  type="file"
                  id="photo-upload"
                  multiple
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <label htmlFor="photo-upload">
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      {t('packageWizard.addPhotos')}
                    </span>
                  </Button>
                </label>

                <input
                  type="file"
                  id="video-upload"
                  multiple
                  accept="video/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <label htmlFor="video-upload">
                  <Button type="button" variant="outline" asChild>
                    <span className="cursor-pointer">
                      {t('packageWizard.addVideos')}
                    </span>
                  </Button>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <MediaGallery
        media={media}
        onRemoveMedia={removeMedia}
        onSetPrimary={setPrimary}
        onUpdateCaption={updateCaption}
      />

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-medium text-primary mb-2 text-start">{t('packageWizard.mediaGuidelines')}</h4>
        <ul className="text-sm text-primary/80 space-y-1 ps-4 text-start">
          <li>• {t('packageWizard.guidelineMinResolution')}</li>
          <li>• {t('packageWizard.guidelinePrimaryImage')}</li>
          <li>• {t('packageWizard.guidelineFormats')}</li>
          <li>• {t('packageWizard.guidelineMaxSize')}</li>
        </ul>
      </div>
    </div>
  );
}
