import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Star, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/ui/table';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Switch } from '@/ui/switch';
import type { AdminDestination } from '@/features/admin/hooks/useAdminDestinations';

interface SortableDestinationRowProps {
    destination: AdminDestination;
    /** Disables the drag handle (e.g. while a search filter is active). */
    dragDisabled: boolean;
    featuredPending: boolean;
    onEdit: (destination: AdminDestination) => void;
    onDelete: (destination: AdminDestination) => void;
    onToggleFeatured: (destination: AdminDestination, featured: boolean) => void;
}

export function SortableDestinationRow({
    destination,
    dragDisabled,
    featuredPending,
    onEdit,
    onDelete,
    onToggleFeatured,
}: SortableDestinationRowProps) {
    const { t, i18n } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: destination.id, disabled: dragDisabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const displayName =
        (i18n.language === 'ar' && destination.name_ar) || destination.name;
    const regionLabel =
        (i18n.language === 'ar' && destination.region_label_ar) ||
        destination.region_label ||
        '—';

    return (
        <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted/50 relative z-10' : undefined}>
            <TableCell className="w-10">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    disabled={dragDisabled}
                    className="cursor-grab touch-none text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={t('adminDestinations.dragHandle', 'Drag to reorder')}
                >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
            </TableCell>
            <TableCell className="font-medium max-w-56">
                <div className="flex items-center gap-2 min-w-0">
                    {destination.featured && (
                        <Star className="h-3.5 w-3.5 shrink-0 text-deal fill-current" aria-hidden="true" />
                    )}
                    <span className="truncate">{displayName}</span>
                </div>
            </TableCell>
            <TableCell className="text-muted-foreground font-mono text-xs" dir="ltr">
                {destination.slug}
            </TableCell>
            <TableCell>
                <Badge variant="outline">
                    {destination.kind === 'region'
                        ? t('adminDestinations.kindRegion', 'Region')
                        : t('adminDestinations.kindCountry', 'Country')}
                </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground max-w-40 truncate">
                {regionLabel}
            </TableCell>
            <TableCell>
                <Switch
                    checked={destination.featured}
                    disabled={featuredPending}
                    onCheckedChange={(checked) => onToggleFeatured(destination, checked)}
                    aria-label={t('adminDestinations.toggleFeatured', 'Toggle featured')}
                />
            </TableCell>
            <TableCell>
                <div className="flex items-center justify-end gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(destination)}
                        aria-label={t('adminDestinations.edit', 'Edit')}
                    >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(destination)}
                        aria-label={t('adminDestinations.delete', 'Delete')}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}
