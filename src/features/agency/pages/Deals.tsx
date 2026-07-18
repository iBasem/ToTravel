import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Plus, Percent, Calendar, Package, Trash2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { useAgencyDeals, type Deal } from "@/features/agency/hooks/useAgencyDeals";
import { usePackages } from "@/features/packages/hooks/usePackages";
import { validateDealForm, derivedDealStatus } from "@/features/agency/lib/dealValidation";
import { formatDate } from "@/lib/formatters";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { useState } from "react";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/ui/alert-dialog";
import { toast } from "sonner";

const EMPTY_FORM = { title: '', discount_percentage: 10, start_date: '', end_date: '', package_id: '' };

export default function Deals() {
  const { t } = useTranslation();
  const { deals, loading, error, addDeal, updateDeal, deleteDeal } = useAgencyDeals();
  const { packages } = usePackages();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Local calendar date (AGY-50): near midnight, the UTC date is a different
  // day and misclassifies scheduled-vs-active.
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  const packageTitle = (packageId: string | null) =>
    packages.find((p) => p.id === packageId)?.title || null;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (deal: Deal) => {
    setEditing(deal);
    setForm({
      title: deal.title,
      discount_percentage: deal.discount_percentage,
      start_date: deal.start_date,
      end_date: deal.end_date,
      package_id: deal.package_id ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const problem = validateDealForm(form);
    if (problem) {
      toast.error(t(`agencyDashboard.${problem}`, {
        defaultValue: {
          dealTitleRequired: 'Give the deal a title',
          dealPackageRequired: 'Select the package this deal applies to',
          dealDiscountRange: 'Discount must be between 1% and 90%',
          dealDatesRequired: 'Pick a start and end date',
          dealDateOrder: 'The end date must be on or after the start date',
        }[problem],
      }));
      return;
    }

    try {
      if (editing) {
        // A material edit is sent back to review by the DB guard (and any
        // stale rejection reason is cleared) — this IS the resubmit path.
        await updateDeal(editing.id, {
          title: form.title,
          discount_percentage: form.discount_percentage,
          start_date: form.start_date,
          end_date: form.end_date,
          package_id: form.package_id,
        });
        toast.success(t('agencyDashboard.dealUpdatedPendingApproval', { defaultValue: 'Deal updated — it will be re-reviewed before going public' }));
      } else {
        const startsInFuture = form.start_date > todayIso;
        await addDeal({
          title: form.title,
          discount_percentage: form.discount_percentage,
          start_date: form.start_date,
          end_date: form.end_date,
          package_id: form.package_id,
          status: startsInFuture ? 'scheduled' : 'active',
        });
        toast.success(t('agencyDashboard.dealCreatedPendingApproval', { defaultValue: 'Deal created — visible to travelers once approved' }));
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      setDialogOpen(false);
    } catch {
      toast.error(t('agencyDashboard.dealCreateFailed', { defaultValue: 'Failed to create deal' }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDeal(deleteTarget.id);
      toast.success(t('agencyDashboard.dealDeleted', { defaultValue: 'Deal deleted' }));
    } catch {
      toast.error(t('agencyDashboard.dealDeleteFailed', { defaultValue: 'Failed to delete deal' }));
    } finally {
      setDeleteTarget(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "paused":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "expired":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t('agencyDashboard.active');
      case "scheduled":
        return t('agencyDashboard.scheduled', 'Scheduled');
      case "paused":
        return t('agencyDashboard.paused', 'Paused');
      case "expired":
        return t('agencyDashboard.expired');
      default:
        return status;
    }
  };

  const approvalBadge = (approvalStatus: string) => {
    switch (approvalStatus) {
      case 'pending':
        return { label: t('agencyDashboard.awaitingApproval', 'Awaiting approval'), className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
      case 'rejected':
        return { label: t('agencyDashboard.rejected', 'Rejected'), className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
      default:
        return null;
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
        <p className="text-destructive">{t('common.error')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {t('agencyDashboard.dealsAndPromotions')}
        </h1>

        <Button className="flex items-center gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          {t('agencyDashboard.createDeal')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('agencyDashboard.editDeal', 'Edit deal')
                : t('agencyDashboard.createDeal')}
            </DialogTitle>
          </DialogHeader>
          {editing?.approval_status === 'rejected' && (
            <p className="text-sm text-muted-foreground text-start">
              {t('agencyDashboard.editResubmitHint', 'Saving changes resubmits this deal for admin review.')}
            </p>
          )}
          <div className="space-y-4 py-4">
            <Input
              placeholder={t('agencyDashboard.dealTitle', { defaultValue: 'Deal Title' })}
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t('agencyDashboard.dealPackage', { defaultValue: 'Package' })}
              </label>
              <Select
                value={form.package_id}
                onValueChange={(value) => setForm(f => ({ ...f, package_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('agencyDashboard.selectPackage', { defaultValue: 'Select a package' })} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>{pkg.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                {t('agencyDashboard.discountPercentage', { defaultValue: 'Discount (%)' })}
              </label>
              <Input
                type="number"
                min={1}
                max={90}
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
                min={form.start_date || undefined}
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {t('common.save', { defaultValue: 'Save' })}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {deals.length === 0 ? (
        <EmptyState
          icon="tag"
          title={t('agencyDashboard.noDealsYet', { defaultValue: 'No Deals Yet' })}
          description={t('agencyDashboard.createFirstDeal', { defaultValue: 'Create your first deal or promotion to attract travelers.' })}
          action={{
            label: t('agencyDashboard.createDeal'),
            onClick: openCreate,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => {
            const displayStatus = derivedDealStatus(deal, todayIso);
            return (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{deal.title}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge className={getStatusColor(displayStatus)}>
                        {getStatusLabel(displayStatus)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(deal)}
                        aria-label={t('agencyDashboard.editDeal', 'Edit deal')}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(deal)}
                        className="text-destructive hover:text-destructive/80"
                        aria-label={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Approval state is moot once a deal has expired — show one status, not two. */}
                  {displayStatus !== "expired" && approvalBadge(deal.approval_status) && (
                    <Badge className={`w-fit mt-1 ${approvalBadge(deal.approval_status)!.className}`}>
                      {approvalBadge(deal.approval_status)!.label}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">{deal.discount_percentage}%</span>
                      <span className="text-sm text-muted-foreground">{t('common.off', { defaultValue: 'off' })}</span>
                    </div>

                    {packageTitle(deal.package_id) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" />
                        <span className="truncate">{packageTitle(deal.package_id)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(deal.start_date)} – {formatDate(deal.end_date)}</span>
                    </div>

                    {deal.approval_status === 'rejected' && deal.rejection_reason && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-start">
                        <p className="text-xs font-medium text-destructive mb-0.5">
                          {t('agencyDashboard.rejectionReason', 'Reason for rejection')}
                        </p>
                        <p className="text-sm text-foreground">{deal.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation (matches the Gallery pattern) */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agencyDashboard.deleteDealTitle', 'Delete this deal?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agencyDashboard.deleteDealDesc', 'This permanently removes the deal. Approved deals disappear from the public feed immediately.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
