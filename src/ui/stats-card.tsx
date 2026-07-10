import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    /** Optional lucide icon shown at the end of the header row. */
    icon?: LucideIcon;
    /** Optional rich footer (e.g. a growth indicator); wins over description. */
    footer?: React.ReactNode;
    className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, footer, className }: StatsCardProps) {
    return (
        <Card className={className}>
            <CardHeader className={cn("pb-2 text-start", Icon && "flex flex-row items-center justify-between space-y-0")}>
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground/40" aria-hidden="true" />}
            </CardHeader>
            <CardContent className="text-start">
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                {footer ?? (description && <p className="text-xs text-muted-foreground mt-1">{description}</p>)}
            </CardContent>
        </Card>
    );
}

interface StatsGridProps {
    stats: {
        title: string;
        value: string | number;
        description?: string;
        icon?: LucideIcon;
        footer?: React.ReactNode;
    }[];
    className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6", className)}>
            {stats.map((stat, index) => (
                <StatsCard key={index} {...stat} />
            ))}
        </div>
    );
}
