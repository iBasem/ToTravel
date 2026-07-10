import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { EmptyState } from '@/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { AdminDepartureRow } from '@/features/admin/hooks/useAdminPackageDetails';

interface DeparturesTabProps {
  departures: AdminDepartureRow[];
  basePrice: number;
}

export function DeparturesTab({ departures, basePrice }: DeparturesTabProps) {
  const { t } = useTranslation();

  if (departures.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title={t('adminPackageDetails.noDepartures', 'No departures')}
        description={t(
          'adminPackageDetails.noDeparturesDesc',
          'This package has no scheduled departures yet.',
        )}
      />
    );
  }

  const statusBadge = (d: AdminDepartureRow) => {
    if (d.status !== 'open') {
      return <Badge variant="outline">{t(`adminPackageDetails.departureStatus_${d.status}`, d.status)}</Badge>;
    }
    if (d.seats_remaining === 0) {
      return <Badge variant="destructive">{t('adminPackageDetails.soldOut', 'Sold out')}</Badge>;
    }
    if (d.seats_remaining <= 3) {
      return <Badge variant="secondary">{t('adminPackageDetails.limited', 'Limited')}</Badge>;
    }
    return <Badge variant="outline">{t('adminPackageDetails.departureStatus_open', 'Open')}</Badge>;
  };

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">
                {t('adminPackageDetails.departureDate', 'Departure')}
              </TableHead>
              <TableHead className="text-start">
                {t('adminPackageDetails.returnDate', 'Return')}
              </TableHead>
              <TableHead className="text-start">
                {t('adminPackageDetails.capacity', 'Capacity')}
              </TableHead>
              <TableHead className="text-start">
                {t('adminPackageDetails.booked', 'Booked')}
              </TableHead>
              <TableHead className="text-start">
                {t('adminPackageDetails.remaining', 'Remaining')}
              </TableHead>
              <TableHead className="text-start">{t('common.status', 'Status')}</TableHead>
              <TableHead className="text-end">
                {t('adminPackageDetails.price', 'Price')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departures.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(d.departure_date)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {d.return_date ? formatDate(d.return_date) : '—'}
                </TableCell>
                <TableCell className="tabular-nums">{d.total_seats}</TableCell>
                <TableCell className="tabular-nums">{d.booked}</TableCell>
                <TableCell className="tabular-nums">{d.seats_remaining}</TableCell>
                <TableCell>{statusBadge(d)}</TableCell>
                <TableCell className="text-end whitespace-nowrap">
                  {formatCurrency(Number(d.price_override ?? basePrice))}
                  {d.price_override != null && (
                    <span className="ms-1.5 text-xs text-muted-foreground">
                      {t('adminPackageDetails.priceOverride', '(override)')}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
