import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { initials } from "@/lib/utils";
import { useAgencyTravelers } from "@/features/agency/hooks/useAgencyTravelers";

interface NewMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (traveler: { id: string; name: string }) => void;
}

export function NewMessageDialog({ open, onOpenChange, onSelect }: NewMessageDialogProps) {
    const { t } = useTranslation();
    const { travelers, loading } = useAgencyTravelers();
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? travelers.filter((tr) => tr.name.toLowerCase().includes(q)) : travelers;
    }, [travelers, query]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("agencyDashboard.newMessage", "New Message")}</DialogTitle>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("agencyDashboard.searchTravelers")}
                        className="ps-9"
                        autoFocus
                    />
                </div>

                <div className="max-h-72 overflow-y-auto -mx-2 px-2">
                    {loading ? (
                        <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                    ) : filtered.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                            {travelers.length === 0
                                ? t("agencyDashboard.noTravelersToMessage", "No travelers have booked with you yet.")
                                : t("agencyDashboard.noTravelersFound", "No travelers found")}
                        </p>
                    ) : (
                        <ul className="space-y-1">
                            {filtered.map((tr) => (
                                <li key={tr.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect({ id: tr.id, name: tr.name })}
                                        className="w-full flex items-center gap-3 rounded-lg p-2 text-start hover:bg-muted transition-colors"
                                    >
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarFallback className="text-xs">{initials(tr.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{tr.name}</p>
                                            <p className="text-xs text-muted-foreground tabular-nums">
                                                {tr.totalBookings} {t("agencyDashboard.bookingsCount")}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
