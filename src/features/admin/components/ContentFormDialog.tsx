import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import type { ContentPage, ContentPageInput } from "@/features/admin/hooks/useAdminContent";

interface ContentFormValues {
  title: string;
  slug: string;
  content_type: string;
  content: string;
  status: string;
}

interface ContentFormDialogProps {
  open: boolean;
  /** Existing page when editing, null when creating. */
  page: ContentPage | null;
  /** Restrict/preset the content type (e.g. 'email_template' from Settings). */
  fixedType?: string;
  saving: boolean;
  onClose: () => void;
  onSave: (values: ContentPageInput) => void;
}

const CONTENT_TYPES = ["page", "legal", "blog", "email_template"] as const;

export function ContentFormDialog({ open, page, fixedType, saving, onClose, onSave }: ContentFormDialogProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContentFormValues>({
    values: {
      title: page?.title ?? "",
      slug: page?.slug ?? "",
      content_type: page?.content_type ?? fixedType ?? "page",
      content: page?.content ?? "",
      status: page?.status ?? "draft",
    },
  });

  const contentType = watch("content_type");
  const status = watch("status");

  const submit = (values: ContentFormValues) => {
    onSave({
      title: values.title.trim(),
      slug: values.slug.trim() ? values.slug.trim() : null,
      content_type: values.content_type,
      content: values.content || null,
      status: values.status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-start">
              {page ? t("content.editTitle", "Edit content") : t("content.createTitle", "New content")}
            </DialogTitle>
            <DialogDescription className="text-start">
              {t("content.formDescription", "Pages with a unique slug are served on the public site once published.")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="content-title" className="text-start block">
              {t("common.title")} *
            </Label>
            <Input
              id="content-title"
              {...register("title", { required: t("content.titleRequired", "Title is required") })}
            />
            {errors.title && <p className="text-sm text-destructive text-start">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-slug" className="text-start block">
                {t("content.slug", "Slug")}
              </Label>
              <Input
                id="content-slug"
                dir="ltr"
                placeholder="about-us"
                {...register("slug", {
                  pattern: {
                    value: /^[a-z0-9-]*$/,
                    message: t("content.slugPattern", "Use lowercase letters, numbers and dashes only"),
                  },
                })}
              />
              {errors.slug && <p className="text-sm text-destructive text-start">{errors.slug.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-start block">{t("common.type")}</Label>
              <Select
                value={contentType}
                onValueChange={(v) => setValue("content_type", v)}
                disabled={!!fixedType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`content.type_${type}`, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-body" className="text-start block">
              {t("content.body", "Content")}
            </Label>
            <Textarea id="content-body" rows={10} {...register("content")} />
          </div>

          <div className="space-y-2">
            <Label className="text-start block">{t("common.status")}</Label>
            <Select value={status} onValueChange={(v) => setValue("status", v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("common.draft")}</SelectItem>
                <SelectItem value="published">{t("common.published", "Published")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving", "Saving…") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
