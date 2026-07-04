import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface RangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    step?: number;
    minLabel?: string;
    maxLabel?: string;
    formatLabel?: (value: number) => string;
}

export function RangeSlider({
    min,
    max,
    value,
    onChange,
    step = 1,
    minLabel,
    maxLabel,
    formatLabel = (v) => String(v),
}: RangeSliderProps) {
    const { t } = useTranslation();
    // Local state for smooth dragging — only commits to parent on release
    const [localValue, setLocalValue] = useState<[number, number]>(value);
    const isDragging = useRef(false);

    // Sync from parent when not dragging
    useEffect(() => {
        if (!isDragging.current) {
            setLocalValue(value);
        }
    }, [value]);

    const handleMinChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newMin = Number(e.target.value);
            const clamped = Math.min(newMin, localValue[1] - step);
            setLocalValue([clamped, localValue[1]]);
        },
        [localValue, step]
    );

    const handleMaxChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newMax = Number(e.target.value);
            const clamped = Math.max(newMax, localValue[0] + step);
            setLocalValue([localValue[0], clamped]);
        },
        [localValue, step]
    );

    const handlePointerDown = useCallback(() => {
        isDragging.current = true;
    }, []);

    const handlePointerUp = useCallback(() => {
        isDragging.current = false;
        onChange(localValue);
    }, [localValue, onChange]);

    // Calculate fill position
    const minPercent = ((localValue[0] - min) / (max - min)) * 100;
    const maxPercent = ((localValue[1] - min) / (max - min)) * 100;

    return (
        <div className="pkg-range-slider">
            <div className="pkg-range-slider-labels">
                <span>{minLabel ?? formatLabel(localValue[0])}</span>
                <span>{maxLabel ?? formatLabel(localValue[1])}</span>
            </div>
            <div className="pkg-range-slider-track">
                <div
                    className="pkg-range-slider-fill"
                    style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[0]}
                    onChange={handleMinChange}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onTouchEnd={handlePointerUp}
                    aria-label={t('ui.minValue', 'Minimum value')}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={localValue[1]}
                    onChange={handleMaxChange}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onTouchEnd={handlePointerUp}
                    aria-label={t('ui.maxValue', 'Maximum value')}
                />
            </div>
        </div>
    );
}
