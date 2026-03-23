import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload as UploadIcon, Check, Loader2, FileText, Image,
  Globe, File, AlertCircle, Eye
} from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import FilePreview from "@/components/FilePreview";
import { useLanguage } from "@/components/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const DOCUMENT_TYPES = {
  birth_certificate: "شهادة ميلاد",
  marriage_certificate: "شهادة زواج",
  death_certificate: "شهادة وفاة",
  divorce_certificate: "شهادة طلاق",
  education_certificate: "شهادة تعليمية",
  power_of_attorney: "توكيل",
  commercial_register: "سجل تجاري",
  id_card: "بطاقة هوية",
  passport: "جواز سفر",
  court_ruling: "حكم محكمة",
  other: "أخرى"
};

export default function Upload() {
  const { t, isRTL } = useLanguage();
  const [uploadResults, setUploadResults] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // { file, existingName }
  
  const queryClient = useQueryClient();

  const { data: existingTemplates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: () => base44.entities.Template.list("-created_date", 500),
  });
  
  const DOCUMENT_TYPES_TRANSLATED = {
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
    other: t("other")
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const processFile = async (file, resultId) => {
    const updateResult = (patch) => {
      setUploadResults(prev => prev.map(r => r.id === resultId ? { ...r, ...patch } : r));
    };

    updateResult({ status: "uploading", progress: 20 });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const ext = file.name.split('.').pop().toLowerCase();
    const file_type = ext === 'pdf' ? 'pdf' : 'image';

    updateResult({ file_url, file_type, progress: 40, status: "analyzing" });

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت خبير في تحليل المستندات الرسمية. حلل هذا المستند واستخرج:

1. **نوع المستند**: حدد من هذه الأنواع فقط:
   - birth_certificate (شهادة ميلاد)
   - marriage_certificate (شهادة/قسيمة زواج)
   - death_certificate (شهادة وفاة)
   - divorce_certificate (شهادة طلاق)
   - education_certificate (شهادة تعليمية/دراسية)
   - power_of_attorney (توكيل)
   - commercial_register (سجل تجاري)
   - id_card (بطاقة هوية)
   - passport (جواز سفر)
   - court_ruling (حكم محكمة)
   - other (أخرى)

2. **الدولة**: استخرج اسم الدولة بالعربية (مثل: مصر، لبنان، سوريا، الأردن، السعودية، إلخ)

3. **اللغة**: حدد من: arabic, english, french, german, spanish, italian, other

4. **جهة الإصدار**: اسم الجهة/الوزارة/الهيئة المصدرة (إن وجدت)

5. **الكلمات المفتاحية**: استخرج أهم 5-10 كلمات مميزة تساعد في التعرف على هذا النوع من المستندات

6. **النص المستخرج**: استخرج أهم النصوص من المستند (الـ header والعناوين الرئيسية)

7. **ملخص المستند**: اكتب ملخص قصير (2-3 جمل) يوضح محتوى المستند والغرض منه

أجب بـ JSON فقط.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          country: { type: "string" },
          language: { type: "string" },
          issuing_authority: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          extracted_text: { type: "string" },
          summary: { type: "string" },
          confidence: { type: "number" }
        }
      }
    });

    updateResult({ analysis, progress: 80, status: "saving" });

    await createMutation.mutateAsync({
      name: `${analysis.country || t("unknown")} - ${DOCUMENT_TYPES_TRANSLATED[analysis.document_type] || t("document")}`,
      original_name: file.name,
      file_url,
      file_type,
      country: analysis.country || t("unknown"),
      document_type: analysis.document_type || "other",
      language: analysis.language || "arabic",
      issuing_authority: analysis.issuing_authority || "",
      keywords: analysis.keywords || [],
      extracted_text: analysis.extracted_text || "",
      usage_count: 0
    });

    updateResult({ status: "complete", progress: 100 });
  };

  const handleFilesSelected = (files) => {
    // Check for duplicates
    for (const file of files) {
      const duplicate = existingTemplates.find(
        t => t.original_name?.toLowerCase() === file.name.toLowerCase()
      );
      if (duplicate) {
        setDuplicateWarning({ file, existingName: duplicate.name || duplicate.original_name, pendingFiles: files });
        return;
      }
    }
    startUpload(files);
  };

  const startUpload = (files) => {
    const newResults = files.map(file => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      status: "uploading",
      progress: 0,
      analysis: null,
      file_url: null,
      file_type: null,
    }));
    setUploadResults(prev => [...prev, ...newResults]);
    newResults.forEach(r => processFile(r.file, r.id));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "uploading": return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "analyzing": return <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />;
      case "saving": return <Loader2 className="w-5 h-5 text-green-500 animate-spin" />;
      case "complete": return <Check className="w-5 h-5 text-green-500" />;
      case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    if (isRTL) {
      switch (status) {
        case "uploading": return "جاري الرفع...";
        case "analyzing": return "جاري التحليل والـ OCR...";
        case "saving": return "جاري الحفظ...";
        case "complete": return "تم بنجاح";
        case "error": return "فشل";
        default: return "";
      }
    } else {
      switch (status) {
        case "uploading": return "Uploading...";
        case "analyzing": return "Analyzing (OCR)...";
        case "saving": return "Saving...";
        case "complete": return "Complete";
        case "error": return "Failed";
        default: return "";
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t("uploadDocuments")}</h1>
          <p className="text-gray-500 mt-1">{t("uploadDescription")}</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="w-5 h-5" />
              {t("uploadFiles")}
            </CardTitle>
            <CardDescription>
              {t("dragDropFiles")} • PDF, JPG, PNG
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileDropzone 
              onFilesSelected={handleFilesSelected}
              multiple={true}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </CardContent>
        </Card>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? "نتائج الرفع والتحليل" : "Upload & Analysis Results"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {uploadResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {result.file_type === 'pdf' ? 
                          <FileText className="w-8 h-8 text-red-500" /> : 
                          <Image className="w-8 h-8 text-blue-500" />
                        }
                        <div>
                          <p className="font-medium">{result.name}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {getStatusIcon(result.status)}
                            <span>{getStatusText(result.status)}</span>
                          </div>
                        </div>
                      </div>
                      {result.file_url && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPreviewFile({ file_url: result.file_url, name: result.name, file_type: result.file_type })}
                        >
                          <Eye className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("preview")}
                        </Button>
                      )}
                    </div>
                    
                    <Progress value={result.progress} className="h-2 mb-3" />
                    
                    {result.analysis && result.status === "complete" && (
                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                        <p className="text-sm font-medium mb-2">{isRTL ? "نتيجة التحليل:" : "Analysis Result:"}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">
                            <Globe className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} />
                            {result.analysis.country || (isRTL ? "غير محدد" : "Unknown")}
                          </Badge>

                          <Badge variant="outline">
                            {DOCUMENT_TYPES_TRANSLATED[result.analysis.document_type] || result.analysis.document_type}
                          </Badge>
                          {result.analysis.issuing_authority && (
                            <Badge variant="outline" className="text-xs">
                              {result.analysis.issuing_authority}
                            </Badge>
                          )}
                        </div>
                        {result.analysis.keywords?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">{t("keywords")}:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.analysis.keywords.slice(0, 5).map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs bg-white">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {result.analysis.summary && (
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
                            <p className="text-xs text-blue-600 font-medium mb-1">
                              {isRTL ? "📝 ملخص المستند:" : "📝 Summary:"}
                            </p>
                            <p className="text-sm text-gray-700">{result.analysis.summary}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Duplicate Warning Dialog */}
        <Dialog open={!!duplicateWarning} onOpenChange={() => setDuplicateWarning(null)}>
          <DialogContent dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                ⚠️ {isRTL ? "ملف مكرر!" : "Duplicate File!"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <p className="text-gray-700 mb-1">
                {isRTL
                  ? <>الملف <strong>{duplicateWarning?.file?.name}</strong> موجود بالفعل باسم:</>
                  : <>File <strong>{duplicateWarning?.file?.name}</strong> already exists as:</>
                }
              </p>
              <p className="font-semibold text-blue-700 mb-4">"{duplicateWarning?.existingName}"</p>
              <p className="text-gray-600 mb-4">
                {isRTL ? "هل تريد إضافته بردو؟" : "Do you still want to add it?"}
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDuplicateWarning(null)}>
                  {isRTL ? "لا، إلغاء" : "No, Cancel"}
                </Button>
                <Button onClick={() => {
                  const files = duplicateWarning.pendingFiles;
                  setDuplicateWarning(null);
                  startUpload(files);
                }}>
                  {isRTL ? "نعم، أضفه" : "Yes, Add it"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* File Preview */}
        <FilePreview 
          file={previewFile} 
          isOpen={!!previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      </div>
    </div>
  );
}