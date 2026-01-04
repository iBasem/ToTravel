
import { toast } from "sonner";

interface FormData {
  basicInfo: {
    title?: string;
    destination?: string;
    destinations?: string[];
    category?: string;
    duration_days?: number;
  };
  pricing: { 
    basePrice: string;
  };
}

export function validateFormData(formData: FormData, setCurrentStep: (step: number) => void) {
  if (!formData.basicInfo?.title) {
    toast.error("Please provide a package title");
    setCurrentStep(1);
    return false;
  }
  
  if (!formData.pricing?.basePrice) {
    toast.error("Please set a base price for the package");
    setCurrentStep(3);
    return false;
  }
  
  return true;
}
