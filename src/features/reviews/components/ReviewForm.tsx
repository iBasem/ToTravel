
import { useState } from "react";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { StarRating } from "./StarRating";
import { useReviews } from "@/features/reviews/hooks/useReviews";
import { useTranslation } from "react-i18next";

interface ReviewFormProps {
    packageId: string;
    bookingId: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function ReviewForm({ packageId, bookingId, onSuccess, trigger }: ReviewFormProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const { submitReview, submitting } = useReviews();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        const success = await submitReview({
            packageId,
            bookingId,
            rating,
            comment
        });

        if (success) {
            setOpen(false);
            setRating(0);
            setComment("");
            onSuccess?.();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>{t('common.writeReview')}</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('common.writeReview')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-start block">{t('common.rating')}</label>
                        <div className="flex justify-center py-2">
                            <StarRating
                                rating={rating}
                                onRatingChange={setRating}
                                size="lg"
                                className="gap-2"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="comment" className="text-sm font-medium text-start block">{t('common.yourExperience')}</label>
                        <Textarea
                            id="comment"
                            placeholder={t('common.tellUs')}
                            className="text-start"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting || rating === 0}>
                            {submitting ? t('common.submitting') : t('common.submitReview')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
