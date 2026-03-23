import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, FileText, Download, Check, Loader2, 
  Globe, Star, Clock, ThumbsUp, ThumbsDown, Sparkles,
  Eye, Image, ChevronDown, ChevronUp, CloudUpload, ScanText, GitCompare, CheckCircle2
} from "lucide-react";
import FileDropzone from "@/components/FileDropzone";
import FilePreview from "@/components/FilePreview";
import ProgressSteps from "@/components/ProgressSteps";
import { useLanguage } from "@/components/LanguageContext";

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

const LANGUAGES = {
  arabic: "العربية",
  english: "الإنجليزية",
  french: "الفرنسية",
  german: "الألمانية",
  spanish: "الإسبانية",
  italian: "الإيطالية",
  other: "أخرى"
};

export default function MatchTemplate() {
  const { t, isRTL } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [showAllResults, setShowAllResults] = useState(false);
  const [step, setStep] = useState(null); // null | uploading | analyzing | matching | done
  
  const queryClient = useQueryClient();
  
  const DOCUMENT_TYPES_T = {
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

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-usage_count', 1000),
  });

  const { data: recentHistory = [] } = useQuery({
    queryKey: ['match-history'],
    queryFn: () => base44.entities.MatchHistory.list('-created_date', 10),
  });

  const updateUsageMutation = useMutation({
    mutationFn: async (templateId) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        await base44.entities.Template.update(templateId, {
          usage_count: (template.usage_count || 0) + 1,
          last_used: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  });

  const saveHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.MatchHistory.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['match-history'] }),
  });

  const handleFilesSelected = async (files) => {
    const file = files[0];
    if (!file) return;
    
    setUploadedFile(file);
    setMatchResults(null);
    setSelectedMatch(null);
    setStep("uploading");
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setUploadedFileUrl(file_url);
    
    const ext = file.name.split('.').pop().toLowerCase();
    setFileType(ext === 'pdf' ? 'pdf' : 'image');
    
    // Auto-analyze
    await analyzeAndMatch(file_url);
  };

  const analyzeAndMatch = async (fileUrl) => {
    if (!fileUrl) return;
    
    setAnalyzing(true);
    setStep("analyzing");
    
    // OCR + Analysis using AI
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت خبير في تحليل المستندات الرسمية. حلل هذا المستند واستخرج:

1. **نوع المستند**: حدد من هذه الأنواع فقط:
   - birth_certificate (شهادة ميلاد)
   - marriage_certificate (شهادة/قسيمة زواج)
   - death_certificate (شهادة وفاة)
   - divorce_certificate (شهادة طلاق)
   - education_certificate (شهادة تعليمية)
   - power_of_attorney (توكيل)
   - commercial_register (سجل تجاري)
   - id_card (بطاقة هوية)
   - passport (جواز سفر)
   - court_ruling (حكم محكمة)
   - other (أخرى)

2. **الدولة**: بالعربية (مصر، لبنان، سوريا، الأردن، السعودية، إلخ)

3. **اللغة**: arabic, english, french, german, spanish, italian, other

4. **جهة الإصدار**: الجهة المصدرة إن وجدت

5. **الكلمات المفتاحية**: أهم 5-10 كلمات مميزة

6. **ملخص المستند**: اكتب ملخص قصير (2-3 جمل) يوضح محتوى المستند والغرض منه

أجب بـ JSON فقط.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          country: { type: "string" },
          language: { type: "string" },
          issuing_authority: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          summary: { type: "string" },
          confidence: { type: "number" }
        }
      }
    });

    // Match with templates
    setStep("matching");
    const matches = calculateMatches(analysisResult, templates);
    setMatchResults({
      analysis: analysisResult,
      matches: matches
    });
    
    setStep("done");
    setAnalyzing(false);
  };

  const calculateMatches = (analysis, templates) => {
    return templates.map(template => {
      let score = 0;
      let reasons = [];
      
      // Document type match (40%)
      const docTypeMatch = normalizeDocType(analysis.document_type) === template.document_type;
      if (docTypeMatch) {
        score += 40;
        reasons.push(isRTL ? "نوع المستند متطابق" : "Document type matched");
      }
      
      // Country match (30%)
      const countryMatch = normalizeText(analysis.country).includes(normalizeText(template.country)) ||
                          normalizeText(template.country).includes(normalizeText(analysis.country));
      if (countryMatch) {
        score += 30;
        reasons.push(isRTL ? "الدولة متطابقة" : "Country matched");
      }
      
      // Language match (15%)
      const langMatch = normalizeLanguage(analysis.language) === template.language;
      if (langMatch) {
        score += 15;
        reasons.push(isRTL ? "اللغة متطابقة" : "Language matched");
      }
      
      // Issuing authority match (10%)
      if (analysis.issuing_authority && template.issuing_authority) {
        const authorityMatch = normalizeText(analysis.issuing_authority).includes(normalizeText(template.issuing_authority)) ||
                              normalizeText(template.issuing_authority).includes(normalizeText(analysis.issuing_authority));
        if (authorityMatch) {
          score += 10;
          reasons.push(isRTL ? "جهة الإصدار متطابقة" : "Issuing authority matched");
        }
      }
      
      // Keywords match (5%)
      const analysisKeywords = (analysis.keywords || []).map(k => normalizeText(k));
      const templateKeywords = (template.keywords || []).map(k => normalizeText(k));
      const keywordMatches = analysisKeywords.filter(k => 
        templateKeywords.some(tk => tk.includes(k) || k.includes(tk))
      ).length;
      if (keywordMatches > 0) {
        score += Math.min(5, keywordMatches * 2);
        reasons.push(isRTL ? `${keywordMatches} كلمة مفتاحية متطابقة` : `${keywordMatches} keyword(s) matched`);
      }
      
      // Bonus for frequently used
      if (template.usage_count > 10) {
        score += 2;
      }
      
      return {
        template,
        score: Math.min(100, score),
        reasons
      };
    })
    .filter(m => m.score > 20)
    .sort((a, b) => b.score - a.score);
  };

  const normalizeText = (text) => {
    if (!text) return "";
    return text.toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .trim();
  };

  const normalizeDocType = (text) => {
    if (!text) return "other";
    const t = normalizeText(text);
    if (t.includes("ميلاد") || t.includes("birth")) return "birth_certificate";
    if (t.includes("زواج") || t.includes("marriage")) return "marriage_certificate";
    if (t.includes("وفاه") || t.includes("وفاة") || t.includes("death")) return "death_certificate";
    if (t.includes("طلاق") || t.includes("divorce")) return "divorce_certificate";
    if (t.includes("تعليم") || t.includes("شهاده") || t.includes("education")) return "education_certificate";
    if (t.includes("توكيل") || t.includes("power")) return "power_of_attorney";
    if (t.includes("سجل تجاري") || t.includes("commercial")) return "commercial_register";
    if (t.includes("هويه") || t.includes("id")) return "id_card";
    if (t.includes("جواز") || t.includes("passport")) return "passport";
    if (t.includes("حكم") || t.includes("محكم") || t.includes("court")) return "court_ruling";
    return "other";
  };

  const normalizeLanguage = (text) => {
    if (!text) return "other";
    const t = normalizeText(text);
    if (t.includes("عربي") || t.includes("arabic")) return "arabic";
    if (t.includes("انجليز") || t.includes("english")) return "english";
    if (t.includes("فرنس") || t.includes("french")) return "french";
    if (t.includes("الماني") || t.includes("german")) return "german";
    if (t.includes("اسباني") || t.includes("spanish")) return "spanish";
    if (t.includes("ايطالي") || t.includes("italian")) return "italian";
    return "other";
  };

  const handleSelectTemplate = (match) => {
    setSelectedMatch(match);
    updateUsageMutation.mutate(match.template.id);
    
    saveHistoryMutation.mutate({
      uploaded_file_url: uploadedFileUrl,
      uploaded_file_name: uploadedFile?.name || "unknown",
      matched_template_id: match.template.id,
      matched_template_name: match.template.original_name || match.template.name,
      similarity_score: match.score,
      is_correct: true
    });
  };

  const handleMarkIncorrect = (match) => {
    saveHistoryMutation.mutate({
      uploaded_file_url: uploadedFileUrl,
      uploaded_file_name: uploadedFile?.name || "unknown",
      matched_template_id: match.template.id,
      matched_template_name: match.template.original_name || match.template.name,
      similarity_score: match.score,
      is_correct: false
    });
  };

  const topMatch = matchResults?.matches?.[0];
  const otherMatches = matchResults?.matches?.slice(1, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("matchTitle")}</h1>
          <p className="text-gray-500 mt-1">{t("matchDescription")}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  {t("uploadToMatch")}
                </CardTitle>
                <CardDescription>
                  PDF {t("analyzeAuto")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileDropzone 
                  onFilesSelected={handleFilesSelected}
                  multiple={false}
                />
                
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {fileType === 'pdf' ? 
                        <FileText className="w-8 h-8 text-red-500" /> : 
                        <Image className="w-8 h-8 text-blue-500" />
                      }
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-gray-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewFile({ file_url: uploadedFileUrl, name: uploadedFile.name, file_type: fileType })}
                    >
                      <Eye className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                      {t("preview")}
                    </Button>
                  </div>
                )}
                
                {(analyzing || step === "uploading") && (
                  <div className="mt-6">
                    <ProgressSteps step={step} isRTL={isRTL} />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Match Results */}
            {matchResults && !analyzing && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    {t("matchResults")}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">
                      <Globe className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} />
                      {matchResults.analysis.country || t("unknown")}
                    </Badge>
                    <Badge variant="outline">
                      {DOCUMENT_TYPES_T[matchResults.analysis.document_type] || matchResults.analysis.document_type}
                    </Badge>
                    {matchResults.analysis.issuing_authority && (
                      <Badge variant="outline" className="text-xs">
                        {matchResults.analysis.issuing_authority}
                      </Badge>
                    )}
                  </div>
                  {matchResults.analysis.summary && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        {isRTL ? "📝 ملخص المستند:" : "📝 Document Summary:"}
                      </p>
                      <p className="text-sm text-gray-700">{matchResults.analysis.summary}</p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {matchResults.matches.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>{t("noMatchFound")}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Top Match - Highlighted */}
                      {topMatch && (
                        <div className={`p-4 rounded-xl border-2 transition-all ${
                          selectedMatch?.template.id === topMatch.template.id 
                            ? "border-green-500 bg-green-50" 
                            : "border-blue-300 bg-blue-50"
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className="bg-blue-600">Top 1</Badge>
                            <span className="text-sm text-gray-500">{t("bestMatch")}</span>
                          </div>
                          
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              {topMatch.template.file_type === 'pdf' ? 
                                <FileText className="w-10 h-10 text-red-500" /> : 
                                <Image className="w-10 h-10 text-blue-500" />
                              }
                              <div>
                                <h3 className="font-bold text-lg">{topMatch.template.original_name || topMatch.template.name}</h3>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {topMatch.template.country}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {DOCUMENT_TYPES_T[topMatch.template.document_type]}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className={isRTL ? "text-left" : "text-right"}>
                              <div className="text-3xl font-bold text-blue-600">{topMatch.score}%</div>
                              <Progress value={topMatch.score} className="w-24 h-2" />
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3 bg-white/50 rounded p-2">
                            {topMatch.reasons.join(" • ")}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setPreviewFile(topMatch.template)}
                            >
                              <Eye className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                              {t("preview")}
                            </Button>
                            {topMatch.template.file_url && (
                              <a href={topMatch.template.file_url} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm">
                                  <Download className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                                  {t("openFile")}
                                </Button>
                              </a>
                            )}
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSelectTemplate(topMatch)}
                            >
                              <ThumbsUp className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                              {isRTL ? "هذا الصحيح" : "Correct"}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-gray-400"
                              onClick={() => handleMarkIncorrect(topMatch)}
                            >
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Other Matches */}
                      {otherMatches.length > 0 && (
                        <div>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between"
                            onClick={() => setShowAllResults(!showAllResults)}
                          >
                            <span>{t("otherMatches")} ({otherMatches.length})</span>
                            {showAllResults ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                          
                          {showAllResults && (
                            <div className="space-y-3 mt-3">
                              {otherMatches.map((match, idx) => (
                                <div 
                                  key={match.template.id}
                                  className={`p-3 rounded-lg border transition-all ${
                                    selectedMatch?.template.id === match.template.id 
                                      ? "border-green-500 bg-green-50" 
                                      : "border-gray-200 hover:border-blue-300"
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                      <Badge variant="outline">#{idx + 2}</Badge>
                                      {match.template.file_type === 'pdf' ? 
                                        <FileText className="w-6 h-6 text-red-500" /> : 
                                        <Image className="w-6 h-6 text-blue-500" />
                                      }
                                      <div>
                                        <p className="font-medium">{match.template.original_name || match.template.name}</p>
                                        <p className="text-xs text-gray-500">{match.reasons.slice(0, 2).join(" • ")}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg font-bold text-gray-600">{match.score}%</span>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => setPreviewFile(match.template)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="text-green-600"
                                        onClick={() => handleSelectTemplate(match)}
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t("recentMatches")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentHistory.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">{t("noRecentActivity")}</p>
                ) : (
                  <div className="space-y-2">
                    {recentHistory.slice(0, 5).map(h => (
                      <div key={h.id} className="text-sm p-2 bg-gray-50 rounded">
                        <p className="font-medium line-clamp-1">{h.matched_template_name}</p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-400">{h.similarity_score}%</span>
                          {h.is_correct ? 
                            <Check className="w-3 h-3 text-green-500" /> : 
                            <ThumbsDown className="w-3 h-3 text-red-400" />
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  {t("popularTemplates")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {templates
                    .filter(t => t.usage_count > 0)
                    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
                    .slice(0, 5)
                    .map(t => (
                      <div 
                        key={t.id} 
                        className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                        onClick={() => setPreviewFile(t)}
                      >
                        <span className="line-clamp-1 flex-1">{t.original_name || t.name}</span>
                        <Badge variant="secondary" className="mr-2">{t.usage_count}</Badge>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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