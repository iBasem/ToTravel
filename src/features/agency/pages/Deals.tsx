import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Plus, Percent, Calendar, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAgencyDeals } from "@/features/agency/hooks/useAgencyDeals";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState } from "react";
import { Input } from "@/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { toast } from "sonner";

export default function Deals() {
  const { t } = useTranslation();
  const { deals, loading, error, addDeal, deleteDeal } = useAgencyDeals();

  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    discount_percentage: 10,
    start_date: '',
    end_date: '',
  });

  const handleAddDeal = async () => {
    if (!form.title.trim() || !form.start_date || !form.end_date) return;

    try {
      await addDeal({
        title: form.title,
        discount_percentage: form.discount_percentage,
        start_date: form.start_date,
        end_date: form.end_date,
        status: 'active',
      });
      setForm({ title: '', discount_percentage: 10, start_date: '', end_date: '' });
      setDialogOpen(false);
      toast.success(t('agencyDashboard.dealCreated', { defaultValue: 'Deal created successfully' }));
    } catch {
      toast.error(t('agencyDashboard.dealCreateFailed', { defaultValue: 'Failed to create deal' }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDeal(id);
      toast.success(t('agencyDashboard.dealDeleted', { defaultValue: 'Deal deleted' }));
    } catch {
      toast.error(t('agencyDashboard.dealDeleteFailed', { defaultValue: 'Failed to delete deal' }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-muted text-foreground";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-muted text-foreground";
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
          {t('agencyDashboard.dealsAndPromotions')}
        </h1>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('agencyDashboard.createDeal')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('agencyDashboard.createDeal')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder={t('agencyDashboard.dealTitle', { defaultValue: 'Deal Title' })}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('agencyDashboard.discountPercentage', { defaultValue: 'Discount (%)' })}
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discount_percentage}
                  onChange={e => setForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('agencyDashboard.startDate', { defaultValue: 'Start Date' })}
                </label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('agencyDashboard.endDate', { defaultValue: 'End Date' })}
                </label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddDeal} className="w-full">
                {t('common.save', { defaultValue: 'Save' })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {deals.length === 0 ? (
        <EmptyState
          icon="tag"
          title={t('agencyDashboard.noDealsYet', { defaultValue: 'No Deals Yet' })}
          description={t('agencyDashboard.createFirstDeal', { defaultValue: 'Create your first deal or promotion to attract travelers.' })}
          action={{
            label: t('agencyDashboard.createDeal'),
            onClick: () => setDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <Card key={deal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{deal.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(deal.status)}>
                      {getStatusLabel(deal.status)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(deal.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-600" />
                    <span className="text-2xl font-bold text-green-600 tabular-nums">{deal.discount_percentage}%</span>
                    <span className="text-sm text-muted-foreground">{t('common.off', { defaultValue: 'off' })}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{deal.start_date} → {deal.end_date}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
