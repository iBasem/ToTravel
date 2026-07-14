import { describe, it, expect } from 'vitest';
import { buildSavePackagePayload } from './savePackagePayload';
import { createInitialPackageFormData } from './packageFormDefaults';
import type { PackageFormData } from '@/features/packages/types/wizard';

const base = (): PackageFormData => createInitialPackageFormData();

describe('buildSavePackagePayload', () => {
  it('flattens included category details plus additional inclusions', () => {
    const form = base();
    form.pricing.inclusions.meals = { included: true, details: ['Breakfast', 'Dinner'] };
    form.pricing.inclusions.guides = { included: false, details: ['Ignored — not included'] };
    form.pricing.additionalInclusions = ['Airport pickup'];

    const payload = buildSavePackagePayload(form);
    expect(payload.pricing.inclusions).toEqual(['Breakfast', 'Dinner', 'Airport pickup']);
  });

  it('maps itinerary day/meals to day_number/meals_included and keeps transportation', () => {
    const form = base();
    form.itinerary = [{
      day: 1,
      title: 'Arrival',
      description: 'Land and transfer',
      activities: ['City walk', ' '],
      meals: ['Dinner'],
      accommodation: 'Old town hotel',
      transportation: 'Private van',
      title_ar: '',
      description_ar: '',
      activities_ar: []
    }];

    const [day] = buildSavePackagePayload(form).itinerary;
    expect(day.day_number).toBe(1);
    expect(day.meals_included).toEqual(['Dinner']);
    expect(day.activities).toEqual(['City walk']);
    expect(day.transportation).toBe('Private van');
  });

  it('nulls out empty transportation instead of erasing it with undefined', () => {
    const form = base();
    form.itinerary = [{
      day: 1, title: '', description: '', activities: [], meals: [],
      accommodation: '', title_ar: '', description_ar: '', activities_ar: []
    }];
    expect(buildSavePackagePayload(form).itinerary[0].transportation).toBeNull();
  });

  it('maps media type/isPrimary to media_type/is_primary with display order', () => {
    const form = base();
    form.media = [
      { id: 'a', type: 'image', url: 'u1', caption: 'c1', isPrimary: false },
      { id: 'b', type: 'video', url: 'u2', caption: 'c2', isPrimary: true },
    ];

    const media = buildSavePackagePayload(form).media;
    expect(media[0]).toMatchObject({ media_type: 'image', is_primary: false, display_order: 0 });
    expect(media[1]).toMatchObject({ media_type: 'video', is_primary: true, display_order: 1 });
  });

  it('maps add-ons with numeric prices and drops nameless rows', () => {
    const form = base();
    form.pricing.addons = [
      { name: 'International flight from Riyadh', name_ar: 'رحلة جوية', price: '1200', per_person: true },
      { name: '   ', name_ar: '', price: '50', per_person: false }, // blank name -> dropped
      { name: 'Travel insurance', name_ar: '', price: '', per_person: false },
    ];
    const addons = buildSavePackagePayload(form).addons;
    expect(addons).toEqual([
      { name: 'International flight from Riyadh', name_ar: 'رحلة جوية', price: 1200, per_person: true, display_order: 0 },
      { name: 'Travel insurance', name_ar: null, price: 0, per_person: false, display_order: 1 },
    ]);
  });

  it('carries the package type and flight option', () => {
    const form = base();
    form.basicInfo.package_type = 'honeymoon';
    form.pricing.flight_option = 'included';
    const payload = buildSavePackagePayload(form);
    expect(payload.basicInfo.package_type).toBe('honeymoon');
    expect(payload.pricing.flight_option).toBe('included');
  });

  it('ignores transient step-only fields so payloads compare stable for dirty checks', () => {
    const before = JSON.stringify(buildSavePackagePayload(base()));
    const form = base();
    form.basicInfo.newHighlight = 'typed but not added';
    form.pricing.newInclusion = 'pending';
    const after = JSON.stringify(buildSavePackagePayload(form));
    expect(after).toBe(before);
  });
});
