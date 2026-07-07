import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/avatar";
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
import { Search, Filter, MoreHorizontal, Eye, Edit, UserX, UserCheck, RefreshCw } from "lucide-react";
import { useAdminTravelers } from "@/features/admin/hooks";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/ui/page-header";
import { StatsGrid } from "@/ui/stats-card";

export default function TravelerManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { travelers, stats, loading, refetch, updateTravelerStatus } = useAdminTravelers();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">{t('common.active')}</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">{t('common.suspended')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusChange = async (travelerId: string, newStatus: string) => {
    const result = await updateTravelerStatus(travelerId, newStatus);
    if (result.success) {
      toast.success(t('travelers.statusUpdateSuccess', { status: newStatus === 'active' ? t('common.active') : t('common.suspended') }));
    } else {
      toast.error(t('travelers.statusUpdateError'));
    }
  };

  const filteredTravelers = travelers.filter(traveler => {
    const fullName = `${traveler.first_name} ${traveler.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      traveler.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      traveler.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || traveler.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
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
      <PageHeader
        title={t('travelers.management')}
        description={t('travelers.manageAll')}
        actions={
          <>
            <Button variant="outline" onClick={refetch} className="flex items-center">
              <RefreshCw className="w-4 h-4 me-1 sm:me-2" />
              {t('common.refresh')}
            </Button>
            <Button>{t('travelers.exportData')}</Button>
          </>
        }
      />

      {/* Stats Cards */}
      <StatsGrid
        stats={[
          { title: t('travelers.totalTravelers'), value: stats.total.toLocaleString() },
          { title: t('travelers.activeUsers'), value: stats.active.toLocaleString() },
          { title: t('common.suspended'), value: stats.suspended.toLocaleString() },
          { title: t('travelers.newThisMonth'), value: stats.newThisMonth.toLocaleString() },
        ]}
      />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('travelers.allTravelers')}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 start-3" />
                <Input
                  placeholder={t('travelers.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 ps-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('common.status')}: {statusFilter === "all" ? t('common.all') : (statusFilter === 'active' ? t('common.active') : t('common.suspended'))}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    {t('common.allStatus')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    {t('common.active')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>
                    {t('common.suspended')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTravelers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('travelers.noTravelersFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('common.traveler')}</TableHead>
                  <TableHead className="text-start">{t('travelers.userId')}</TableHead>
                  <TableHead className="text-start">{t('travelers.registrationDate')}</TableHead>
                  <TableHead className="text-start">{t('travelers.totalBookings')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTravelers.map((traveler) => (
                  <TableRow key={traveler.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={traveler.avatar_url || undefined} />
                          <AvatarFallback>
                            {traveler.first_name?.[0]}{traveler.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-start">
                          <div className="font-medium">{traveler.first_name} {traveler.last_name}</div>
                          <div className="text-sm text-muted-foreground">{traveler.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-start">{traveler.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-start">{new Date(traveler.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell className="text-start">{traveler.bookings_count}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(traveler.status)}</TableCell>
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
                            {t('common.viewProfile')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 me-2" />
                            {t('common.editDetails')}
                          </DropdownMenuItem>
                          {traveler.status === "active" ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleStatusChange(traveler.id, 'suspended')}
                            >
                              <UserX className="w-4 h-4 me-2" />
                              {t('common.suspendUser')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => handleStatusChange(traveler.id, 'active')}
                            >
                              <UserCheck className="w-4 h-4 me-2" />
                              {t('common.activateUser')}
                            </DropdownMenuItem>
                          )}
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
