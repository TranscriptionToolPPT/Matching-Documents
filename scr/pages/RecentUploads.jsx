import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Image, Eye, Clock } from "lucide-react";
import FilePreview from "@/components/FilePreview";
import { useLanguage } from "@/components/LanguageContext";
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

export default function RecentUploads() {
  const { t, isRTL } = useLanguage();
  const [previewFile, setPreviewFile] = useState(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates-recent"],
    queryFn: () => base44.entities.Template.list("-created_date", 200),
  });

  const DOCUMENT_TYPES = {
    birth_certificate: t("birth_certificate"),
    marriage_certificate: t("marriage_certificate"),
    death_certificate: t("death_certificate"),
    divorce_certificate: t("divorce_certificate"),
    education_certificate: t("education_certificate"),
    power_of_attorney: t("power_of_attorney"),
    commercial_register: t("commercial_register"),
    id_card: t("id_card"),
    passport: t("passport"),
    court_ruling: t("court_ruling"),
    other: t("other"),
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? "آخر الرفع" : "Recent Uploads"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {isRTL ? `${templates.length} ملف مرفوع` : `${templates.length} uploaded files`}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">{t("loading")}</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{isRTL ? "لا يوجد ملفات مرفوعة بعد" : "No uploads yet"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((tpl, i) => (
              <Card key={tpl.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tpl.file_type === "pdf" ? "bg-red-100" : "bg-blue-100"}`}>
                        {tpl.file_type === "pdf"
                          ? <FileText className="w-5 h-5 text-red-500" />
                          : <Image className="w-5 h-5 text-blue-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{tpl.original_name || tpl.name}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {tpl.country && <Badge variant="secondary" className="text-xs">{tpl.country}</Badge>}
                          {tpl.document_type && <Badge variant="outline" className="text-xs">{DOCUMENT_TYPES[tpl.document_type] || tpl.document_type}</Badge>}
                          {tpl.language && <Badge variant="outline" className="text-xs">{t(tpl.language)}</Badge>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tpl.created_date
                            ? format(new Date(tpl.created_date), "d MMM yyyy - HH:mm", { locale: isRTL ? arSA : enUS })
                            : ""}
                        </p>
                      </div>
                    </div>
                    {tpl.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewFile(tpl)}
                        className="shrink-0 ms-3"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <FilePreview file={previewFile} isOpen={!!previewFile} onClose={() => setPreviewFile(null)} />
      </div>
    </div>
  );
}