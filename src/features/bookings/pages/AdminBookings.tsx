import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/dropdown-menu";
import { Search, MoreHorizontal, Eye, RefreshCw, XCircle } from "lucide-react";
import { useAdminBookings } from "@/features/admin/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AdminBookingManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { bookings, stats, loading, refetch, updateBookingStatus } = useAdminBookings();
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">{t('common.confirmed')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('common.pending')}</Badge>;
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800">{t('common.refunded')}</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">{t('common.failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getBookingBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">{t('common.confirmed')}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('common.pending')}</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">{t('common.cancelled')}</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">{t('common.completed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'cancelled');
    if (result.success) {
      toast.success(t('adminBookings.cancelSuccess'));
    } else {
      toast.error(t('adminBookings.cancelError'));
    }
  };

  const handleProcessRefund = async (bookingId: string) => {
    const result = await updateBookingStatus(bookingId, 'cancelled', 'refunded');
    if (result.success) {
      toast.success(t('adminBookings.refundSuccess'));
    } else {
      toast.error(t('adminBookings.refundError'));
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.package_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.traveler_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.agency_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-start">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2 text-start">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="text-start">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-gray-900">{t('adminBookings.title')}</h1>
          <p className="text-gray-600">{t('adminBookings.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t('common.refresh')}
          </Button>
          <Button>{t('adminBookings.exportBookings')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('adminBookings.totalBookings')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.total.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('common.confirmed')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.confirmed.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('common.pending')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.pending.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('adminBookings.thisMonth')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.thisMonth.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('adminBookings.allBookings')}</CardTitle>
            <div className="relative">
              <Search className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 start-3" />
              <Input
                placeholder={t('adminBookings.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 ps-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('adminBookings.noBookingsFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('adminBookings.bookingId')}</TableHead>
                  <TableHead className="text-start">{t('common.tour')}</TableHead>
                  <TableHead className="text-start">{t('common.traveler')}</TableHead>
                  <TableHead className="text-start">{t('common.agency')}</TableHead>
                  <TableHead className="text-start">{t('adminBookings.travelDate')}</TableHead>
                  <TableHead className="text-start">{t('common.amount')}</TableHead>
                  <TableHead className="text-start">{t('adminBookings.payment')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm text-start">{booking.id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium text-start">{booking.package_title}</TableCell>
                    <TableCell className="text-start">{booking.traveler_name}</TableCell>
                    <TableCell className="text-start">{booking.agency_name}</TableCell>
                    <TableCell className="text-sm text-start">{new Date(booking.booking_date).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell className="font-medium tabular-nums text-start">{formatCurrency(booking.total_price)}</TableCell>
                    <TableCell className="text-start">{getPaymentBadge(booking.payment_status)}</TableCell>
                    <TableCell className="text-start">{getBookingBadge(booking.status)}</TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? "start" : "end"}>
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 me-2" />
                            {t('common.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleProcessRefund(booking.id)}>
                            <RefreshCw className="w-4 h-4 me-2" />
                            {t('adminBookings.processRefund')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircle className="w-4 h-4 me-2" />
                            {t('adminBookings.cancelBooking')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
