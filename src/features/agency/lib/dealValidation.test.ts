import { describe, expect, it } from 'vitest';
import { validateDealForm, derivedDealStatus } from './dealValidation';

const valid = () => ({
    title: 'Summer Sale',
    discount_percentage: 20,
    start_date: '2026-08-01',
    end_date: '2026-08-31',
    package_id: 'pkg-1',
});

describe('validateDealForm (AGY-24)', () => {
    it('accepts a valid form', () => {
        expect(validateDealForm(valid())).toBeNull();
    });
    it('rejects blank title, missing package, missing dates', () => {
        expect(validateDealForm({ ...valid(), title: '  ' })).toBe('dealTitleRequired');
        expect(validateDealForm({ ...valid(), package_id: '' })).toBe('dealPackageRequired');
        expect(validateDealForm({ ...valid(), start_date: '' })).toBe('dealDatesRequired');
    });
    it('clamps discount to 1-90', () => {
        expect(validateDealForm({ ...valid(), discount_percentage: 0 })).toBe('dealDiscountRange');
        expect(validateDealForm({ ...valid(), discount_percentage: -5 })).toBe('dealDiscountRange');
        expect(validateDealForm({ ...valid(), discount_percentage: 91 })).toBe('dealDiscountRange');
        expect(validateDealForm({ ...valid(), discount_percentage: NaN })).toBe('dealDiscountRange');
    });
    it('rejects inverted date ranges', () => {
        expect(validateDealForm({ ...valid(), end_date: '2026-07-01' })).toBe('dealDateOrder');
    });
});

describe('derivedDealStatus (AGY-23)', () => {
    const deal = { status: 'active', start_date: '2026-08-01', end_date: '2026-08-31' };
    it('derives scheduled/active/expired from dates', () => {
        expect(derivedDealStatus(deal, '2026-07-15')).toBe('scheduled');
        expect(derivedDealStatus(deal, '2026-08-01')).toBe('active');
        expect(derivedDealStatus(deal, '2026-08-31')).toBe('active');
        expect(derivedDealStatus(deal, '2026-09-01')).toBe('expired');
    });
    it('a stale stored status cannot mask reality', () => {
        expect(derivedDealStatus({ ...deal, status: 'scheduled' }, '2026-08-15')).toBe('active');
        expect(derivedDealStatus({ ...deal, status: 'active' }, '2026-10-01')).toBe('expired');
    });
    it('paused always wins', () => {
        expect(derivedDealStatus({ ...deal, status: 'paused' }, '2026-08-15')).toBe('paused');
    });
});
