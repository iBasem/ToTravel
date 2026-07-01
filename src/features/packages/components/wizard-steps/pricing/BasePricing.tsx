
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
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
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-start">
          <DollarSign className="w-5 h-5" />
          {t('packageWizard.basePricing')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.currency')}</Label>
            <Select value={data.currency} onValueChange={(value) => onUpdate("currency", value)}>
              <SelectTrigger>
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
            <Label className="text-start block">{t('packageWizard.basePrice')}</Label>
            <Input
              type="number"
              value={data.basePrice}
              onChange={(e) => onUpdate("basePrice", e.target.value)}
              placeholder="899"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.originalPrice')}</Label>
            <Input
              type="number"
              value={data.originalPrice || ""}
              onChange={(e) => onUpdate("originalPrice", e.target.value)}
              placeholder="1299"
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-start block">{t('packageWizard.discountPercent')}</Label>
            <Input
              type="number"
              value={data.discount || ""}
              onChange={(e) => onUpdate("discount", e.target.value)}
              placeholder="30"
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
