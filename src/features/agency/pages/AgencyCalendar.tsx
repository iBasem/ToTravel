
import { CalendarView } from "../components/CalendarView";
import { useTranslation } from "react-i18next";

export default function AgencyCalendar() {
    const { t } = useTranslation();
    return (
        <div className="space-y-6">
            <div className="text-start">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("calendar.title")}</h1>
                <p className="text-muted-foreground">{t("calendar.subtitle")}</p>
            </div>

            <CalendarView />
        </div>
    );
}
