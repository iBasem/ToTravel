import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { Skeleton } from "@/ui/skeleton";
import { EmptyState } from "@/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { FileText, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import {
  useAdminContent,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  type ContentPage,
  type ContentPageInput,
} from "@/features/admin/hooks/useAdminContent";
import { ContentFormDialog } from "@/features/admin/components/ContentFormDialog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/formatters";

export default function ContentManagement() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useAdminContent();
  const createContent = useCreateContent();
  const updateContent = useUpdateContent();
  const deleteContent = useDeleteContent();

  const [formOpen, setFormOpen] = useState(false);
  const [editPage, setEditPage] = useState<ContentPage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContentPage | null>(null);

  const content = data?.content ?? [];
  const stats = data?.stats ?? { totalPages: 0, blogPosts: 0, draftContent: 0 };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t("common.published", "Published")}</Badge>;
      case "draft":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t("common.draft")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "page":
        return <Badge variant="outline">{t("content.type_page", "Page")}</Badge>;
      case "legal":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t("content.type_legal", "Legal")}</Badge>;
      case "blog":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">{t("content.type_blog", "Blog")}</Badge>;
      case "email_template":
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">{t("content.type_email_template", "Email template")}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleSave = (values: ContentPageInput) => {
    const onError = (error: Error) => {
      const isDuplicateSlug = error.message.includes("content_pages_slug_key") || error.message.includes("duplicate");
      toast.error(
        isDuplicateSlug
          ? t("content.slugTaken", "This slug is already in use")
          : t("content.saveError", "Failed to save content"),
      );
    };
    if (editPage) {
      updateContent.mutate(
        { id: editPage.id, ...values },
        {
          onSuccess: () => {
            toast.success(t("content.updateSuccess", "Content updated"));
            setFormOpen(false);
            setEditPage(null);
          },
          onError,
        },
      );
    } else {
      createContent.mutate(values, {
        onSuccess: () => {
          toast.success(t("content.createSuccess", "Content created"));
          setFormOpen(false);
        },
        onError,
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteContent.mutate(
      { id: deleteTarget.id, title: deleteTarget.title },
      {
        onSuccess: () => toast.success(t("content.deleteSuccess", "Content deleted successfully")),
        onError: () => toast.error(t("content.deleteError", "Failed to delete content")),
      },
    );
    setDeleteTarget(null);
  };

  if (isLoading) {
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

  if (isError) {
    return (
      <EmptyState
        icon="AlertTriangle"
        title={t("content.loadErrorTitle", "Could not load content")}
        description={t("content.loadErrorDescription", "Something went wrong while loading content. Please try again.")}
        action={{ label: t("common.retry", "Retry"), onClick: () => refetch() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="text-start">
          <h1 className="text-3xl font-bold text-foreground">{t("content.title", "Content Management")}</h1>
          <p className="text-muted-foreground">{t("content.subtitle", "Manage website content, pages, and blog posts")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            {t("common.refresh")}
          </Button>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditPage(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4" />
            {t("content.addContent", "Add Content")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: t("content.totalPages", "Total Pages"), value: stats.totalPages },
          { label: t("content.blogPosts", "Blog Posts"), value: stats.blogPosts },
          { label: t("content.draftContent", "Draft Content"), value: stats.draftContent },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2 text-start">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-start">
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="text-start">
          <CardTitle>{t("content.allContent", "All Content")}</CardTitle>
        </CardHeader>
        <CardContent>
          {content.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("content.noContentFound", "No content found")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t("common.title")}</TableHead>
                  <TableHead className="text-start">{t("content.slug", "Slug")}</TableHead>
                  <TableHead className="text-start">{t("common.type")}</TableHead>
                  <TableHead className="text-start">{t("common.status")}</TableHead>
                  <TableHead className="text-start">{t("common.lastModified", "Last Modified")}</TableHead>
                  <TableHead className="text-end">{t("common.actions")}</TableHead>
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
                    <TableCell className="font-mono text-xs text-start" dir="ltr">
                      {item.slug ?? "—"}
                    </TableCell>
                    <TableCell className="text-start">{getTypeBadge(item.content_type)}</TableCell>
                    <TableCell className="text-start">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm tabular-nums text-start">{formatDate(item.updated_at, "P")}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("common.editDetails")}
                          onClick={() => {
                            setEditPage(item);
                            setFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label={t("common.delete", "Delete")}
                          onClick={() => setDeleteTarget(item)}
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

      <ContentFormDialog
        open={formOpen}
        page={editPage}
        saving={createContent.isPending || updateContent.isPending}
        onClose={() => {
          setFormOpen(false);
          setEditPage(null);
        }}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("content.confirmDeleteTitle", "Delete this content?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("content.confirmDeleteDesc", "\"{{title}}\" will be permanently removed. This action cannot be undone.", {
                title: deleteTarget?.title ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
