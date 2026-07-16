import { useTranslation } from "react-i18next";
import { Package, Star } from "lucide-react";
import { Badge } from "@/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { localizedText } from "@/lib/localized";
import type { PackageWithDetails } from "@/features/packages/hooks/usePackages";
import { getStatusBadge } from "./status";

interface PackageListItemProps {
    pkg: PackageWithDetails;
    selected: boolean;
    onSelect: (id: string) => void;
}

function primaryImage(pkg: PackageWithDetails) {
    const media = pkg.package_media ?? [];
    if (media.length === 0) return null;
    return media.find((m) => m.is_primary)?.file_path ?? media[0]?.file_path ?? null;
}

export function PackageListItem({ pkg, selected, onSelect }: PackageListItemProps) {
    const { t } = useTranslation();
    const thumb = primaryImage(pkg);
    const status = getStatusBadge(pkg.status, t);
    const rating = Number(pkg.average_rating ?? 0);
    const reviews = pkg.total_reviews ?? 0;

    return (
        <button
            type="button"
            onClick={() => onSelect(pkg.id)}
            aria-current={selected}
            className={cn(
                "w-full text-start rounded-xl border p-2.5 flex gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                    : "border-transparent hover:bg-card hover:border-border hover:shadow-sm",
            )}
        >
            <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                {thumb ? (
                    <img
                        src={thumb}
                        alt={localizedText(pkg, "title")}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                    />
                ) : (
                    <div className="grid h-full place-items-center text-primary/40">
                        <Package className="h-6 w-6" aria-hidden="true" />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{localizedText(pkg, "title")}</p>
                    <Badge variant="outline" className={cn("shrink-0 text-[10px] px-1.5 py-0", status.className)}>
                        {status.label}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {localizedText(pkg, "destination")} · {pkg.duration_days}
                    {t("agencyDashboard.dayShort", "D")}/{pkg.duration_nights}
                    {t("agencyDashboard.nightShort", "N")}
                </p>
                <div className="flex items-center justify-between gap-2 mt-1.5">
                    {reviews > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                            <span className="tabular-nums font-medium text-foreground">{rating.toFixed(1)}</span>
                        </span>
                    ) : (
                        <span className="text-xs text-muted-foreground/70">{t("agencyDashboard.noRatingsYet", "No ratings")}</span>
                    )}
                    <span className="text-sm font-bold text-primary tabular-nums">
                        {formatCurrency(pkg.base_price)}
                        <span className="text-[11px] font-normal text-muted-foreground">/{t("agencyDashboard.person", "person")}</span>
                    </span>
                </div>
            </div>
        </button>
    );
}
