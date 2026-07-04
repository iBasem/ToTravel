import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
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
  const [uploading, setUploading] = useState(false);

  // Fetch images from Supabase Storage
  const fetchImages = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.storage
        .from('agency-gallery')
        .list(user.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (error) throw error;

      const imageList: GalleryImage[] = (data || [])
        .filter(file => !file.name.startsWith('.'))
        .map(file => ({
          name: file.name,
          url: supabase.storage.from('agency-gallery').getPublicUrl(`${user.id}/${file.name}`).data.publicUrl,
        }));

      setImages(imageList);
    } catch (err: any) {
      console.error('Error fetching gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [user]);

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
    } catch (err: any) {
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
    } catch (err: any) {
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

      {images.length === 0 ? (
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
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(image.name)}
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
    </div>
  );
}
