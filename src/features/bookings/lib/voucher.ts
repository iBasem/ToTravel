import type { TFunction } from 'i18next';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { shortId } from '@/lib/utils';

export interface VoucherData {
    id: string;
    bookingDate: string;
    participants: number;
    totalPrice: number;
    status: string;
    paymentStatus?: string | null;
    packageTitle: string;
    destination: string;
    durationDays?: number;
    travelerName?: string;
}

/**
 * Builds a printable HTML voucher from real booking data and downloads it.
 * Everything on the voucher comes from the booking row the traveler already
 * owns — no extra backend round-trip is needed.
 */
export function downloadBookingVoucher(v: VoucherData, t: TFunction, dir: 'ltr' | 'rtl' = 'ltr'): void {
    const ref = shortId(v.id);
    const row = (label: string, value: string) => `
      <tr>
        <td style="padding:8px 12px;color:#6b7280;white-space:nowrap;">${label}</td>
        <td style="padding:8px 12px;font-weight:600;">${value}</td>
      </tr>`;

    const html = `<!doctype html>
<html dir="${dir}" lang="${dir === 'rtl' ? 'ar' : 'en'}">
<head>
<meta charset="utf-8">
<title>${t('voucher.title', 'Booking Voucher')} — ${ref}</title>
</head>
<body style="font-family:system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;background:#f5f5f5;margin:0;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#b44e2d;color:#fff;padding:20px 24px;">
      <div style="font-size:22px;font-weight:700;">ToTravel</div>
      <div style="opacity:.85;">${t('voucher.title', 'Booking Voucher')}</div>
    </div>
    <div style="padding:8px 12px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row(t('travelerDashboard.bookingRef', 'Booking Ref'), ref)}
        ${v.travelerName ? row(t('voucher.traveler', 'Traveler'), v.travelerName) : ''}
        ${row(t('common.package', 'Package'), v.packageTitle)}
        ${row(t('voucher.destination', 'Destination'), v.destination)}
        ${row(t('booking.selectDate', 'Date'), formatDate(v.bookingDate, 'PPP'))}
        ${v.durationDays ? row(t('packageCard.duration', 'Duration'), `${v.durationDays} ${t('common.days', 'days')}`) : ''}
        ${row(t('booking.participants', 'Participants'), String(v.participants))}
        ${row(t('common.total', 'Total'), formatCurrency(v.totalPrice))}
        ${row(t('common.status', 'Status'), v.status)}
        ${v.paymentStatus ? row(t('voucher.paymentStatus', 'Payment'), v.paymentStatus) : ''}
      </table>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
      ${t('voucher.footer', 'Present this voucher (printed or on your phone) to your tour operator. Generated on')} ${formatDate(new Date(), 'PPP')}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `totravel-voucher-${ref}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
