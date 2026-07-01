import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Badge } from "@/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import {
    Bed,
    Utensils,
    Car,
    User,
    Wifi,
    Plane,
    Ship,
    Mountain,
    Compass,
    CheckCircle,
    XCircle,
    ChevronDown,
    PlusCircle,
    Smartphone,
    Leaf,
    Salad
} from "lucide-react";
import type { WhatsIncludedProps } from "@/features/packages/types";

// Icon mapping for common inclusion keywords
const getInclusionIcon = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('hotel') || lowerText.includes('accommodation') || lowerText.includes('stay') || lowerText.includes('room')) {
        return Bed;
    }
    if (lowerText.includes('meal') || lowerText.includes('breakfast') || lowerText.includes('lunch') || lowerText.includes('dinner') || lowerText.includes('food')) {
        return Utensils;
    }
    if (lowerText.includes('transport') || lowerText.includes('transfer') || lowerText.includes('car') || lowerText.includes('vehicle')) {
        return Car;
    }
    if (lowerText.includes('guide') || lowerText.includes('tour leader') || lowerText.includes('escort')) {
        return User;
    }
    if (lowerText.includes('wifi') || lowerText.includes('internet')) {
        return Wifi;
    }
    if (lowerText.includes('flight') || lowerText.includes('air')) {
        return Plane;
    }
    if (lowerText.includes('cruise') || lowerText.includes('boat') || lowerText.includes('ferry')) {
        return Ship;
    }
    if (lowerText.includes('trek') || lowerText.includes('hike') || lowerText.includes('outdoor')) {
        return Mountain;
    }
    if (lowerText.includes('sightseeing') || lowerText.includes('tour') || lowerText.includes('visit')) {
        return Compass;
    }
    if (lowerText.includes('esim') || lowerText.includes('sim') || lowerText.includes('phone')) {
        return Smartphone;
    }
    if (lowerText.includes('service') || lowerText.includes('additional')) {
        return PlusCircle;
    }
    return CheckCircle;
};

// Check if item might have dietary options
const hasDietaryOptions = (text: string) => {
    const lowerText = text.toLowerCase();
    return lowerText.includes('meal') || lowerText.includes('food') || lowerText.includes('breakfast') || lowerText.includes('lunch') || lowerText.includes('dinner');
};

interface InclusionItemProps {
    item: string;
    isExclusion?: boolean;
    isOpen: boolean;
    onToggle: () => void;
}

function InclusionItem({ item, isExclusion = false, isOpen, onToggle }: InclusionItemProps) {
    const IconComponent = isExclusion ? XCircle : getInclusionIcon(item);
    const iconColor = isExclusion ? 'text-red-500' : 'text-teal-600';
    const showDietary = !isExclusion && hasDietaryOptions(item);

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    className="w-full flex items-center justify-between py-4 px-1 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <IconComponent className={`w-5 h-5 ${iconColor} flex-shrink-0`} />
                        <span className="font-medium text-gray-900">{item}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dietary badges for meals */}
                        {showDietary && (
                            <>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Leaf className="w-4 h-4" />
                                    <span>Veg</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Salad className="w-4 h-4" />
                                    <span>Vegan</span>
                                </div>
                            </>
                        )}
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="py-3 px-8 bg-gray-50 text-sm text-gray-600 text-start">
                    {isExclusion
                        ? `${item} is not included in this package. You may need to arrange this separately.`
                        : `${item} is included in your package. Details will be provided upon booking confirmation.`
                    }
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export function WhatsIncluded({ inclusions, exclusions }: WhatsIncludedProps) {
    const { t } = useTranslation();

    const [openItems, setOpenItems] = useState<Set<string>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    if ((!inclusions || inclusions.length === 0) && (!exclusions || exclusions.length === 0)) {
        return null;
    }

    const allItems = [...(inclusions || []), ...(exclusions || []).map(e => `excl_${e}`)];

    const toggleItem = (item: string) => {
        const newSet = new Set(openItems);
        if (newSet.has(item)) {
            newSet.delete(item);
        } else {
            newSet.add(item);
        }
        setOpenItems(newSet);
    };

    const toggleAll = () => {
        if (allExpanded) {
            setOpenItems(new Set());
        } else {
            setOpenItems(new Set(allItems));
        }
        setAllExpanded(!allExpanded);
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        {t('packageDetails.whatsIncluded', "What's Included")}
                    </CardTitle>
                    <button
                        onClick={toggleAll}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                        {allExpanded
                            ? t('packageDetails.collapseAll', 'Collapse All')
                            : t('packageDetails.expandAll', 'Expand All')
                        }
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {/* Inclusions List */}
                {inclusions && inclusions.length > 0 && (
                    <div className="mb-6">
                        {inclusions.map((item, index) => (
                            <InclusionItem
                                key={`incl-${index}`}
                                item={item}
                                isOpen={openItems.has(item)}
                                onToggle={() => toggleItem(item)}
                            />
                        ))}
                    </div>
                )}

                {/* Exclusions Section */}
                {exclusions && exclusions.length > 0 && (
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2 mt-6 text-start">
                            {t('packageDetails.whatsNotIncluded', "What's Not Included")}
                        </h4>
                        {exclusions.map((item, index) => (
                            <InclusionItem
                                key={`excl-${index}`}
                                item={item}
                                isExclusion
                                isOpen={openItems.has(`excl_${item}`)}
                                onToggle={() => toggleItem(`excl_${item}`)}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
