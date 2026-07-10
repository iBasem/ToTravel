import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Switch } from '@/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/ui/select';
import type {
    AdminDestination,
    DestinationInsert,
} from '@/features/admin/hooks/useAdminDestinations';

export interface DestinationFormValues {
    slug: string;
    kind: 'country' | 'region';
    name: string;
    name_ar: string;
    region_label: string;
    region_label_ar: string;
    description: string;
    description_ar: string;
    highlights: string;
    highlights_ar: string;
    region_keys: string;
    image_url: string;
    color_class: string;
    featured: boolean;
}

const emptyValues: DestinationFormValues = {
    slug: '',
    kind: 'country',
    name: '',
    name_ar: '',
    region_label: '',
    region_label_ar: '',
    description: '',
    description_ar: '',
    highlights: '',
    highlights_ar: '',
    region_keys: '',
    image_url: '',
    color_class: '',
    featured: false,
};

const toLines = (value: string): string[] =>
    value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

const fromLines = (values: string[] | null | undefined): string =>
    (values ?? []).join('\n');

function rowToValues(row: AdminDestination): DestinationFormValues {
    return {
        slug: row.slug,
        kind: row.kind === 'region' ? 'region' : 'country',
        name: row.name,
        name_ar: row.name_ar ?? '',
        region_label: row.region_label ?? '',
        region_label_ar: row.region_label_ar ?? '',
        description: row.description ?? '',
        description_ar: row.description_ar ?? '',
        highlights: fromLines(row.highlights),
        highlights_ar: fromLines(row.highlights_ar),
        region_keys: fromLines(row.region_keys),
        image_url: row.image_url ?? '',
        color_class: row.color_class ?? '',
        featured: row.featured,
    };
}

function valuesToPayload(values: DestinationFormValues): DestinationInsert {
    return {
        slug: values.slug.trim(),
        kind: values.kind,
        name: values.name.trim(),
        name_ar: values.name_ar.trim() || null,
        region_label: values.region_label.trim() || null,
        region_label_ar: values.region_label_ar.trim() || null,
        description: values.description.trim() || null,
        description_ar: values.description_ar.trim() || null,
        highlights: toLines(values.highlights),
        highlights_ar: toLines(values.highlights_ar),
        region_keys: toLines(values.region_keys),
        image_url: values.image_url.trim() || null,
        color_class: values.color_class.trim() || null,
        featured: values.featured,
    };
}

interface DestinationFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Row being edited, or null when creating a new destination. */
    destination: AdminDestination | null;
    /** Receives the DB-ready payload (arrays split, empty strings nulled). */
    onSubmit: (payload: DestinationInsert) => Promise<void>;
    submitting: boolean;
}

export function DestinationFormDialog({
    open,
    onOpenChange,
    destination,
    onSubmit,
    submitting,
}: DestinationFormDialogProps) {
    const { t } = useTranslation();
    const isEdit = !!destination;

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<DestinationFormValues>({ defaultValues: emptyValues });

    useEffect(() => {
        if (open) {
            reset(destination ? rowToValues(destination) : emptyValues);
        }
    }, [open, destination, reset]);

    const fieldError = (message?: string) =>
        message ? <p className="text-sm text-destructive">{message}</p> : null;

    return (
        <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit
                            ? t('adminDestinations.editTitle', 'Edit Destination')
                            : t('adminDestinations.createTitle', 'New Destination')}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            'adminDestinations.formDescription',
                            'Destinations power the public marketplace pages. Fields marked * are required.',
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(async (values) => {
                        await onSubmit(valuesToPayload(values));
                    })}
                    className="space-y-4"
                    noValidate
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dest-slug">
                                {t('adminDestinations.slug', 'Slug')} *
                            </Label>
                            <Input
                                id="dest-slug"
                                dir="ltr"
                                placeholder="e.g. north-lebanon"
                                aria-invalid={!!errors.slug}
                                {...register('slug', {
                                    required: t('adminDestinations.slugRequired', 'Slug is required'),
                                    pattern: {
                                        value: /^[a-z0-9-]+$/,
                                        message: t(
                                            'adminDestinations.slugPattern',
                                            'Use lowercase letters, numbers and dashes only',
                                        ),
                                    },
                                })}
                            />
                            {fieldError(errors.slug?.message)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-kind">
                                {t('adminDestinations.kind', 'Kind')} *
                            </Label>
                            <Controller
                                control={control}
                                name="kind"
                                rules={{
                                    required: t('adminDestinations.kindRequired', 'Kind is required'),
                                }}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger id="dest-kind" aria-invalid={!!errors.kind}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="country">
                                                {t('adminDestinations.kindCountry', 'Country')}
                                            </SelectItem>
                                            <SelectItem value="region">
                                                {t('adminDestinations.kindRegion', 'Region')}
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {fieldError(errors.kind?.message)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-name">
                                {t('adminDestinations.name', 'Name (English)')} *
                            </Label>
                            <Input
                                id="dest-name"
                                aria-invalid={!!errors.name}
                                {...register('name', {
                                    required: t('adminDestinations.nameRequired', 'Name is required'),
                                })}
                            />
                            {fieldError(errors.name?.message)}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-name-ar">
                                {t('adminDestinations.nameAr', 'Name (Arabic)')}
                            </Label>
                            <Input id="dest-name-ar" dir="rtl" {...register('name_ar')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-region-label">
                                {t('adminDestinations.regionLabel', 'Region label (English)')}
                            </Label>
                            <Input id="dest-region-label" {...register('region_label')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-region-label-ar">
                                {t('adminDestinations.regionLabelAr', 'Region label (Arabic)')}
                            </Label>
                            <Input id="dest-region-label-ar" dir="rtl" {...register('region_label_ar')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dest-description">
                            {t('adminDestinations.description', 'Description (English)')}
                        </Label>
                        <Textarea id="dest-description" rows={3} {...register('description')} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dest-description-ar">
                            {t('adminDestinations.descriptionAr', 'Description (Arabic)')}
                        </Label>
                        <Textarea id="dest-description-ar" dir="rtl" rows={3} {...register('description_ar')} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dest-highlights">
                                {t('adminDestinations.highlights', 'Highlights (English, one per line)')}
                            </Label>
                            <Textarea id="dest-highlights" rows={4} {...register('highlights')} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-highlights-ar">
                                {t('adminDestinations.highlightsAr', 'Highlights (Arabic, one per line)')}
                            </Label>
                            <Textarea id="dest-highlights-ar" dir="rtl" rows={4} {...register('highlights_ar')} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dest-region-keys">
                            {t('adminDestinations.regionKeys', 'Region keys (one per line)')}
                        </Label>
                        <Textarea
                            id="dest-region-keys"
                            dir="ltr"
                            rows={3}
                            placeholder={t(
                                'adminDestinations.regionKeysHint',
                                'Internal keys used to match packages to this destination',
                            )}
                            {...register('region_keys')}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dest-image-url">
                                {t('adminDestinations.imageUrl', 'Image URL')}
                            </Label>
                            <Input
                                id="dest-image-url"
                                dir="ltr"
                                type="url"
                                placeholder="https://..."
                                {...register('image_url')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dest-color-class">
                                {t('adminDestinations.colorClass', 'Color class')}
                            </Label>
                            <Input
                                id="dest-color-class"
                                dir="ltr"
                                placeholder="e.g. from-emerald-500/80"
                                {...register('color_class')}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <Label htmlFor="dest-featured" className="cursor-pointer">
                            {t('adminDestinations.featured', 'Featured')}
                        </Label>
                        <Controller
                            control={control}
                            name="featured"
                            render={({ field }) => (
                                <Switch
                                    id="dest-featured"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {t('adminDestinations.cancel', 'Cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting
                                ? t('adminDestinations.saving', 'Saving...')
                                : isEdit
                                    ? t('adminDestinations.saveChanges', 'Save Changes')
                                    : t('adminDestinations.create', 'Create Destination')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
