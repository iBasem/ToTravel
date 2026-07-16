import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { EmptyState } from "@/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { formatCurrency } from "@/lib/formatters";
import type { OverviewPackage } from "@/features/agency/hooks/useAgencyOverview";

type SortKey = "latest" | "priceLow" | "priceHigh";

export function PackagesShowcaseCard({ packages }: { packages: OverviewPackage[] }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState<SortKey>("latest");

    const sorted = useMemo(() => {
        const copy = [...packages];
        switch (sortBy) {
            case "priceLow":
                return copy.sort((a, b) => a.base_price - b.base_price);
            case "priceHigh":
                return copy.sort((a, b) => b.base_price - a.base_price);
            default:
                return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
    }, [packages, sortBy]);

    const shown = sorted.slice(0, 3);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{t("agencyDashboard.travelPackages")}</CardTitle>
                    <div className="flex items-center gap-2">
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                            <SelectTrigger className="w-32 h-8 text-xs" aria-label={t("agencyDashboard.sortBy", "Sort by")}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="latest">{t("agencyDashboard.sortLatest", "Latest")}</SelectItem>
                                <SelectItem value="priceLow">{t("agencyDashboard.sortPriceLow", "Price: low to high")}</SelectItem>
                                <SelectItem value="priceHigh">{t("agencyDashboard.sortPriceHigh", "Price: high to low")}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/travel_agency/packages">{t("common.viewAll")}</Link>
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {shown.length === 0 ? (
                    <EmptyState
                        icon="package"
                        title={t("agencyDashboard.noPackagesYet")}
                        description={t("agencyDashboard.createFirstPackageDesc")}
                        action={{
                            label: t("agencyDashboard.createPackage"),
                            onClick: () => navigate("/travel_agency/packages/create"),
                        }}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {shown.map((pkg) => (
                            <Link
                                key={pkg.id}
                                to={`/travel_agency/packages/${pkg.id}`}
                                className="group rounded-xl border bg-card overflow-hidden flex flex-col transition-[border-color,box-shadow,transform] duration-200 ease-out hover:border-primary/40 hover:shadow-md motion-safe:hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <div className="relative h-28 w-full bg-muted overflow-hidden">
                                    {pkg.imageUrl ? (
                                        <img
                                            src={pkg.imageUrl}
                                            alt={pkg.title}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover:scale-105"
                                            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
                                        />
                                    ) : (
                                        <div className="grid place-items-center h-full text-primary/40">
                                            <Package className="w-8 h-8" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col gap-1 flex-1 text-start">
                                    <p className="text-sm font-semibold truncate">{pkg.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {pkg.duration_days} {t("common.days")} / {pkg.duration_nights} {t("agencyDashboard.nights")}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto pt-2">
                                        <span className="text-sm font-bold text-primary tabular-nums">
                                            {formatCurrency(pkg.base_price)}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
                                            {t("agencyDashboard.seeDetail", "See detail")}
                                            <ArrowRight className="w-3.5 h-3.5 rtl-flip transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
