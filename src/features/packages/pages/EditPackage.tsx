import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Button } from "@/ui/button";
import { Progress } from "@/ui/progress";
import { WizardStepContent } from "@/features/packages/components/wizard/WizardStepContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditPackage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    basicInfo: {
      title: '',
      description: '',
      destination: '',
      category: '',
      difficulty_level: 'moderate',
      duration_days: 1,
      duration_nights: 0,
      max_participants: 20,
      featured: false
    },
    route: {
      destinations: [] as any[],
      travelMode: 'driving' as 'driving' | 'walking' | 'cycling',
      showDistances: true
    },
    itinerary: [] as any[],
    pricing: {
      currency: "USD",
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
      cancellation_policy: '',
      terms_conditions: ''
    },
    media: [] as any[]
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

      // Load package data
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
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
          category: packageData.category || '',
          difficulty_level: packageData.difficulty_level || 'moderate',
          duration_days: packageData.duration_days || 1,
          duration_nights: packageData.duration_nights || 0,
          max_participants: packageData.max_participants || 20,
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
          transportation: item.transportation || ''
        })),
        pricing: {
          currency: "USD",
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
          cancellation_policy: packageData.cancellation_policy || '',
          terms_conditions: packageData.terms_conditions || ''
        },
        media: (mediaData || []).map(item => ({
          id: item.id,
          type: item.media_type || 'image',
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

  const updateFormData = (stepKey: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [stepKey]: data
    }));
  };

  const handleFormDataUpdate = (data: any) => {
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
      // Update package
      const { error: updateError } = await supabase
        .from('packages')
        .update({
          title: formData.basicInfo.title,
          description: formData.basicInfo.description,
          destination: formData.basicInfo.destination,
          category: formData.basicInfo.category,
          difficulty_level: formData.basicInfo.difficulty_level,
          duration_days: formData.basicInfo.duration_days,
          duration_nights: formData.basicInfo.duration_nights,
          max_participants: formData.basicInfo.max_participants,
          featured: formData.basicInfo.featured,
          base_price: parseFloat(formData.pricing.basePrice) || 0,
          inclusions: formData.pricing.additionalInclusions,
          exclusions: formData.pricing.exclusions,
          cancellation_policy: formData.pricing.cancellation_policy,
          terms_conditions: formData.pricing.terms_conditions
        })
        .eq('id', id)
        .eq('agency_id', user.id);

      if (updateError) throw updateError;

      // Delete old routes and insert new
      await supabase
        .from('package_routes')
        .delete()
        .eq('package_id', id);

      if (formData.route?.destinations && formData.route.destinations.length > 0) {
        const routeInserts = formData.route.destinations.map((dest: any, index: number) => ({
          package_id: id,
          destination_order: index,
          name: dest.name,
          name_ar: dest.nameAr || null,
          latitude: dest.latitude,
          longitude: dest.longitude,
          place_id: dest.placeId || null,
          destination_type: dest.type,
          days_spent: dest.daysSpent || 1
        }));

        await supabase
          .from('package_routes')
          .insert(routeInserts);
      }

      // Delete old itinerary and insert new
      await supabase
        .from('itineraries')
        .delete()
        .eq('package_id', id);

      if (formData.itinerary.length > 0) {
        const itineraryInserts = formData.itinerary.map((item: any, index: number) => ({
          package_id: id,
          day_number: item.day || index + 1,
          title: item.title || `Day ${index + 1}`,
          description: item.description || '',
          activities: item.activities || [],
          meals_included: item.meals || [],
          accommodation: item.accommodation || '',
          transportation: item.transportation || ''
        }));

        await supabase
          .from('itineraries')
          .insert(itineraryInserts);
      }

      // Delete old media and insert new
      await supabase
        .from('package_media')
        .delete()
        .eq('package_id', id);

      if (formData.media.length > 0) {
        const mediaInserts = formData.media.map((item: any, index: number) => ({
          package_id: id,
          file_name: item.file_name || item.caption || 'Image',
          file_path: item.url || item.file_path,
          media_type: item.type || 'image',
          caption: item.caption || '',
          is_primary: item.isPrimary || false,
          display_order: index
        }));

        await supabase
          .from('package_media')
          .insert(mediaInserts);
      }

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
          <h1 className="text-2xl font-bold text-gray-900">
            {t('packageWizard.editPackage', 'Edit Package')} - {getStepTitle(currentStep)}
          </h1>
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{t('packageWizard.stepOf', { current: currentStep, total: totalSteps })}</span>
              <span>{Math.round(progress)}% {t('packageWizard.complete')}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
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
