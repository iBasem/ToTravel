
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { DollarSign } from "lucide-react";
import { getPlatformCurrency } from "@/lib/formatters";

interface BasePricingProps {
  data: {
    basePrice: string;
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="basePrice" className="text-start block">
              {t('packageWizard.basePrice')} ({getPlatformCurrency()})
            </Label>
            <Input
              id="basePrice"
              type="number"
              value={data.basePrice}
              onChange={(e) => onUpdate("basePrice", e.target.value)}
              placeholder="899"
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
