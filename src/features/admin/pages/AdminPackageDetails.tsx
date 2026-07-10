import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Archive,
  BadgeCheck,
  Building2,
  Check,
  CloudOff,
  Mail,
  MapPin,
  PauseCircle,
  Phone,
  Star,
  X,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Card, CardContent } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/tabs';
import { EmptyState } from '@/ui/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/ui/alert-dialog';
import { localizedText } from '@/lib/localized';
import { RouteMap } from '@/features/packages/components/details/RouteMap';
import {
  useAdminPackageDetails,
  useUpdateAdminPackageStatus,
  useToggleAdminPackageFeatured,
  type PackageModerationAction,
} from '@/features/admin/hooks/useAdminPackageDetails';
import { OverviewTab } from '@/features/admin/components/package-details/OverviewTab';
import { MediaTab } from '@/features/admin/components/package-details/MediaTab';
import { ItineraryTab } from '@/features/admin/components/package-details/ItineraryTab';
import { DeparturesTab } from '@/features/admin/components/package-details/DeparturesTab';

/** Moderation actions that need an explicit confirmation before running. */
const DESTRUCTIVE_ACTIONS: PackageModerationAction[] = ['reject', 'suspend', 'archive'];

export default function AdminPackageDetails() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminPackageDetails(id);
  const statusMutation = useUpdateAdminPackageStatus();
  const featuredMutation = useToggleAdminPackageFeatured();
  const [confirmAction, setConfirmAction] = useState<PackageModerationAction | null>(null);

  const pkg = data?.package ?? null;
  const busy = statusMutation.isPending || featuredMutation.isPending;

  const runAction = async (action: PackageModerationAction) => {
    if (!pkg) return;
    try {
      await statusMutation.mutateAsync({ packageId: pkg.id, title: pkg.title, action });
      toast.success(actionSuccessMessage(t, action));
    } catch {
      toast.error(t('adminPackageDetails.updateError', 'Failed to update package'));
    }
  };

  const handleAction = (action: PackageModerationAction) => {
    if (DESTRUCTIVE_ACTIONS.includes(action)) {
      setConfirmAction(action);
    } else {
      void runAction(action);
    }
  };

  const handleConfirm = async () => {
    const action = confirmAction;
    setConfirmAction(null);
    if (action) await runAction(action);
  };

  const handleToggleFeatured = async () => {
    if (!pkg) return;
    try {
      await featuredMutation.mutateAsync({
        packageId: pkg.id,
        title: pkg.title,
        featured: !pkg.featured,
      });
      toast.success(
        pkg.featured
          ? t('adminPackageDetails.unfeatureSuccess', 'Package removed from featured')
          : t('adminPackageDetails.featureSuccess', 'Package marked as featured'),
      );
    } catch {
      toast.error(t('adminPackageDetails.updateError', 'Failed to update package'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-40" />
        <div className="flex flex-col lg:flex-row gap-4">
          <Skeleton className="h-28 flex-1" />
          <Skeleton className="h-28 w-full lg:w-80" />
        </div>
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="package"
        title={t('adminPackageDetails.loadErrorTitle', 'Failed to load package')}
        description={t(
          'adminPackageDetails.loadErrorDesc',
          'Something went wrong while loading this package. Please try again.',
        )}
        action={{
          label: t('common.retry', 'Retry'),
          onClick: () => void refetch(),
        }}
      />
    );
  }

  if (!pkg) {
    return (
      <div className="space-y-6">
        <BackLink />
        <EmptyState
          icon="package"
          title={t('adminPackageDetails.notFoundTitle', 'Package not found')}
          description={t(
            'adminPackageDetails.notFoundDesc',
            'This package does not exist or has been removed.',
          )}
        />
      </div>
    );
  }

  const agency = data?.agency ?? null;
  const status = pkg.status ?? 'draft';

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{localizedText(pkg, 'title')}</h1>
            <StatusBadge status={status} />
            {pkg.featured && (
              <Star
                className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0"
                aria-label={t('adminPackageDetails.featured', 'Featured')}
              />
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
            <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
            {localizedText(pkg, 'destination')}
          </p>
        </div>

        {/* Agency card */}
        <Card className="w-full lg:w-80 shrink-0">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="font-semibold truncate">
                {agency?.company_name ?? t('adminPackageDetails.unknownAgency', 'Unknown agency')}
              </span>
              {agency?.is_verified && (
                <BadgeCheck
                  className="w-4 h-4 text-primary shrink-0"
                  aria-label={t('adminPackageDetails.verifiedAgency', 'Verified agency')}
                />
              )}
            </div>
            {agency?.email && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span dir="ltr">{agency.email}</span>
              </p>
            )}
            {agency?.phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span dir="ltr">{agency.phone}</span>
              </p>
            )}
            {agency?.status && (
              <Badge variant="outline" className="mt-1">
                {t(`adminPackageDetails.agencyStatus_${agency.status}`, agency.status)}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Moderation actions */}
      <div className="flex flex-wrap items-center gap-2">
        {(status === 'pending' || status === 'draft') && (
          <Button onClick={() => handleAction('approve')} disabled={busy}>
            <Check className="w-4 h-4 me-1.5" aria-hidden="true" />
            {t('adminPackageDetails.approve', 'Approve & publish')}
          </Button>
        )}
        {status === 'pending' && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => handleAction('reject')}
            disabled={busy}
          >
            <X className="w-4 h-4 me-1.5" aria-hidden="true" />
            {t('adminPackageDetails.reject', 'Reject')}
          </Button>
        )}
        {status === 'published' && (
          <>
            <Button variant="outline" onClick={() => handleAction('unpublish')} disabled={busy}>
              <CloudOff className="w-4 h-4 me-1.5" aria-hidden="true" />
              {t('adminPackageDetails.unpublish', 'Unpublish')}
            </Button>
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => handleAction('suspend')}
              disabled={busy}
            >
              <PauseCircle className="w-4 h-4 me-1.5" aria-hidden="true" />
              {t('adminPackageDetails.suspend', 'Suspend')}
            </Button>
          </>
        )}
        {status === 'suspended' && (
          <Button onClick={() => handleAction('republish')} disabled={busy}>
            <Check className="w-4 h-4 me-1.5" aria-hidden="true" />
            {t('adminPackageDetails.republish', 'Republish')}
          </Button>
        )}
        {(status === 'published' || status === 'suspended') && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => handleAction('archive')}
            disabled={busy}
          >
            <Archive className="w-4 h-4 me-1.5" aria-hidden="true" />
            {t('adminPackageDetails.archive', 'Archive')}
          </Button>
        )}
        <Button variant="outline" onClick={handleToggleFeatured} disabled={busy}>
          <Star
            className={`w-4 h-4 me-1.5 ${pkg.featured ? 'text-amber-500 fill-amber-500' : ''}`}
            aria-hidden="true"
          />
          {pkg.featured
            ? t('adminPackageDetails.unfeature', 'Remove featured')
            : t('adminPackageDetails.feature', 'Mark featured')}
        </Button>
      </div>

      {/* Inspection tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">
            {t('adminPackageDetails.tabOverview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="media">
            {t('adminPackageDetails.tabMedia', 'Media')}
            <span className="ms-1.5 text-xs text-muted-foreground">
              {data?.media.length ?? 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="itinerary">
            {t('adminPackageDetails.tabItinerary', 'Itinerary')}
            <span className="ms-1.5 text-xs text-muted-foreground">
              {data?.itinerary.length ?? 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="route">{t('adminPackageDetails.tabRoute', 'Route')}</TabsTrigger>
          <TabsTrigger value="departures">
            {t('adminPackageDetails.tabDepartures', 'Departures')}
            <span className="ms-1.5 text-xs text-muted-foreground">
              {data?.departures.length ?? 0}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab pkg={pkg} />
        </TabsContent>
        <TabsContent value="media" className="mt-4">
          <MediaTab media={data?.media ?? []} />
        </TabsContent>
        <TabsContent value="itinerary" className="mt-4">
          <ItineraryTab itinerary={data?.itinerary ?? []} />
        </TabsContent>
        <TabsContent value="route" className="mt-4">
          {(data?.routes.length ?? 0) === 0 ? (
            <EmptyState
              icon="package"
              title={t('adminPackageDetails.noRoute', 'No route')}
              description={t(
                'adminPackageDetails.noRouteDesc',
                'This package has no route destinations yet.',
              )}
            />
          ) : (
            <RouteMap routes={data!.routes} />
          )}
        </TabsContent>
        <TabsContent value="departures" className="mt-4">
          <DeparturesTab departures={data?.departures ?? []} basePrice={Number(pkg.base_price)} />
        </TabsContent>
      </Tabs>

      {/* Destructive action confirmation */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle(t, confirmAction)}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription(t, confirmAction)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('adminPackageDetails.confirm', 'Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BackLink() {
  const { t } = useTranslation();
  return (
    <Link
      to="/admin/packages"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
      {t('adminPackageDetails.backToPackages', 'Back to packages')}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const label = t(`adminPackageDetails.status_${status}`, status);
  switch (status) {
    case 'published':
      return (
        <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">
          {label}
        </Badge>
      );
    case 'suspended':
      return <Badge variant="destructive">{label}</Badge>;
    case 'pending':
      return <Badge variant="secondary">{label}</Badge>;
    default:
      return <Badge variant="outline">{label}</Badge>;
  }
}

type TFunc = ReturnType<typeof useTranslation>['t'];

function actionSuccessMessage(t: TFunc, action: PackageModerationAction): string {
  switch (action) {
    case 'approve':
      return t('adminPackageDetails.approveSuccess', 'Package approved and published');
    case 'reject':
      return t('adminPackageDetails.rejectSuccess', 'Package rejected and moved to draft');
    case 'suspend':
      return t('adminPackageDetails.suspendSuccess', 'Package suspended');
    case 'archive':
      return t('adminPackageDetails.archiveSuccess', 'Package archived');
    case 'unpublish':
      return t('adminPackageDetails.unpublishSuccess', 'Package unpublished and moved to draft');
    case 'republish':
      return t('adminPackageDetails.republishSuccess', 'Package republished');
  }
}

function confirmTitle(t: TFunc, action: PackageModerationAction | null): string {
  switch (action) {
    case 'reject':
      return t('adminPackageDetails.confirmRejectTitle', 'Reject this package?');
    case 'suspend':
      return t('adminPackageDetails.confirmSuspendTitle', 'Suspend this package?');
    case 'archive':
      return t('adminPackageDetails.confirmArchiveTitle', 'Archive this package?');
    default:
      return '';
  }
}

function confirmDescription(t: TFunc, action: PackageModerationAction | null): string {
  switch (action) {
    case 'reject':
      return t(
        'adminPackageDetails.confirmRejectDesc',
        'The package will be moved back to draft. The agency can edit and resubmit it.',
      );
    case 'suspend':
      return t(
        'adminPackageDetails.confirmSuspendDesc',
        'The package will be hidden from travelers until it is republished.',
      );
    case 'archive':
      return t(
        'adminPackageDetails.confirmArchiveDesc',
        'The package will be archived and no longer visible to travelers.',
      );
    default:
      return '';
  }
}
