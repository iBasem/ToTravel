import React, { useState } from 'react';

interface CheckboxFilterItem {
    label: string;
    value: string;
    count?: number;
}

interface CheckboxFilterProps {
    items: CheckboxFilterItem[];
    selected: string[];
    onChange: (selected: string[]) => void;
    maxVisible?: number;
}

export function CheckboxFilter({
    items,
    selected,
    onChange,
    maxVisible = 8,
}: CheckboxFilterProps) {
    const [showAll, setShowAll] = useState(false);
    const visibleItems = showAll ? items : items.slice(0, maxVisible);
    const hasMore = items.length > maxVisible;

    const handleToggle = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter((v) => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    return (
        <div>
            <div className="pkg-checkbox-list">
                {visibleItems.map((item) => (
                    <label key={item.value} className="pkg-checkbox-item">
                        <input
                            type="checkbox"
                            checked={selected.includes(item.value)}
                            onChange={() => handleToggle(item.value)}
                        />
                        <span>{item.label}</span>
                        {item.count !== undefined && (
                            <span className="pkg-checkbox-count">{item.count}</span>
                        )}
                    </label>
                ))}
            </div>
            {hasMore && (
                <button
                    className="pkg-show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                    type="button"
                >
                    {showAll ? 'Show less' : 'Show more'}
                </button>
            )}
        </div>
    );
}
