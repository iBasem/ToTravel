
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface WizardHeaderProps {
  onCancel: () => void;
  saving: boolean;
}

export function WizardHeader({ onCancel, saving }: WizardHeaderProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={isRTL ? 'text-right' : 'text-left'}>
        <h1 className="text-2xl font-bold text-gray-900">{t('packageWizard.createNewPackage')}</h1>
        <p className="text-gray-600">{t('packageWizard.followSteps', 'Follow the steps below to create your travel package')}</p>
      </div>
      <Button variant="outline" onClick={onCancel} disabled={saving}>
        {t('common.cancel')}
      </Button>
    </div>
  );
}
