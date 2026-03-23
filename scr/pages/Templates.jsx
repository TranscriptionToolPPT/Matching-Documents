import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Search, FileText, Download, Trash2, Edit,
  Filter, X, Globe, File, Clock, Star, Eye,
  ChevronDown, ChevronRight, Folder, Image, Sheet } from
"lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FilePreview from "@/components/FilePreview";
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

const COUNTRIES = [
"مصر", "لبنان", "سوريا", "الأردن", "فلسطين", "العراق", "السعودية", "الإمارات",
"الكويت", "قطر", "البحرين", "عمان", "اليمن", "السودان", "ليبيا", "تونس",
"الجزائر", "المغرب", "موريتانيا", "أمريكا", "بريطانيا", "فرنسا", "ألمانيا",
"إيطاليا", "إسبانيا", "تركيا", "إيران", "الهند", "الصين", "أخرى"];


export default function Templates() {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterDocType, setFilterDocType] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [viewMode, setViewMode] = useState("catalog"); // "catalog" | "list"
  const [expandedCountries, setExpandedCountries] = useState({});

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

  const LANGUAGES_T = {
    arabic: t("arabic"),
    english: t("english"),
    french: t("french"),
    german: t("german"),
    spanish: t("spanish"),
    italian: t("italian"),
    other: t("other")
  };

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-usage_count', 1000)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Template.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsAddOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Template.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setEditingTemplate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Template.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] })
  });

  const exportCSV = () => {
    const rows = [
    ["الاسم", "اسم الملف", "الدولة", "نوع المستند", "اللغة", "جهة الإصدار", "عدد الاستخدامات"],
    ...filteredTemplates.map((tp) => [
    tp.name, tp.original_name || "", tp.country, tp.document_type, tp.language,
    tp.issuing_authority || "", tp.usage_count || 0]
    )];

    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");a.href = url;a.download = "templates.csv";a.click();
    URL.revokeObjectURL(url);
  };

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = !searchTerm ||
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.keywords?.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase())) ||
    t.issuing_authority?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.original_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = filterCountry === "all" || t.country === filterCountry;
    const matchesDocType = filterDocType === "all" || t.document_type === filterDocType;
    const matchesLanguage = filterLanguage === "all" || t.language === filterLanguage;

    return matchesSearch && matchesCountry && matchesDocType && matchesLanguage;
  });

  // Group by country and document type for catalog view
  const catalogData = useMemo(() => {
    const grouped = {};
    filteredTemplates.forEach((t) => {
      const country = t.country || (isRTL ? "غير محدد" : "Unknown");
      const docType = t.document_type || "other";

      if (!grouped[country]) grouped[country] = {};
      if (!grouped[country][docType]) grouped[country][docType] = [];
      grouped[country][docType].push(t);
    });
    return grouped;
  }, [filteredTemplates]);

  const toggleCountry = (country) => {
    setExpandedCountries((prev) => ({
      ...prev,
      [country]: !prev[country]
    }));
  };

  const handleFileUpload = async (file, setFormData, formData) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const ext = file.name.split('.').pop().toLowerCase();
    let file_type = "text";
    if (ext === "pdf") file_type = "pdf";else
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) file_type = "image";

    setFormData({
      ...formData,
      file_url,
      file_type,
      original_name: file.name
    });
    setUploading(false);
  };

  const getFileIcon = (template) => {
    if (template.file_type === 'pdf') return <FileText className="w-4 h-4 text-red-500" />;
    if (template.file_type === 'image') return <Image className="w-4 h-4 text-blue-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#fcb878] mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("templatesTitle")}</h1>
            <p className="text-gray-500 text-sm mt-1">{templates.length} {t("templates")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={filteredTemplates.length === 0}>
              <Download className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "تصدير CSV" : "Export CSV"}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t("addTemplate")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle>{t("addTemplate")}</DialogTitle>
              </DialogHeader>
              <TemplateForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  onFileUpload={handleFileUpload}
                  uploading={uploading}
                  loading={createMutation.isPending}
                  t={t}
                  isRTL={isRTL} />

            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
                  <Input
                    placeholder={t("searchTemplates")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRTL ? "pr-10" : "pl-10"} />

                </div>
              </div>
              
              <Select value={filterCountry} onValueChange={setFilterCountry}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("country")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCountries")}</SelectItem>
                  {COUNTRIES.map((c) =>
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Select value={filterDocType} onValueChange={setFilterDocType}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("documentType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTypes")}</SelectItem>
                  {Object.entries(DOCUMENT_TYPES_T).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder={t("language")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allLanguages")}</SelectItem>
                  {Object.entries(LANGUAGES_T).map(([k, v]) =>
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <Tabs value={viewMode} onValueChange={setViewMode} className={isRTL ? "mr-auto" : "ml-auto"}>
                <TabsList className="h-9">
                  <TabsTrigger value="catalog" className="text-xs">{t("catalogView")}</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">{t("listView")}</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {(filterCountry !== "all" || filterDocType !== "all" || filterLanguage !== "all" || searchTerm) &&
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCountry("all");
                  setFilterDocType("all");
                  setFilterLanguage("all");
                }}>

                  <X className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                  {t("close")}
                </Button>
              }
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ?
        <div className="text-center py-12 text-gray-500">{t("loading")}</div> :
        filteredTemplates.length === 0 ?
        <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t("noTemplatesFound")}</p>
          </div> :
        viewMode === "catalog" ? (
        /* Catalog View - Grouped by Country > Document Type */
        <div className="space-y-4">
            {Object.entries(catalogData).sort().map(([country, docTypes]) =>
          <Card key={country} className="overflow-hidden">
                <CardHeader
              className="py-4 cursor-pointer hover:bg-blue-50/50 transition-colors border-b"
              onClick={() => toggleCountry(country)}>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{country}</CardTitle>
                        <p className="text-sm text-gray-500">
                          {Object.keys(docTypes).length} {t("categories")} • {Object.values(docTypes).flat().length} {t("templates")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-700">
                        {Object.values(docTypes).flat().length}
                      </Badge>
                      {expandedCountries[country] ?
                  <ChevronDown className="w-5 h-5 text-gray-400" /> :
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                  }
                    </div>
                  </div>
                </CardHeader>
                
                {expandedCountries[country] &&
            <CardContent className="p-0">
                    <div className="divide-y">
                      {Object.entries(docTypes).map(([docType, items]) =>
                <div key={docType} className="p-4 hover:bg-gray-50/50">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                              <Folder className="w-4 h-4 text-yellow-600" />
                            </div>
                            <span className="font-semibold">{DOCUMENT_TYPES_T[docType] || docType}</span>
                            <Badge variant="outline">{items.length}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mr-11">
                            {items.map((template) =>
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md hover:border-blue-200 transition-all group">

                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        template.file_type === 'pdf' ? 'bg-red-100' : 'bg-blue-100'}`
                        }>
                                    {template.file_type === 'pdf' ?
                          <FileText className="w-4 h-4 text-red-500" /> :
                          <Image className="w-4 h-4 text-blue-500" />
                          }
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate block">{template.original_name || template.name}</span>
                                    {template.issuing_authority &&
                          <span className="text-xs text-gray-400 truncate block">{template.issuing_authority}</span>
                          }
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {template.file_url &&
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {e.stopPropagation();setPreviewFile(template);}}>

                                      <Eye className="w-4 h-4" />
                                    </Button>
                        }
                                  <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {e.stopPropagation();setEditingTemplate(template);}}>

                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={(e) => {e.stopPropagation();deleteMutation.mutate(template.id);}}>

                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                    )}
                          </div>
                        </div>
                )}
                    </div>
                  </CardContent>
            }
              </Card>
          )}
          </div>) : (

        /* List/Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) =>
          <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getFileIcon(template)}
                      <CardTitle className="text-sm font-medium line-clamp-2">
                        {template.original_name || template.name}
                      </CardTitle>
                    </div>
                    <div className="flex gap-1">
                      {template.file_url &&
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPreviewFile(template)}>

                          <Eye className="w-3 h-3" />
                        </Button>
                  }
                      <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setEditingTemplate(template)}>

                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500"
                    onClick={() => deleteMutation.mutate(template.id)}>

                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Globe className="w-3 h-3 ml-1" />
                      {template.country}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {DOCUMENT_TYPES_T[template.document_type]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {template.usage_count || 0}
                    </span>
                    {template.file_url &&
                <a
                  href={template.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1">

                        <Download className="w-3 h-3" />
                        {t("download")}
                      </a>
                }
                  </div>
                </CardContent>
              </Card>
          )}
          </div>)
        }

        {/* Edit Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("editTemplate")}</DialogTitle>
            </DialogHeader>
            {editingTemplate &&
            <TemplateForm
              initialData={editingTemplate}
              onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })}
              onFileUpload={handleFileUpload}
              uploading={uploading}
              loading={updateMutation.isPending}
              t={t}
              isRTL={isRTL} />

            }
          </DialogContent>
        </Dialog>

        {/* File Preview */}
        <FilePreview
          file={previewFile}
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)} />

      </div>
    </div>);

}

function TemplateForm({ initialData, onSubmit, onFileUpload, uploading, loading, t, isRTL }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    original_name: "",
    country: "",
    document_type: "",
    language: "arabic",
    file_url: "",
    file_type: "",
    issuing_authority: "",
    keywords: [],
    tags: [],
    notes: ""
  });
  const [keywordInput, setKeywordInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords?.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keywordInput.trim()]
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter((k) => k !== kw) || []
    });
  };

  const DOCUMENT_TYPES_FORM = {
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

  const LANGUAGES_FORM = {
    arabic: t("arabic"),
    english: t("english"),
    french: t("french"),
    german: t("german"),
    spanish: t("spanish"),
    italian: t("italian"),
    other: t("other")
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>{t("templateName")} *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("exampleName")}
            required />

        </div>
        
        <div>
          <Label>{t("country")} *</Label>
          <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) =>
              <SelectItem key={c} value={c}>{c}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>{t("documentType")} *</Label>
          <Select value={formData.document_type} onValueChange={(v) => setFormData({ ...formData, document_type: v })}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPES_FORM).map(([k, v]) =>
              <SelectItem key={k} value={k}>{v}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>{t("language")} *</Label>
          <Select value={formData.language} onValueChange={(v) => setFormData({ ...formData, language: v })}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGES_FORM).map(([k, v]) =>
              <SelectItem key={k} value={k}>{v}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>{t("issuingAuthority")}</Label>
          <Input
            value={formData.issuing_authority}
            onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
            placeholder={t("exampleAuthority")} />

        </div>
        
        <div className="col-span-2">
          <Label>{isRTL ? "ملف النموذج" : "Template File"}</Label>
          <Input
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onFileUpload(e.target.files[0], setFormData, formData);
              }
            }}
            accept=".pdf,.jpg,.jpeg,.png" />

          {uploading && <p className="text-sm text-gray-500 mt-1">{t("uploading")}</p>}
          {formData.file_url &&
          <a href={formData.file_url} target="_blank" className="text-sm text-blue-600 hover:underline mt-1 block">
              {t("viewUploadedFile")}
            </a>
          }
        </div>
        
        <div className="col-span-2">
          <Label>{t("keywords")}</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder={t("addKeyword")}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())} />

            <Button type="button" variant="outline" onClick={addKeyword}>{t("addKeywordBtn")}</Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {formData.keywords?.map((kw) =>
            <Badge key={kw} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(kw)}>
                {kw} <X className={`w-3 h-3 ${isRTL ? "mr-1" : "ml-1"}`} />
              </Badge>
            )}
          </div>
        </div>
        
        <div className="col-span-2">
          <Label>{t("notes")}</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t("anyNotes")}
            rows={3} />

        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading || uploading}>
        {loading ? t("loading") : t("save")}
      </Button>
    </form>);

}