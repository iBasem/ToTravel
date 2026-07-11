import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { WizardStepContent } from "@/features/packages/components/wizard/WizardStepContent";
import type { ItineraryDay, PackageFormData } from "@/features/packages/types/wizard";
import { buildSavePackagePayload } from "@/features/packages/lib/savePackagePayload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Edit-mode form state: the shared wizard shape, plus the legacy per-day
// `transportation` field this page loads from itineraries (not in ItineraryDay).
type EditPackageFormData = Omit<PackageFormData, "itinerary"> & {
  itinerary: (ItineraryDay & { transportation?: string })[];
};

export default function EditPackage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EditPackageFormData>({
    basicInfo: {
      title: '',
      description: '',
      destination: '',
      title_ar: '',
      description_ar: '',
      destination_ar: '',
      destinations: [] as string[],
      category: '',
      difficulty_level: 'moderate',
      duration_days: 1,
      duration_nights: 0,
      max_participants: 20,
      featured: false
    },
    route: {
      destinations: [],
      travelMode: 'driving' as 'driving' | 'walking' | 'cycling',
      showDistances: true
    },
    itinerary: [],
    pricing: {
      basePrice: "",
      base_price: 0,
      inclusions: {
        accommodation: { included: false, details: [] as string[] },
        meals: { included: false, details: [] as string[] },
        transportation: { included: false, details: [] as string[] },
        activities: { included: false, details: [] as string[] },
        guides: { included: false, details: [] as string[] },
        insurance: { included: false, details: [] as string[] },
        other: { included: false, details: [] as string[] }
      },
      additionalInclusions: [] as string[],
      exclusions: [] as string[],
      inclusions_ar: [] as string[],
      exclusions_ar: [] as string[],
      cancellation_policy: '',
      terms_conditions: ''
    },
    media: []
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (id) {
      loadPackage();
    }
  }, [id]);

  const loadPackage = async () => {
    try {
      setLoading(true);

      // Load package data (agency filter is defense-in-depth on top of RLS)
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .eq('agency_id', user?.id ?? '')
        .single();

      if (packageError) throw packageError;

      // Load route destinations
      const { data: routeData } = await supabase
        .from('package_routes')
        .select('*')
        .eq('package_id', id)
        .order('destination_order');

      // Load itinerary
      const { data: itineraryData } = await supabase
        .from('itineraries')
        .select('*')
        .eq('package_id', id)
        .order('day_number');

      // Load media
      const { data: mediaData } = await supabase
        .from('package_media')
        .select('*')
        .eq('package_id', id)
        .order('display_order');

      // Map data to form structure
      setFormData({
        basicInfo: {
          title: packageData.title || '',
          description: packageData.description || '',
          destination: packageData.destination || '',
          title_ar: packageData.title_ar || '',
          description_ar: packageData.description_ar || '',
          destination_ar: packageData.destination_ar || '',
          // The destinations array is a create-time UI construct (only the scalar
          // `destination` column is persisted); reconstruct it so step-1 validation
          // and the array-based UI work in edit mode.
          destinations: packageData.destination ? [packageData.destination] : [],
          category: packageData.category || '',
          difficulty_level: packageData.difficulty_level || 'moderate',
          duration_days: packageData.duration_days || 1,
          duration_nights: packageData.duration_nights || 0,
          max_participants: packageData.max_participants || 20,
          highlights: packageData.highlights || [],
          featured: packageData.featured || false
        },
        route: {
          destinations: (routeData || []).map(item => ({
            id: item.id,
            name: item.name,
            nameAr: item.name_ar,
            latitude: item.latitude,
            longitude: item.longitude,
            order: item.destination_order,
            type: item.destination_type as 'origin' | 'stop' | 'destination',
            daysSpent: item.days_spent || 1,
            placeId: item.place_id
          })),
          travelMode: 'driving' as 'driving' | 'walking' | 'cycling',
          showDistances: true
        },
        itinerary: (itineraryData || []).map(item => ({
          day: item.day_number,
          title: item.title,
          description: item.description,
          activities: item.activities || [],
          meals: item.meals_included || [],
          accommodation: item.accommodation || '',
          transportation: item.transportation || '',
          title_ar: item.title_ar || '',
          description_ar: item.description_ar || '',
          activities_ar: item.activities_ar || []
        })),
        pricing: {
          basePrice: packageData.base_price?.toString() || '',
          base_price: packageData.base_price || 0,
          inclusions: {
            accommodation: { included: false, details: [] },
            meals: { included: false, details: [] },
            transportation: { included: false, details: [] },
            activities: { included: false, details: [] },
            guides: { included: false, details: [] },
            insurance: { included: false, details: [] },
            other: { included: false, details: [] }
          },
          additionalInclusions: packageData.inclusions || [],
          exclusions: packageData.exclusions || [],
          inclusions_ar: packageData.inclusions_ar || [],
          exclusions_ar: packageData.exclusions_ar || [],
          cancellation_policy: packageData.cancellation_policy || '',
          terms_conditions: packageData.terms_conditions || ''
        },
        media: (mediaData || []).map(item => ({
          id: item.id,
          type: (item.media_type || 'image') as 'image' | 'video',
          url: item.file_path,
          caption: item.caption || item.file_name,
          isPrimary: item.is_primary || false,
          file_name: item.file_name,
          file_path: item.file_path
        }))
      });
    } catch (error) {
      console.error('Error loading package:', error);
      toast.error(t('agencyDashboard.errorLoadingPackages', 'Failed to load package'));
      navigate('/travel_agency/packages');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (stepKey: string, data: unknown) => {
    setFormData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  const handleFormDataUpdate = (data: PackageFormData) => {
    setFormData(data);
  };

  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !id) return;

    setSaving(true);
    try {
      // One atomic multi-table upsert via the save_package RPC (replaces the
      // former non-atomic delete-then-insert with unchecked errors).
      const { error } = await supabase.rpc('save_package', {
        p_package_id: id,
        p_data: buildSavePackagePayload(formData as PackageFormData),
        p_submit_for_review: !!(formData as PackageFormData).isPublished,
      });

      if (error) throw error;

      toast.success(t('packageWizard.packageUpdated', 'Package updated successfully!'));
      navigate('/travel_agency/packages');
    } catch (error) {
      console.error('Error updating package:', error);
      toast.error(t('errors.somethingWentWrong', 'Failed to update package'));
    } finally {
      setSaving(false);
    }
  };

  const getStepTitle = (step: number) => {
    switch (step) {
      case 1: return t('packageWizard.basicInformation');
      case 2: return t('packageWizard.tourRoute');
      case 3: return t('packageWizard.itinerary');
      case 4: return t('packageWizard.pricingAndPolicies');
      case 5: return t('packageWizard.mediaAndPhotos');
      case 6: return t('packageWizard.reviewAndPublish');
      default: return "";
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !!(formData.basicInfo.title &&
          formData.basicInfo.destination &&
          formData.basicInfo.category &&
          formData.basicInfo.duration_days > 0);
      case 2:
        return true; // Route step is optional
      case 3:
        return true; // Itinerary is optional
      case 4:
        return !!(formData.pricing.basePrice && parseFloat(formData.pricing.basePrice) > 0);
      case 5:
        return true; // Media is optional
      case 6:
        return true;
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('packageWizard.editPackage', 'Edit Package')} - {getStepTitle(currentStep)}
          </h1>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t('packageWizard.stepOf', { current: currentStep, total: totalSteps })}</span>
              <span>{Math.round(progress)}% {t('packageWizard.complete')}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <WizardStepContent
          currentStep={currentStep}
          formData={formData}
          onUpdate={updateFormData}
          onFormDataUpdate={handleFormDataUpdate}
        />
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          {t('common.previous')}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/travel_agency/packages')}>
            {t('common.cancel')}
          </Button>

          {currentStep === totalSteps ? (
            <Button
              onClick={handleSubmit}
              disabled={saving || !isStepValid(currentStep)}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                  {t('common.saving', 'Saving...')}
                </>
              ) : (
                t('packageWizard.saveChanges', 'Save Changes')
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
            >
              {t('common.next')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
