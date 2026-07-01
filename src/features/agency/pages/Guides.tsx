import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { UserPlus, Star, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAgencyGuides } from "@/features/agency/hooks/useAgencyGuides";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState } from "react";
import { Input } from "@/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { toast } from "sonner";

export default function Guides() {
  const { t } = useTranslation();
  const { guides, loading, error, addGuide, deleteGuide } = useAgencyGuides();

  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state for adding a new guide
  const [form, setForm] = useState({
    name: '',
    specialty: '',
    languages: '',
    rating: 5,
  });

  const handleAddGuide = async () => {
    if (!form.name.trim()) return;

    try {
      await addGuide({
        name: form.name,
        specialty: form.specialty.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.split(',').map(s => s.trim()).filter(Boolean),
        rating: form.rating,
        image_url: null,
      });
      setForm({ name: '', specialty: '', languages: '', rating: 5 });
      setDialogOpen(false);
      toast.success(t('agencyDashboard.guideAdded', { defaultValue: 'Guide added successfully' }));
    } catch {
      toast.error(t('agencyDashboard.guideAddFailed', { defaultValue: 'Failed to add guide' }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteGuide(id);
      toast.success(t('agencyDashboard.guideDeleted', { defaultValue: 'Guide deleted' }));
    } catch {
      toast.error(t('agencyDashboard.guideDeleteFailed', { defaultValue: 'Failed to delete guide' }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t('agencyDashboard.tourGuides')}
        </h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {t('agencyDashboard.addGuide')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('agencyDashboard.addGuide')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder={t('agencyDashboard.guideName', { defaultValue: 'Guide Name' })}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <Input
                placeholder={t('agencyDashboard.specialtiesComma', { defaultValue: 'Specialties (comma-separated)' })}
                value={form.specialty}
                onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
              />
              <Input
                placeholder={t('agencyDashboard.languagesComma', { defaultValue: 'Languages (comma-separated)' })}
                value={form.languages}
                onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
              />
              <Button onClick={handleAddGuide} className="w-full">
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {guides.length === 0 ? (
        <EmptyState
          icon="users"
          title={t('agencyDashboard.noGuidesYet', { defaultValue: 'No Guides Yet' })}
          description={t('agencyDashboard.addYourFirstGuide', { defaultValue: 'Add your first tour guide to get started.' })}
          action={{
            label: t('agencyDashboard.addGuide'),
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium text-lg">
                      {guide.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{guide.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(guide.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-medium tabular-nums">{guide.rating}</span>
                  </div>

                  {guide.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('agencyDashboard.languages')}:</p>
                      <p className="text-sm text-gray-600">{guide.languages.join(", ")}</p>
                    </div>
                  )}

                  {guide.specialty.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">{t('agencyDashboard.specialties')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {guide.specialty.map((spec) => (
                          <span key={spec} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
