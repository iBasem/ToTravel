import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Clock, ShieldAlert, XCircle, LogOut, Mail } from "lucide-react";
import { Button } from "@/ui/button";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";

type AgencyStatus = "pending" | "active" | "rejected" | "suspended";

const SUPPORT_EMAIL = "support@totravel.demo";

/**
 * Blocks the agency portal for non-active agencies (audit AGY-4). Admin status
 * decisions (pending / suspended / rejected) were previously invisible in the
 * portal: writes just failed with generic errors. Enforcement stays server-side
 * (RLS/triggers); this guard is the user-facing surface, so it fails OPEN on
 * fetch errors after one retry — a transient failure must not brick the portal
 * (see AGY-12 for the same principle in ProtectedRoute).
 */
export function AgencyStatusGuard({ children }: { children: ReactNode }) {
    const { user, signOut } = useAuth();
    const { t } = useTranslation();
    const [status, setStatus] = useState<AgencyStatus | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        if (!user?.id) return;

        const fetchStatus = async () => {
            const { data, error } = await supabase
                .from("travel_agencies")
                .select("status")
                .eq("id", user.id)
                .maybeSingle();
            if (error) throw error;
            return (data?.status ?? null) as AgencyStatus | null;
        };

        (async () => {
            try {
                let result: AgencyStatus | null;
                try {
                    result = await fetchStatus();
                } catch {
                    result = await fetchStatus(); // one retry, then fail open
                }
                if (!cancelled) setStatus(result);
            } catch (err) {
                console.error("Agency status check failed; failing open:", err);
            } finally {
                if (!cancelled) setChecked(true);
            }
        })();

        return () => {
            cancelled = true;
        };
        // Key on the id, not the object (auth events re-create the user object).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    if (!checked) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Fail open: unknown status (fetch failed / no row) renders the portal;
    // RLS still protects every write.
    if (status === null || status === "active") {
        return <>{children}</>;
    }

    const content = {
        pending: {
            icon: Clock,
            iconClass: "text-amber-500 bg-amber-500/10",
            title: t("agencyStatus.pendingTitle", "Your agency is under review"),
            body: t(
                "agencyStatus.pendingBody",
                "Our team is reviewing your registration. You'll get access to the full dashboard once your agency is approved.",
            ),
        },
        suspended: {
            icon: ShieldAlert,
            iconClass: "text-destructive bg-destructive/10",
            title: t("agencyStatus.suspendedTitle", "Your agency account is suspended"),
            body: t(
                "agencyStatus.suspendedBody",
                "Your access has been temporarily suspended by the platform team. Contact support to resolve this.",
            ),
        },
        rejected: {
            icon: XCircle,
            iconClass: "text-destructive bg-destructive/10",
            title: t("agencyStatus.rejectedTitle", "Your agency registration was declined"),
            body: t(
                "agencyStatus.rejectedBody",
                "Your registration didn't meet the platform requirements. Contact support if you believe this is a mistake.",
            ),
        },
    }[status];

    const Icon = content.icon;

    return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
            <div className="max-w-md w-full text-center">
                <div className={`mx-auto mb-5 grid place-items-center h-16 w-16 rounded-full ${content.iconClass}`}>
                    <Icon className="h-8 w-8" aria-hidden="true" />
                </div>
                <h1 className="text-xl font-semibold mb-2">{content.title}</h1>
                <p className="text-sm text-muted-foreground mb-6">{content.body}</p>
                <div className="flex items-center justify-center gap-3">
                    <Button asChild variant="default" className="gap-2">
                        <a href={`mailto:${SUPPORT_EMAIL}`}>
                            <Mail className="h-4 w-4" />
                            {t("agencyStatus.contactSupport", "Contact Support")}
                        </a>
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => void signOut()}>
                        <LogOut className="h-4 w-4 rtl:rotate-180" />
                        {t("common.signOut", "Sign Out")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
