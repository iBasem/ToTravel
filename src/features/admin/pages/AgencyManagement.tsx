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
import { Search, Filter, MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Building2, RefreshCw } from "lucide-react";
import { useAdminAgencies } from "@/features/admin/hooks";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AgencyManagement() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { agencies, stats, loading, refetch, updateAgencyStatus } = useAdminAgencies();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadge = (status: string, isVerified: boolean) => {
    if (isVerified || status === "approved") {
      return <Badge className="bg-green-100 text-green-800">{t('common.approved')}</Badge>;
    }
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('common.pending')}</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">{t('common.rejected')}</Badge>;
      case "suspended":
        return <Badge className="bg-gray-100 text-gray-800">{t('common.suspended')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApprove = async (agencyId: string) => {
    const result = await updateAgencyStatus(agencyId, 'approved', true);
    if (result.success) {
      toast.success(t('agencyManagement.approveSuccess'));
    } else {
      toast.error(t('agencyManagement.approveError'));
    }
  };

  const handleReject = async (agencyId: string) => {
    const result = await updateAgencyStatus(agencyId, 'rejected', false);
    if (result.success) {
      toast.success(t('agencyManagement.rejectSuccess'));
    } else {
      toast.error(t('agencyManagement.rejectError'));
    }
  };

  const filteredAgencies = agencies.filter(agency => {
    const contactPerson = `${agency.contact_person_first_name} ${agency.contact_person_last_name}`.toLowerCase();
    const matchesSearch = agency.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactPerson.includes(searchTerm.toLowerCase()) ||
      agency.email.toLowerCase().includes(searchTerm.toLowerCase());

    const agencyStatus = agency.is_verified || agency.status === 'approved' ? 'approved' : agency.status;
    const matchesStatus = statusFilter === "all" || agencyStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-72 mb-2" />
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-gray-900">{t('agencyManagement.title')}</h1>
          <p className="text-gray-600">{t('agencyManagement.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center">
            <RefreshCw className="w-4 h-4 me-2" />
            {t('common.refresh')}
          </Button>
          <Button>{t('agencyManagement.applications')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('agencyManagement.totalAgencies')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('common.approved')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('agencyManagement.pendingApproval')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-gray-500">{t('agencyManagement.totalToursListed')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalPackages.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('agencyManagement.allAgencies')}</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 start-3" />
                <Input
                  placeholder={t('agencyManagement.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 ps-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {t('common.status')}: {statusFilter === "all" ? t('common.all') : t(`common.${statusFilter}`)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    {t('common.allStatus')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
                    {t('common.approved')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    {t('common.pending')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                    {t('common.rejected')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAgencies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>{t('agencyManagement.noAgenciesFound')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('common.agency')}</TableHead>
                  <TableHead className="text-start">{t('agencyManagement.agencyId')}</TableHead>
                  <TableHead className="text-start">{t('agencyManagement.contactPerson')}</TableHead>
                  <TableHead className="text-start">{t('agencyManagement.registrationDate')}</TableHead>
                  <TableHead className="text-start">{t('agencyManagement.toursListed')}</TableHead>
                  <TableHead className="text-start">{t('agencyManagement.commission')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAgencies.map((agency) => (
                  <TableRow key={agency.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-start">
                          <div className="font-medium text-gray-900">{agency.company_name}</div>
                          <div className="text-sm text-gray-500">{agency.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-start">{agency.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-start">
                      {agency.contact_person_first_name} {agency.contact_person_last_name}
                    </TableCell>
                    <TableCell className="text-start">{new Date(agency.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell className="text-start text-gray-900 font-medium">{agency.packages_count}</TableCell>
                    <TableCell className="tabular-nums text-start">{(agency.commission_rate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="text-start">{getStatusBadge(agency.status, agency.is_verified)}</TableCell>
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
                          {agency.status === "pending" && !agency.is_verified && (
                            <>
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleApprove(agency.id)}
                              >
                                <CheckCircle className="w-4 h-4 me-2" />
                                {t('agencyManagement.approveBtn')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleReject(agency.id)}
                              >
                                <XCircle className="w-4 h-4 me-2" />
                                {t('agencyManagement.rejectBtn')}
                              </DropdownMenuItem>
                            </>
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
