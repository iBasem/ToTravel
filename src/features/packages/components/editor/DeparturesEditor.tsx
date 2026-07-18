import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useDepartures, type DepartureRow } from "@/features/packages/hooks/useDepartures";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Badge } from "@/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Ban } from "lucide-react";

interface DeparturesEditorProps {
  packageId: string;
  // Lets the package editor refresh its submit gate when dates change.
  onChanged?: () => void;
}

// Departure dates = tour start dates (not flights). Shared by the standalone
// Manage-departures page and the package editor's Departures section.
export function DeparturesEditor({ packageId, onChanged }: DeparturesEditorProps) {
  const { t } = useTranslation();

  const { departures, loading, addDeparture, updateDeparture, deleteDeparture } = useDepartures(packageId);
  const [pkg, setPkg] = useState<{ title: string; base_price: number } | null>(null);

  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<DepartureRow | null>(null);
  const [editSeats, setEditSeats] = useState("");
  const [editPrice, setEditPrice] = useState("");

  useEffect(() => {
    if (!packageId) return;
    supabase
      .from('packages')
      .select('title, base_price')
      .eq('id', packageId)
      .single()
      .then(({ data }) => {
        if (data) setPkg({ title: data.title, base_price: Number(data.base_price) });
      });
  }, [packageId]);

  const today = new Date().toISOString().slice(0, 10);

  const handleAdd = async () => {
    const seatsNum = parseInt(seats, 10);
    if (!date || date < today) {
      toast.error(t('departures.invalidDate', 'Pick a future departure date'));
      return;
    }
    if (!seatsNum || seatsNum < 1) {
      toast.error(t('departures.invalidSeats', 'Seats must be at least 1'));
      return;
    }
    setSaving(true);
    const { error } = await addDeparture({
      departure_date: date,
      total_seats: seatsNum,
      price_override: priceOverride ? parseFloat(priceOverride) : null,
    });
    setSaving(false);
    if (error) {
      // Unique (package_id, departure_date) violation surfaces here.
      toast.error(t('departures.addFailed', 'Could not add departure (date may already exist)'));
      return;
    }
    toast.success(t('departures.added', 'Departure added'));
    setDate("");
    setSeats("");
    setPriceOverride("");
    onChanged?.();
  };

  const openEdit = (d: DepartureRow) => {
    setEditTarget(d);
    setEditSeats(String(d.total_seats));
    setEditPrice(d.price_override != null ? String(d.price_override) : "");
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    const seatsNum = parseInt(editSeats, 10);
    if (!seatsNum || seatsNum < 1) {
      toast.error(t('departures.invalidSeats', 'Seats must be at least 1'));
      return;
    }
    if (seatsNum < editTarget.booked) {
      toast.error(t('departures.seatsBelowBooked', 'Seats cannot go below the already-booked count'));
      return;
    }
    const { error } = await updateDeparture(editTarget.id, {
      total_seats: seatsNum,
      price_override: editPrice ? parseFloat(editPrice) : null,
    });
    if (error) {
      toast.error(t('common.updateError', 'Something went wrong'));
      return;
    }
    toast.success(t('departures.updated', 'Departure updated'));
    setEditTarget(null);
    onChanged?.();
  };

  const handleCancel = async (d: DepartureRow) => {
    const msg = d.booked > 0
      ? t('departures.cancelConfirmBooked', 'Cancel this departure? {{count}} booked travelers will need to be notified and rebooked.', { count: d.booked })
      : t('departures.cancelConfirm', 'Cancel this departure?');
    if (!confirm(msg)) return;
    const { error } = await updateDeparture(d.id, { status: 'cancelled' });
    if (error) {
      toast.error(t('common.updateError', 'Something went wrong'));
      return;
    }
    toast.success(t('departures.cancelledToast', 'Departure cancelled'));
    onChanged?.();
  };

  const handleDelete = async (departureId: string, booked: number) => {
    if (booked > 0) {
      toast.error(t('departures.hasBookings', 'Cannot remove a departure that has bookings'));
      return;
    }
    const { error } = await deleteDeparture(departureId);
    if (error) {
      toast.error(t('common.updateError', 'Something went wrong'));
      return;
    }
    toast.success(t('departures.removed', 'Departure removed'));
    onChanged?.();
  };

  const statusBadge = (d: { seats_remaining: number; status: string }) => {
    if (d.status === 'cancelled') return <Badge variant="outline">{t('departures.cancelled', 'Cancelled')}</Badge>;
    if (d.seats_remaining === 0) return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">{t('departures.soldOut', 'Sold out')}</Badge>;
    if (d.seats_remaining <= 3) return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('departures.limited', 'Limited')}</Badge>;
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('departures.available', 'Available')}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Add departure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('departures.addNew', 'Add a departure date')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <Label className="text-start block mb-1">{t('departures.date', 'Date')}</Label>
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} dir="ltr" />
            </div>
            <div>
              <Label className="text-start block mb-1">{t('departures.seats', 'Total seats')}</Label>
              <Input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} dir="ltr" placeholder="20" />
            </div>
            <div>
              <Label className="text-start block mb-1">
                {t('departures.priceOverride', 'Price override')}
                <span className="text-muted-foreground"> ({t('common.optional', 'optional')})</span>
              </Label>
              <Input
                type="number"
                min={0}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                dir="ltr"
                placeholder={pkg ? String(pkg.base_price) : t('departures.basePrice', 'base price')}
              />
            </div>
            <Button onClick={handleAdd} disabled={saving} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('departures.add', 'Add')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departures list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('departures.scheduled', 'Scheduled departures')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex justify-center"><LoadingSpinner /></div>
          ) : departures.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={t('departures.noneTitle', 'No departures yet')}
              description={t('departures.noneDesc', 'Add departure dates so travelers can book this package.')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('departures.date', 'Date')}</TableHead>
                  <TableHead className="text-start">{t('departures.seats', 'Total seats')}</TableHead>
                  <TableHead className="text-start">{t('departures.booked', 'Booked')}</TableHead>
                  <TableHead className="text-start">{t('departures.remaining', 'Remaining')}</TableHead>
                  <TableHead className="text-start">{t('common.price', 'Price')}</TableHead>
                  <TableHead className="text-start">{t('common.status', 'Status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departures.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-start tabular-nums">{d.departure_date}</TableCell>
                    <TableCell className="text-start tabular-nums">{d.total_seats}</TableCell>
                    <TableCell className="text-start tabular-nums">{d.booked}</TableCell>
                    <TableCell className="text-start tabular-nums">{d.seats_remaining}</TableCell>
                    <TableCell className="text-start tabular-nums">
                      {formatCurrency(d.price_override != null ? Number(d.price_override) : (pkg?.base_price ?? 0))}
                    </TableCell>
                    <TableCell className="text-start">{statusBadge(d)}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1">
                        {d.status !== 'cancelled' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(d)}
                              aria-label={t('departures.edit', 'Edit departure')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(d)}
                              aria-label={t('departures.cancelDeparture', 'Cancel departure')}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(d.id, d.booked)}
                          aria-label={t('common.delete', 'Delete')}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit departure dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('departures.edit', 'Edit departure')}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-start" dir="ltr">{editTarget.departure_date}</p>
              <div>
                <Label className="text-start block mb-1">{t('departures.seats', 'Total seats')}</Label>
                <Input type="number" min={Math.max(1, editTarget.booked)} value={editSeats} onChange={(e) => setEditSeats(e.target.value)} dir="ltr" />
                {editTarget.booked > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 text-start">
                    {t('departures.bookedHint', '{{count}} seats already booked', { count: editTarget.booked })}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-start block mb-1">
                  {t('departures.priceOverride', 'Price override')}
                  <span className="text-muted-foreground"> ({t('common.optional', 'optional')})</span>
                </Label>
                <Input type="number" min={0} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} dir="ltr"
                  placeholder={pkg ? String(pkg.base_price) : ''} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>{t('common.cancel', 'Cancel')}</Button>
            <Button onClick={handleEditSave}>{t('common.save', 'Save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
