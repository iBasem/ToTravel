import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/ui/button";
import { DeparturesEditor } from "@/features/packages/components/editor/DeparturesEditor";
import { ArrowLeft, CalendarDays } from "lucide-react";

// Standalone deep-link for managing a package's departure (tour start) dates.
// The same editor is embedded as the Departures section of the package editor.
export default function ManageDepartures() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('packages')
      .select('title')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setTitle(data.title);
      });
  }, [id]);

  if (!id) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/travel_agency/packages')}>
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
        <div className="text-start">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            {t('departures.title', 'Manage departures')}
          </h1>
          {title && <p className="text-sm text-muted-foreground">{title}</p>}
        </div>
      </div>

      <DeparturesEditor packageId={id} />
    </div>
  );
}
