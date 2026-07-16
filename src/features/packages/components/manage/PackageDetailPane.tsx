import { useTranslation } from "react-i18next";
import {
    Package, MapPin, Clock, Users, Tag, CheckCircle2, Edit, MoreHorizontal,
    CalendarDays, Copy, Trash2, Eye, Send, EyeOff,
} from "lucide-react";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { StarRating } from "@/features/reviews/components/StarRating";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { pickLocalized, localizedText } from "@/lib/localized";
import type { PackageWithDetails } from "@/features/packages/hooks/usePackages";
import { getStatusBadge } from "./status";

interface PackageDetailPaneProps {
    pkg: PackageWithDetails;
    isRTL: boolean;
    onEdit: () => void;
    onManageDepartures: () => void;
    onDuplicate: () => void;
    onTogglePublish: () => void;
    onPreview: () => void;
    onDelete: () => void;
}

function primaryImage(pkg: PackageWithDetails) {
    const media = pkg.package_media ?? [];
    if (media.length === 0) return null;
    return media.find((m) => m.is_primary)?.file_path ?? media[0]?.file_path ?? null;
}

export function PackageDetailPane({
    pkg, isRTL, onEdit, onManageDepartures, onDuplicate, onTogglePublish, onPreview, onDelete,
}: PackageDetailPaneProps) {
    const { t } = useTranslation();
    const hero = primaryImage(pkg);
    const status = getStatusBadge(pkg.status, t);
    const rating = Number(pkg.average_rating ?? 0);
    const reviews = pkg.total_reviews ?? 0;
    const inclusions = (pickLocalized<string[]>(pkg, "inclusions") ?? []).filter((i) => i && i.trim());
    const isPublished = pkg.status === "published";

    const meta = [
        { icon: MapPin, label: t("agencyDashboard.location", "Location"), value: localizedText(pkg, "destination") },
        { icon: Clock, label: t("agencyDashboard.duration", "Duration"), value: `${pkg.duration_days} ${t("common.days")} / ${pkg.duration_nights} ${t("agencyDashboard.nights")}` },
        { icon: Users, label: t("agencyDashboard.quota", "Quota"), value: `${pkg.max_participants ?? 0} ${t("agencyDashboard.participantsUnit", "Participants")}` },
        { icon: Tag, label: t("agencyDashboard.price", "Price"), value: `${formatCurrency(pkg.base_price)} / ${t("agencyDashboard.person", "person")}` },
    ];

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="relative h-52 sm:h-64 w-full rounded-2xl overflow-hidden bg-muted">
                {hero ? (
                    <img src={hero} alt={localizedText(pkg, "title")} className="h-full w-full object-cover" />
                ) : (
                    <div className="grid h-full place-items-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary/40">
                        <Package className="h-12 w-12" aria-hidden="true" />
                    </div>
                )}
                <Badge variant="outline" className={`absolute top-3 end-3 ${status.className}`}>{status.label}</Badge>
            </div>

            {/* Title row + actions */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground text-start text-balance">{localizedText(pkg, "title")}</h2>
                    <div className="mt-1.5 flex items-center gap-2">
                        <StarRating rating={Math.round(rating)} readonly size="sm" />
                        <span className="text-sm text-muted-foreground">
                            {reviews > 0
                                ? <><span className="font-medium text-foreground tabular-nums">{rating.toFixed(1)}</span> ({t("agencyDashboard.ratingsCount", "{{count}} ratings", { count: formatNumber(reviews) })})</>
                                : t("agencyDashboard.noRatingsYet", "No ratings")}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={onEdit} className="gap-2">
                        <Edit className="h-4 w-4" />
                        {t("agencyDashboard.editPackage", "Edit Package")}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label={t("common.moreActions", "More actions")}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-52">
                            <DropdownMenuItem onClick={onManageDepartures}>
                                <CalendarDays className="h-4 w-4 me-2" />
                                {t("departures.manage", "Manage departures")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onTogglePublish}>
                                {isPublished
                                    ? <><EyeOff className="h-4 w-4 me-2" />{t("agencyDashboard.unpublish")}</>
                                    : <><Send className="h-4 w-4 me-2" />{t("agencyDashboard.publish")}</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDuplicate}>
                                <Copy className="h-4 w-4 me-2" />
                                {t("packageWizard.duplicate", "Duplicate")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onPreview}>
                                <Eye className="h-4 w-4 me-2" />
                                {t("agencyDashboard.travelerPreview", "Traveler preview")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 me-2" />
                                {t("common.delete")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {meta.map((m) => (
                    <div key={m.label} className="flex items-start gap-2.5 text-start">
                        <span className="grid place-items-center h-9 w-9 rounded-lg bg-muted text-muted-foreground shrink-0">
                            <m.icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">{m.label}</p>
                            <p className="text-sm font-medium text-foreground leading-snug">{m.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* About */}
            {localizedText(pkg, "description") && (
                <section className="text-start">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        {t("agencyDashboard.about", "About")}
                    </h3>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                        {localizedText(pkg, "description")}
                    </p>
                </section>
            )}

            {/* Includes */}
            {inclusions.length > 0 && (
                <section className="text-start">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                        {t("agencyDashboard.includes", "Includes")}
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                        {inclusions.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                                <span className="min-w-0">{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
