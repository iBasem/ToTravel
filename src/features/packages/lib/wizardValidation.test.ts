import { describe, it, expect } from 'vitest';
import { missingRequiredFields, missingForSubmit } from './wizardValidation';
import { createInitialPackageFormData } from './packageFormDefaults';

const valid = () => {
  const form = createInitialPackageFormData();
  form.basicInfo.title = 'Desert Trip';
  form.basicInfo.category = 'adventure';
  form.basicInfo.description = 'A trip.';
  form.route.destinations = [{
    id: 'stop-1', name: 'Petra', latitude: 30.3, longitude: 35.4,
    order: 0, type: 'origin', daysSpent: 2,
  }];
  form.pricing.basePrice = '899';
  return form;
};

describe('missingRequiredFields', () => {
  it('lists every missing basics field on a pristine form', () => {
    const missing = missingRequiredFields(1, createInitialPackageFormData());
    expect(missing).toEqual([
      'packageWizard.packageTitle',
      'packageWizard.category',
      'packageWizard.description',
    ]);
  });

  it('requires the plan section to have a destination (stops or legacy scalar)', () => {
    const pristine = createInitialPackageFormData();
    expect(missingRequiredFields(2, pristine)).toEqual(['packageWizard.destination']);

    const viaStops = valid();
    viaStops.basicInfo.destination = '';
    expect(missingRequiredFields(2, viaStops)).toEqual([]);

    const viaLegacyScalar = valid();
    viaLegacyScalar.route.destinations = [];
    viaLegacyScalar.basicInfo.destination = 'Jordan';
    expect(missingRequiredFields(2, viaLegacyScalar)).toEqual([]);
  });

  it('requires a positive base price on the pricing section', () => {
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

  it('leaves stays, departures, and media sections ungated at the form level', () => {
    const pristine = createInitialPackageFormData();
    for (const step of [3, 5, 6]) {
      expect(missingRequiredFields(step, pristine)).toEqual([]);
    }
  });
});

describe('missingForSubmit', () => {
  it('aggregates the required fields across sections 1, 2 and 4', () => {
    expect(missingForSubmit(createInitialPackageFormData())).toEqual([
      'packageWizard.packageTitle',
      'packageWizard.category',
      'packageWizard.description',
      'packageWizard.destination',
      'packageWizard.basePrice',
    ]);
    expect(missingForSubmit(valid())).toEqual([]);
  });
});
