import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Label } from '@/ui/label';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ContactAgencyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    /** auth user id of the agency that receives the message */
    agencyId: string;
    /** package or booking the question is about — prefixed to the message */
    subject: string;
}

/**
 * Sends a direct message from the signed-in traveler to an agency's inbox
 * (public.messages — the agency portal Messages page subscribes to INSERTs).
 * RLS only allows sending as auth.uid(), so the sender cannot be spoofed.
 */
export function ContactAgencyDialog({ isOpen, onClose, agencyId, subject }: ContactAgencyDialogProps) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!user || !content.trim()) return;
        setSending(true);
        try {
            const { error } = await supabase.from('messages').insert({
                sender_id: user.id,
                recipient_id: agencyId,
                content: `[${subject}] ${content.trim()}`,
            });
            if (error) throw error;
            toast.success(t('messages.sent', 'Message sent — the agency will get back to you.'));
            setContent('');
            onClose();
        } catch (err) {
            console.error('Error sending message:', err);
            toast.error(t('messages.sendFailed', 'Could not send your message. Please try again.'));
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{t('messages.contactAgencyTitle', { subject, defaultValue: 'Ask about {{subject}}' })}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 py-2">
                    <Label htmlFor="agency-message">{t('messages.yourMessage', 'Your message')}</Label>
                    <Textarea
                        id="agency-message"
                        rows={5}
                        maxLength={4000}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t('messages.messagePlaceholder', 'Ask about dates, group size, what to bring...')}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={sending}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSend} disabled={sending || !content.trim()}>
                        {sending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                        {t('messages.send', 'Send message')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
