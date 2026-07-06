import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useDepartures } from "@/features/packages/hooks/useDepartures";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Badge } from "@/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ui/table";
import { LoadingSpinner } from "@/ui/loading-spinner";
import { EmptyState } from "@/ui/empty-state";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, CalendarDays } from "lucide-react";

export default function ManageDepartures() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const { departures, loading, addDeparture, deleteDeparture } = useDepartures(id);
  const [pkg, setPkg] = useState<{ title: string; base_price: number } | null>(null);

  const [date, setDate] = useState("");
  const [seats, setSeats] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('packages')
      .select('title, base_price')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setPkg({ title: data.title, base_price: Number(data.base_price) });
      });
  }, [id]);

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
  };

  const statusBadge = (d: { seats_remaining: number; status: string }) => {
    if (d.status === 'cancelled') return <Badge variant="outline">{t('departures.cancelled', 'Cancelled')}</Badge>;
    if (d.seats_remaining === 0) return <Badge className="bg-red-100 text-red-800">{t('departures.soldOut', 'Sold out')}</Badge>;
    if (d.seats_remaining <= 3) return <Badge className="bg-yellow-100 text-yellow-800">{t('departures.limited', 'Limited')}</Badge>;
    return <Badge className="bg-green-100 text-green-800">{t('departures.available', 'Available')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/travel_agency/packages')}>
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        </Button>
        <div className="text-start">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            {t('departures.title', 'Manage departures')}
          </h1>
          {pkg && <p className="text-sm text-muted-foreground">{pkg.title}</p>}
        </div>
      </div>

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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(d.id, d.booked)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
