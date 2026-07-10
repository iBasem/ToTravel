import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Card, CardContent } from '@/ui/card';
import { Skeleton } from '@/ui/skeleton';
import { StatsGrid } from '@/ui/stats-card';
import { EmptyState } from '@/ui/empty-state';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@/ui/table';
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
import {
    useAdminDestinations,
    type AdminDestination,
    type DestinationInsert,
} from '@/features/admin/hooks/useAdminDestinations';
import { DestinationFormDialog } from '@/features/admin/components/destinations/DestinationFormDialog';
import { SortableDestinationRow } from '@/features/admin/components/destinations/SortableDestinationRow';

const isDuplicateSlug = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: string }).code === '23505';

export default function DestinationManagement() {
    const { t } = useTranslation();
    const {
        destinations,
        isLoading,
        isError,
        refetch,
        createDestination,
        updateDestination,
        deleteDestination,
        toggleFeatured,
        reorderDestinations,
    } = useAdminDestinations();

    const [searchTerm, setSearchTerm] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<AdminDestination | null>(null);
    const [deleting, setDeleting] = useState<AdminDestination | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const filtered = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return destinations;
        return destinations.filter(
            (d) =>
                d.name.toLowerCase().includes(q) ||
                (d.name_ar ?? '').toLowerCase().includes(q) ||
                d.slug.toLowerCase().includes(q) ||
                (d.region_label ?? '').toLowerCase().includes(q) ||
                (d.region_label_ar ?? '').toLowerCase().includes(q),
        );
    }, [destinations, searchTerm]);

    const searching = searchTerm.trim().length > 0;

    const stats = [
        {
            title: t('adminDestinations.statTotal', 'Total Destinations'),
            value: destinations.length,
        },
        {
            title: t('adminDestinations.statCountries', 'Countries'),
            value: destinations.filter((d) => d.kind === 'country').length,
        },
        {
            title: t('adminDestinations.statRegions', 'Regions'),
            value: destinations.filter((d) => d.kind === 'region').length,
        },
        {
            title: t('adminDestinations.statFeatured', 'Featured'),
            value: destinations.filter((d) => d.featured).length,
        },
    ];

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (destination: AdminDestination) => {
        setEditing(destination);
        setFormOpen(true);
    };

    const handleFormSubmit = async (payload: DestinationInsert) => {
        try {
            if (editing) {
                await updateDestination.mutateAsync({ id: editing.id, values: payload });
                toast.success(t('adminDestinations.updateSuccess', 'Destination updated'));
            } else {
                await createDestination.mutateAsync(payload);
                toast.success(t('adminDestinations.createSuccess', 'Destination created'));
            }
            setFormOpen(false);
            setEditing(null);
        } catch (error) {
            if (isDuplicateSlug(error)) {
                toast.error(
                    t('adminDestinations.slugTaken', 'This slug is already in use'),
                );
            } else {
                toast.error(
                    t('adminDestinations.saveError', 'Failed to save destination'),
                );
            }
        }
    };

    const handleDelete = async () => {
        if (!deleting) return;
        try {
            await deleteDestination.mutateAsync({
                id: deleting.id,
                name: deleting.name,
                slug: deleting.slug,
            });
            toast.success(t('adminDestinations.deleteSuccess', 'Destination deleted'));
        } catch {
            toast.error(t('adminDestinations.deleteError', 'Failed to delete destination'));
        }
        setDeleting(null);
    };

    const handleToggleFeatured = (destination: AdminDestination, featured: boolean) => {
        toggleFeatured.mutate(
            { id: destination.id, featured, name: destination.name },
            {
                onSuccess: () => {
                    toast.success(
                        featured
                            ? t('adminDestinations.featureSuccess', 'Destination featured')
                            : t('adminDestinations.unfeatureSuccess', 'Destination unfeatured'),
                    );
                },
                onError: () => {
                    toast.error(
                        t('adminDestinations.featureError', 'Failed to update featured status'),
                    );
                },
            },
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = destinations.findIndex((d) => d.id === active.id);
        const newIndex = destinations.findIndex((d) => d.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(destinations, oldIndex, newIndex);
        reorderDestinations.mutate(reordered, {
            onSuccess: () => {
                toast.success(t('adminDestinations.reorderSuccess', 'Order updated'));
            },
            onError: () => {
                toast.error(t('adminDestinations.reorderError', 'Failed to update order'));
            },
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        {t('adminDestinations.title', 'Destination Management')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t(
                            'adminDestinations.pageDescription',
                            'Manage the destinations shown across the marketplace',
                        )}
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 me-1" aria-hidden="true" />
                    {t('adminDestinations.addDestination', 'Add Destination')}
                </Button>
            </div>

            {/* Stats */}
            <StatsGrid stats={stats} />

            {/* Search */}
            <div className="relative max-w-md">
                <Search
                    className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t(
                        'adminDestinations.searchPlaceholder',
                        'Search by name, slug or region...',
                    )}
                    className="ps-9"
                />
            </div>
            {searching && (
                <p className="text-xs text-muted-foreground">
                    {t(
                        'adminDestinations.reorderDisabledHint',
                        'Clear the search to reorder destinations',
                    )}
                </p>
            )}

            {/* Table */}
            {isError ? (
                <EmptyState
                    icon="map-pin"
                    title={t('adminDestinations.loadErrorTitle', 'Failed to load destinations')}
                    description={t(
                        'adminDestinations.loadErrorDescription',
                        'Something went wrong while loading destinations. Please try again.',
                    )}
                    action={{
                        label: t('adminDestinations.retry', 'Retry'),
                        onClick: () => refetch(),
                    }}
                />
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon="map-pin"
                    title={
                        searching
                            ? t('adminDestinations.noResults', 'No destinations match your search')
                            : t('adminDestinations.noDestinations', 'No destinations yet')
                    }
                    description={
                        searching
                            ? t(
                                'adminDestinations.noResultsDescription',
                                'Try a different search term.',
                            )
                            : t(
                                'adminDestinations.noDestinationsDescription',
                                'Create your first destination to populate the marketplace.',
                            )
                    }
                    action={
                        searching
                            ? undefined
                            : {
                                label: t('adminDestinations.addDestination', 'Add Destination'),
                                onClick: openCreate,
                            }
                    }
                />
            ) : (
                <Card>
                    <CardContent className="p-0 overflow-x-auto">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <span className="sr-only">
                                                {t('adminDestinations.reorder', 'Reorder')}
                                            </span>
                                        </TableHead>
                                        <TableHead>{t('adminDestinations.name', 'Name (English)')}</TableHead>
                                        <TableHead>{t('adminDestinations.slug', 'Slug')}</TableHead>
                                        <TableHead>{t('adminDestinations.kind', 'Kind')}</TableHead>
                                        <TableHead>
                                            {t('adminDestinations.regionLabel', 'Region label (English)')}
                                        </TableHead>
                                        <TableHead>{t('adminDestinations.featured', 'Featured')}</TableHead>
                                        <TableHead className="text-end">
                                            {t('adminDestinations.actions', 'Actions')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <SortableContext
                                        items={filtered.map((d) => d.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {filtered.map((destination) => (
                                            <SortableDestinationRow
                                                key={destination.id}
                                                destination={destination}
                                                dragDisabled={searching || reorderDestinations.isPending}
                                                featuredPending={toggleFeatured.isPending}
                                                onEdit={openEdit}
                                                onDelete={setDeleting}
                                                onToggleFeatured={handleToggleFeatured}
                                            />
                                        ))}
                                    </SortableContext>
                                </TableBody>
                            </Table>
                        </DndContext>
                    </CardContent>
                </Card>
            )}

            {/* Create / edit dialog */}
            <DestinationFormDialog
                open={formOpen}
                onOpenChange={(open) => {
                    setFormOpen(open);
                    if (!open) setEditing(null);
                }}
                destination={editing}
                onSubmit={handleFormSubmit}
                submitting={createDestination.isPending || updateDestination.isPending}
            />

            {/* Delete confirmation */}
            <AlertDialog
                open={!!deleting}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('adminDestinations.confirmDeleteTitle', 'Delete this destination?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'adminDestinations.confirmDeleteDesc',
                                'This will permanently remove "{{name}}" from the marketplace. This action cannot be undone.',
                                { name: deleting?.name ?? '' },
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            {t('adminDestinations.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {t('adminDestinations.delete', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
