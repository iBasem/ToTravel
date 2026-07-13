import { describe, it, expect } from 'vitest';
import { missingRequiredFields } from './wizardValidation';
import { createInitialPackageFormData } from './packageFormDefaults';

const valid = () => {
  const form = createInitialPackageFormData();
  form.basicInfo.title = 'Desert Trip';
  form.basicInfo.destinations = ['Saudi Arabia'];
  form.basicInfo.destination = 'Saudi Arabia';
  form.basicInfo.category = 'adventure';
  form.basicInfo.description = 'A trip.';
  form.pricing.basePrice = '899';
  return form;
};

describe('missingRequiredFields', () => {
  it('lists every missing basics field on a pristine form', () => {
    const missing = missingRequiredFields(1, createInitialPackageFormData());
    expect(missing).toEqual([
      'packageWizard.packageTitle',
      'packageWizard.destination',
      'packageWizard.category',
      'packageWizard.description',
    ]);
  });

  it('accepts either the destinations array or the legacy scalar', () => {
    const viaArray = valid();
    viaArray.basicInfo.destination = '';
    expect(missingRequiredFields(1, viaArray)).toEqual([]);

    const viaScalar = valid();
    viaScalar.basicInfo.destinations = [];
    expect(missingRequiredFields(1, viaScalar)).toEqual([]);
  });

  it('requires a positive base price on the pricing step', () => {
    const form = valid();
    form.pricing.basePrice = '0';
    expect(missingRequiredFields(4, form)).toEqual(['packageWizard.basePrice']);
    form.pricing.basePrice = '899';
    expect(missingRequiredFields(4, form)).toEqual([]);
  });

  it('treats whitespace-only title and description as missing', () => {
    const form = valid();
    form.basicInfo.title = '   ';
    form.basicInfo.description = '\n';
    expect(missingRequiredFields(1, form)).toEqual([
      'packageWizard.packageTitle',
      'packageWizard.description',
    ]);
  });

  it('leaves the optional sections ungated', () => {
    const pristine = createInitialPackageFormData();
    for (const step of [2, 3, 5, 6]) {
      expect(missingRequiredFields(step, pristine)).toEqual([]);
    }
  });
});
