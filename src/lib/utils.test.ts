import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('merges class names correctly', () => {
        expect(cn('w-full', 'p-4')).toBe('w-full p-4');
    });

    it('handles conditional classes', () => {
        expect(cn('w-full', true && 'p-4', false && 'm-4')).toBe('w-full p-4');
    });

    it('resolves tailwind conflicts', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('handles arrays and objects', () => {
        expect(cn(['w-full', 'p-4'], { 'text-center': true, 'hidden': false })).toBe('w-full p-4 text-center');
    });
});
