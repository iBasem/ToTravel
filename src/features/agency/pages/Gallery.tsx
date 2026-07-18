import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { Upload, Image, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";

interface GalleryImage {
  name: string;
  url: string;
}

export default function Gallery() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // Fetch images from Supabase Storage. Pages through the listing (AGY-27):
  // the previous single call silently capped the gallery at 100 files.
  const fetchImages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setLoadError(false);

      const PAGE = 100;
      const all: { name: string }[] = [];
      for (let offset = 0; ; offset += PAGE) {
        const { data, error } = await supabase.storage
          .from('agency-gallery')
          .list(user.id, { limit: PAGE, offset, sortBy: { column: 'created_at', order: 'desc' } });
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < PAGE) break;
      }

      const imageList: GalleryImage[] = all
        .filter(file => !file.name.startsWith('.'))
        .map(file => ({
          name: file.name,
          url: supabase.storage.from('agency-gallery').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl,
        }));

      setImages(imageList);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      // Distinguish "failed to load" from "no media yet" — the onboarding
      // empty state after a transient error misled agencies (AGY-27).
      setLoadError(true);
      toast.error(t('agencyDashboard.galleryLoadFailed', 'Failed to load gallery'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // Key on the id, not the object (auth events re-create the user object).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('agency-gallery')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
      }

      toast.success(t('agencyDashboard.uploadSuccess', { defaultValue: 'Files uploaded successfully' }));
      fetchImages();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(t('toasts.uploadFailed', 'Upload failed'));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle file deletion
  const handleDelete = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('agency-gallery')
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.name !== fileName));
      toast.success(t('agencyDashboard.fileDeleted', { defaultValue: 'File deleted' }));
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('toasts.deleteFailed', 'Delete failed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t('agencyDashboard.mediaGallery')}
        </h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading
              ? t('agencyDashboard.uploading', { defaultValue: 'Uploading...' })
              : t('agencyDashboard.uploadMedia')
            }
          </Button>
        </div>
      </div>

      {loadError ? (
        <EmptyState
          icon="image"
          title={t('agencyDashboard.galleryLoadFailed', 'Failed to load gallery')}
          description={t('agencyDashboard.galleryLoadFailedDesc', 'Something went wrong while loading your media. Your photos are safe — try again.')}
          action={{
            label: t('common.retry', 'Retry'),
            onClick: () => void fetchImages(),
          }}
        />
      ) : images.length === 0 ? (
        <EmptyState
          icon="image"
          title={t('agencyDashboard.noMediaYet', { defaultValue: 'No Media Yet' })}
          description={t('agencyDashboard.uploadFirstMedia', { defaultValue: 'Upload your first photos to showcase your tours and destinations.' })}
          action={{
            label: t('agencyDashboard.uploadMedia'),
            onClick: () => fileInputRef.current?.click(),
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              {t('agencyDashboard.photoGallery')} ({images.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.name} className="relative group aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 sm:group-hover:bg-black/40 group-focus-within:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="pointer-events-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                      onClick={() => setPendingDelete(image.name)}
                      aria-label={t('agencyDashboard.deleteImage', 'Delete image')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agencyDashboard.deleteImageTitle', 'Delete this image?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agencyDashboard.deleteImageDescription', 'The image will be permanently removed from your gallery. This cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete);
                setPendingDelete(null);
              }}
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
