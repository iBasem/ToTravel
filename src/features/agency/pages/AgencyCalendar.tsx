
import { CalendarView } from "../components/CalendarView";
import { SidebarProvider, SidebarTrigger } from "@/ui/sidebar";
import { AppSidebar } from "@/layouts/AppSidebar";
import { useTranslation } from "react-i18next";

export default function AgencyCalendar() {
    const { t } = useTranslation();
    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-muted/30">
                <AppSidebar />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <SidebarTrigger />
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">{t("calendar.title")}</h1>
                                    <p className="text-muted-foreground">{t("calendar.subtitle")}</p>
                                </div>
                            </div>
                        </div>

                        <CalendarView />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
