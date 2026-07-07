
import { useState } from "react";
import { PackageWizard } from "@/features/packages/components/PackageWizard";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Plus, Package, MapPin, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CreatePackage() {
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();


  const features = [
    {
      icon: Package,
      title: t('agencyDashboard.completePackageBuilder'),
      description: t('agencyDashboard.completePackageBuilderDesc')
    },
    {
      icon: MapPin,
      title: t('agencyDashboard.destinationManagement'),
      description: t('agencyDashboard.destinationManagementDesc')
    },
    {
      icon: Users,
      title: t('agencyDashboard.groupSizeControl'),
      description: t('agencyDashboard.groupSizeControlDesc')
    },
    {
      icon: DollarSign,
      title: t('agencyDashboard.flexiblePricing'),
      description: t('agencyDashboard.flexiblePricingDesc')
    }
  ];

  const handleWizardClose = () => {
    setShowWizard(false);
    navigate('/travel_agency/packages');
  };

  const handleStartWizard = () => {
    setShowWizard(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('agencyDashboard.createNewPackage')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('agencyDashboard.packageBuilderDesc')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <feature.icon className="w-6 h-6 text-primary" />
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('agencyDashboard.readyToCreate')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t('agencyDashboard.wizardGuideDesc')}
          </p>
          <Button
            onClick={handleStartWizard}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Plus className="w-5 h-5" />
            {t('agencyDashboard.startPackageCreation')}
          </Button>
        </div>
      </div>

      <PackageWizard
        isOpen={showWizard}
        onClose={handleWizardClose}
      />
    </div>
  );
}
