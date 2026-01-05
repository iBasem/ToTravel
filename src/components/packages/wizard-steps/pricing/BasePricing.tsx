
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

interface BasePricingProps {
  data: {
    currency: string;
    basePrice: string;
    originalPrice?: string;
    discount?: string;
  };
  onUpdate: (field: string, value: string) => void;
}

export function BasePricing({ data, onUpdate }: BasePricingProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
          <DollarSign className="w-5 h-5" />
          {t('packageWizard.basePricing')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.currency')}</Label>
            <Select value={data.currency} onValueChange={(value) => onUpdate("currency", value)}>
              <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="SAR">SAR (ر.س)</SelectItem>
                <SelectItem value="AED">AED (د.إ)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.basePrice')}</Label>
            <Input
              type="number"
              value={data.basePrice}
              onChange={(e) => onUpdate("basePrice", e.target.value)}
              placeholder="899"
              className={isRTL ? 'text-right' : 'text-left'}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.originalPrice')}</Label>
            <Input
              type="number"
              value={data.originalPrice || ""}
              onChange={(e) => onUpdate("originalPrice", e.target.value)}
              placeholder="1299"
              className={isRTL ? 'text-right' : 'text-left'}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className={isRTL ? 'text-right block' : 'text-left block'}>{t('packageWizard.discountPercent')}</Label>
            <Input
              type="number"
              value={data.discount || ""}
              onChange={(e) => onUpdate("discount", e.target.value)}
              placeholder="30"
              className={isRTL ? 'text-right' : 'text-left'}
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
