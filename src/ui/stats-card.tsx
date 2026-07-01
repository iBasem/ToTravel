import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    className?: string;
}

export function StatsCard({ title, value, description, className }: StatsCardProps) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2 text-start">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
                <div className="text-2xl font-bold tabular-nums">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </CardContent>
        </Card>
    );
}

interface StatsGridProps {
    stats: {
        title: string;
        value: string | number;
        description?: string;
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
