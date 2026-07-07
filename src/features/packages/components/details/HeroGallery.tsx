import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent } from "@/ui/dialog";
import { ChevronLeft, ChevronRight, Images, Award } from "lucide-react";
import type { HeroGalleryProps } from "@/features/packages/types";

export function HeroGallery({ images, title, isBestSeller = false }: HeroGalleryProps) {
    const { t } = useTranslation();
    const [selectedImage, setSelectedImage] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="w-full h-[400px] bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                    <Images className="w-16 h-16 mx-auto mb-2 opacity-50" />
                    <p>{t('packageDetails.noImages', 'No images available')}</p>
                </div>
            </div>
        );
    }

    const sortedImages = [...images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.display_order - b.display_order;
    });

    const mainImage = sortedImages[selectedImage] || sortedImages[0];
    const thumbnails = sortedImages.slice(0, 5);

    const handlePrevImage = () => {
        setSelectedImage((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
    };

    const handleNextImage = () => {
        setSelectedImage((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
    };

    return (
        <>
            <div className="relative">
                {/* Best Seller Badge */}
                {isBestSeller && (
                    <Badge className="absolute top-4 start-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 text-sm font-semibold shadow-lg">
                        <Award className="w-4 h-4 me-1" />
                        {t('packageDetails.bestSeller', 'Best Seller')}
                    </Badge>
                )}

                {/* Mosaic Grid Layout */}
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[450px] rounded-xl overflow-hidden">
                    {/* Main Large Image - Takes up start 60% */}
                    <div
                        className="col-start-1 col-span-2 row-span-2 relative cursor-pointer group"
                        onClick={() => setLightboxOpen(true)}
                    >
                        <img
                            src={mainImage?.file_path || '/placeholder.svg'}
                            alt={mainImage?.caption || title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                        {/* Navigation Arrows */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                            className="absolute start-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                            className="absolute end-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                            {selectedImage + 1} / {sortedImages.length}
                        </div>
                    </div>

                    {/* Thumbnail Grid - 2x2 on the end */}
                    {thumbnails.slice(1, 5).map((image, index) => (
                        <div
                            key={image.id}
                            className={`relative cursor-pointer group overflow-hidden ${index === 3 && sortedImages.length > 5 ? 'relative' : ''
                                }`}
                            onClick={() => {
                                setSelectedImage(index + 1);
                                if (index === 3 && sortedImages.length > 5) {
                                    setLightboxOpen(true);
                                }
                            }}
                        >
                            <img
                                src={image.file_path}
                                alt={image.caption || `${title} ${index + 2}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                            {/* "See All Photos" overlay on last thumbnail */}
                            {index === 3 && sortedImages.length > 5 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <Images className="w-6 h-6 mx-auto mb-1" />
                                        <span className="text-sm font-medium">
                                            +{sortedImages.length - 5} {t('packageDetails.morePhotos', 'more')}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Fill empty slots if less than 4 thumbnails */}
                    {thumbnails.length < 5 && Array.from({ length: 5 - thumbnails.length }).map((_, index) => (
                        <div key={`empty-${index}`} className="bg-muted" />
                    ))}
                </div>
            </div>

            {/* Lightbox Modal */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="max-w-5xl p-0 bg-black border-none">
                    <div className="relative">
                        <img
                            src={sortedImages[selectedImage]?.file_path || '/placeholder.svg'}
                            alt={sortedImages[selectedImage]?.caption || title}
                            className="w-full max-h-[80vh] object-contain"
                        />

                        {/* Lightbox Navigation */}
                        <button
                            onClick={handlePrevImage}
                            className="absolute start-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-white rtl:rotate-180" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute end-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 rounded-full p-3 transition-colors"
                        >
                            <ChevronRight className="w-6 h-6 text-white rtl:rotate-180" />
                        </button>

                        {/* Lightbox Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
                            {selectedImage + 1} / {sortedImages.length}
                        </div>
                    </div>

                    {/* Thumbnail Strip */}
                    <div className="flex gap-2 p-4 overflow-x-auto bg-black/80">
                        {sortedImages.map((image, index) => (
                            <button
                                key={image.id}
                                onClick={() => setSelectedImage(index)}
                                className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden transition-all ${index === selectedImage ? 'ring-2 ring-white scale-105' : 'opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={image.file_path}
                                    alt={image.caption || `Thumbnail ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
