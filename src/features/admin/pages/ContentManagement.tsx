import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
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
import { FileText, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { useAdminContent } from "@/features/admin/hooks";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export default function ContentManagement() {
  const { t, i18n } = useTranslation();
  const { content, stats, loading, refetch, deleteContent } = useAdminContent();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">{t('common.published', 'Published')}</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800">{t('common.draft')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "page":
        return <Badge variant="outline">{t('content.page', 'Page')}</Badge>;
      case "legal":
        return <Badge className="bg-blue-100 text-blue-800">{t('content.legal', 'Legal')}</Badge>;
      case "blog":
        return <Badge className="bg-purple-100 text-purple-800">{t('content.blog', 'Blog')}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteContent(id);
    if (result.success) {
      toast.success(t('content.deleteSuccess', 'Content deleted successfully'));
    } else {
      toast.error(t('content.deleteError', 'Failed to delete content'));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('content.title', 'Content Management')}</h1>
          <p className="text-muted-foreground">{t('content.subtitle', 'Manage website content, pages, and blog posts')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refetch} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('common.refresh')}
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('content.addContent', 'Add Content')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('content.totalPages', 'Total Pages')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.totalPages.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('content.blogPosts', 'Blog Posts')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.blogPosts.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 text-start">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('content.draftContent', 'Draft Content')}</CardTitle>
          </CardHeader>
          <CardContent className="text-start">
            <div className="text-2xl font-bold tabular-nums">{stats.draftContent.toLocaleString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t('content.allContent', 'All Content')}</CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t('content.noContentFound', 'No content found')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('common.title')}</TableHead>
                  <TableHead className="text-start">{t('common.type')}</TableHead>
                  <TableHead className="text-start">{t('common.status')}</TableHead>
                  <TableHead className="text-start">{t('common.lastModified', 'Last Modified')}</TableHead>
                  <TableHead className="text-end">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {content.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-start">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{item.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-start">{getTypeBadge(item.content_type)}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm tabular-nums text-start">{new Date(item.updated_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US')}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600"
                          onClick={() => handleDelete(item.id)}
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
    </div>
  );
}
