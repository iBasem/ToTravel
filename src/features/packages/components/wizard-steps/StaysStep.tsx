import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, BedDouble, Loader2, ImagePlus, X, Languages, ChevronDown } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Card, CardContent } from "@/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PackageHotel, HotelKind, ItineraryDay } from "@/features/packages/types/wizard";

const HOTEL_KINDS: HotelKind[] = ['hotel', 'resort', 'lodge', 'guesthouse', 'camp', 'cruise', 'apartment'];

interface StaysStepProps {
    data: PackageHotel[];
    itinerary: ItineraryDay[];
    onUpdate: (hotels: PackageHotel[]) => void;
}

export function StaysStep({ data, itinerary, onUpdate }: StaysStepProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const hotels = data ?? [];
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

    // Stays attach to the days the agency actually planned.
    const dayNumbers = (itinerary ?? []).map((d, i) => d.day ?? i + 1);

    const patch = (id: string, changes: Partial<PackageHotel>) =>
        onUpdate(hotels.map((h) => (h.id === id ? { ...h, ...changes } : h)));

    const addHotel = () =>
        onUpdate([
            ...hotels,
            {
                id: Math.random().toString(36).slice(2, 10),
                name: "",
                name_ar: "",
                kind: "hotel",
                star_rating: null,
                day_numbers: [],
                upgrade_available: false,
                image_path: null,
            },
        ]);

    const removeHotel = (id: string) => onUpdate(hotels.filter((h) => h.id !== id));

    const toggleDay = (hotel: PackageHotel, day: number) => {
        const next = hotel.day_numbers.includes(day)
            ? hotel.day_numbers.filter((d) => d !== day)
            : [...hotel.day_numbers, day].sort((a, b) => a - b);
        patch(hotel.id, { day_numbers: next });
    };

    // Best-effort storage cleanup on remove/replace (AGY-42): image_path
    // stores the public URL, so recover the object path from it.
    const removeStorageImage = (url: string | null) => {
        if (!url) return;
        const marker = "/package-media/";
        const i = url.indexOf(marker);
        if (i === -1) return;
        const path = decodeURIComponent(url.slice(i + marker.length));
        void supabase.storage.from("package-media").remove([path]).then(({ error }) => {
            if (error) console.error("Failed to delete stay image:", error);
        });
    };

    // Same upload path as MediaStep: public package-media bucket, own folder.
    const handleUpload = async (hotel: PackageHotel, file: File) => {
        if (!user) return;
        setUploadingId(hotel.id);
        try {
            const ext = file.name.split(".").pop();
            const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
            const { error } = await supabase.storage.from("package-media").upload(path, file);
            if (error) throw error;
            const { data: pub } = supabase.storage.from("package-media").getPublicUrl(path);
            removeStorageImage(hotel.image_path); // replaced image is unreachable
            patch(hotel.id, { image_path: pub.publicUrl });
        } catch (err) {
            console.error("Hotel image upload failed:", err);
            toast.error(t("packageWizard.failedToUpload"));
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-start">
                <h3 className="text-lg font-semibold">{t("packageWizard.stays", "Stays")}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    {t("packageWizard.staysDesc", "The accommodations travellers will see on this package. Operators usually name a representative property — add “or similar” to keep your options open.")}
                </p>
            </div>

            {hotels.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
                    <BedDouble className="h-10 w-10 mx-auto text-muted-foreground mb-3" aria-hidden />
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                        {t("packageWizard.noStaysYet", "No stays added yet. This section is optional — add one if you want travellers to see where they'll sleep.")}
                    </p>
                    <Button onClick={addHotel} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("packageWizard.addHotel", "Add stay")}
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {hotels.map((hotel, index) => (
                        <Card key={hotel.id}>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-xs font-medium text-muted-foreground pt-2">
                                        {t("packageWizard.stayN", "Stay {{n}}", { n: index + 1 })}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeHotel(hotel.id)}
                                        aria-label={t("common.delete")}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-4">
                                    {/* Image */}
                                    <div>
                                        <input
                                            ref={(el) => {
                                                fileInputs.current[hotel.id] = el;
                                            }}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleUpload(hotel, file);
                                                e.target.value = "";
                                            }}
                                        />
                                        {hotel.image_path ? (
                                            <div className="relative h-24 w-full rounded-lg overflow-hidden bg-muted group">
                                                <img src={hotel.image_path} alt={hotel.name} className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        removeStorageImage(hotel.image_path);
                                                        patch(hotel.id, { image_path: null });
                                                    }}
                                                    className="absolute top-1 end-1 grid place-items-center h-7 w-7 rounded-full bg-background/90 text-destructive shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                    aria-label={t("packageWizard.removeImage", "Remove image")}
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => fileInputs.current[hotel.id]?.click()}
                                                disabled={uploadingId === hotel.id}
                                                className="h-24 w-full rounded-lg border-2 border-dashed border-border grid place-items-center text-muted-foreground hover:bg-muted transition-colors"
                                            >
                                                {uploadingId === hotel.id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                ) : (
                                                    <span className="flex flex-col items-center gap-1 text-xs">
                                                        <ImagePlus className="h-5 w-5" />
                                                        {t("packageWizard.addPhoto", "Add photo")}
                                                    </span>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Fields */}
                                    <div className="space-y-3 min-w-0">
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`hotel-name-${hotel.id}`} className="text-start block">
                                                {t("packageWizard.hotelName", "Name")}
                                                <span className="text-destructive ms-0.5" aria-hidden="true">*</span>
                                            </Label>
                                            <Input
                                                id={`hotel-name-${hotel.id}`}
                                                value={hotel.name}
                                                onChange={(e) => patch(hotel.id, { name: e.target.value })}
                                                placeholder={t("packageWizard.hotelNamePlaceholder", "Apricot Hotel or similar")}
                                                dir="auto"
                                                aria-invalid={!hotel.name.trim()}
                                            />
                                            {!hotel.name.trim() && (
                                                <p className="text-xs text-destructive text-start">
                                                    {t("packageWizard.unnamedStayWarning", "Unnamed stays are not saved — give this stay a name or it will be dropped.")}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor={`hotel-room-${hotel.id}`} className="text-start block">
                                                {t("packageWizard.roomType", "Room type")}
                                            </Label>
                                            <Input
                                                id={`hotel-room-${hotel.id}`}
                                                value={hotel.room_type ?? ""}
                                                onChange={(e) => patch(hotel.id, { room_type: e.target.value })}
                                                placeholder={t("packageWizard.roomTypePlaceholder", "Deluxe Room")}
                                                dir="auto"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-start block">{t("packageWizard.hotelKind", "Type")}</Label>
                                                <Select value={hotel.kind} onValueChange={(v) => patch(hotel.id, { kind: v as HotelKind })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {HOTEL_KINDS.map((k) => (
                                                            <SelectItem key={k} value={k}>{t(`packageWizard.hotelKind_${k}`, k)}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-start block">{t("packageWizard.starRating", "Star rating")}</Label>
                                                <Select
                                                    value={hotel.star_rating ? String(hotel.star_rating) : "none"}
                                                    onValueChange={(v) => patch(hotel.id, { star_rating: v === "none" ? null : Number(v) })}
                                                >
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">{t("packageWizard.noStars", "Not rated")}</SelectItem>
                                                        {[1, 2, 3, 4, 5].map((n) => (
                                                            <SelectItem key={n} value={String(n)}>{n}★</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Days — only the days the itinerary actually has */}
                                        <div className="space-y-1.5">
                                            <Label className="text-start block">{t("packageWizard.stayNights", "Nights spent here")}</Label>
                                            {dayNumbers.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">
                                                    {t("packageWizard.addDaysFirst", "Add days in The Plan first, then choose which ones this stay covers.")}
                                                </p>
                                            ) : (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {dayNumbers.map((day) => {
                                                        const on = hotel.day_numbers.includes(day);
                                                        return (
                                                            <button
                                                                key={day}
                                                                type="button"
                                                                onClick={() => toggleDay(hotel, day)}
                                                                aria-pressed={on}
                                                                className={cn(
                                                                    // Comfortable touch target on phones, tighter on pointer devices.
                                                                    "min-w-11 h-11 sm:min-w-9 sm:h-9 px-2 rounded-md border text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                                                                    on
                                                                        ? "border-primary bg-primary/10 text-primary font-semibold"
                                                                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                                                )}
                                                            >
                                                                {day}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Arabic content — same collapsible idiom as the other steps. */}
                                        <Collapsible className="border rounded-md">
                                            <CollapsibleTrigger asChild>
                                                <Button type="button" variant="ghost" className="w-full justify-between px-3 h-9">
                                                    <span className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
                                                        <Languages className="h-4 w-4" aria-hidden />
                                                        {t("packageWizard.arabicContent", "Arabic content (optional)")}
                                                    </span>
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="p-3 pt-0 space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`hotel-name-ar-${hotel.id}`} className="text-start block text-xs">
                                                        {t("packageWizard.hotelNameAr", "Name (Arabic)")}
                                                    </Label>
                                                    <Input
                                                        id={`hotel-name-ar-${hotel.id}`}
                                                        value={hotel.name_ar ?? ""}
                                                        onChange={(e) => patch(hotel.id, { name_ar: e.target.value })}
                                                        dir="rtl"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor={`hotel-room-ar-${hotel.id}`} className="text-start block text-xs">
                                                        {t("packageWizard.roomTypeAr", "Room type (Arabic)")}
                                                    </Label>
                                                    <Input
                                                        id={`hotel-room-ar-${hotel.id}`}
                                                        value={hotel.room_type_ar ?? ""}
                                                        onChange={(e) => patch(hotel.id, { room_type_ar: e.target.value })}
                                                        dir="rtl"
                                                    />
                                                </div>
                                            </CollapsibleContent>
                                        </Collapsible>

                                        <div className="flex items-center justify-between gap-3 pt-1">
                                            <Label htmlFor={`hotel-upgrade-${hotel.id}`} className="text-sm font-normal text-start">
                                                {t("packageWizard.upgradeAvailable", "Upgrade available")}
                                            </Label>
                                            <Switch
                                                id={`hotel-upgrade-${hotel.id}`}
                                                checked={hotel.upgrade_available}
                                                onCheckedChange={(v) => patch(hotel.id, { upgrade_available: v })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outline" onClick={addHotel} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t("packageWizard.addHotel", "Add stay")}
                    </Button>
                </div>
            )}
        </div>
    );
}
