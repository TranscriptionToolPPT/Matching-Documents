import React, { createContext, useContext, useState, useEffect } from "react";

const translations = {
  en: {
    // Navigation
    home: "Home",
    customers: "Customers",
    upload: "Upload",
    match: "Match",
    templates: "Templates",
    recentUploads: "Recent Uploads",
    appName: "Template Matcher",
    
    // Home page
    welcomeTitle: "Document Template Matcher",
    welcomeDescription: "Upload documents and find matching templates quickly and easily",
    matchNewDocument: "Match New Document",
    browseTemplates: "Browse Templates",
    totalTemplates: "Total Templates",
    matchesThisMonth: "Matches This Month",
    successRate: "Success Rate",
    recentActivity: "Recent Activity",
    noRecentActivity: "No recent activity",
    matchedWith: "Matched with",
    similarity: "Similarity",
    
    // Upload page
    uploadDocuments: "Upload Documents",
    uploadDescription: "Upload documents to analyze and save as templates",
    processing: "Processing",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    dragDropFiles: "Drag and drop files here",
    orClickToSelect: "or click to select files",
    filesReadyToUpload: "files ready to upload",
    uploading: "Uploading and analyzing...",
    uploadFiles: "Upload",
    file: "file",
    files: "files",
    
    // Match page
    matchTitle: "Match Document",
    matchDescription: "Upload a document to find matching templates",
    uploadToMatch: "Upload Document to Match",
    analyzing: "Analyzing...",
    matchResults: "Match Results",
    bestMatch: "Best Match",
    otherMatches: "Other Matches",
    noMatchFound: "No match found",
    useTemplate: "Use Template",
    recentMatches: "Recent Matches",
    popularTemplates: "Popular Templates",
    
    // Templates page
    templatesTitle: "Templates Library",
    templatesDescription: "Browse and manage your document templates",
    addTemplate: "Add Template",
    editTemplate: "Edit Template",
    deleteTemplate: "Delete Template",
    searchTemplates: "Search templates...",
    allCountries: "All Countries",
    allTypes: "All Types",
    allLanguages: "All Languages",
    catalogView: "Catalog View",
    listView: "List View",
    noTemplatesFound: "No templates found",
    
    // Template form
    templateName: "Template Name",
    originalFileName: "Original File Name",
    country: "Country",
    documentType: "Document Type",
    language: "Language",
    issuingAuthority: "Issuing Authority",
    keywords: "Keywords",
    addKeyword: "Add keyword",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    
    // Document types
    birth_certificate: "Birth Certificate",
    marriage_certificate: "Marriage Certificate",
    death_certificate: "Death Certificate",
    divorce_certificate: "Divorce Certificate",
    education_certificate: "Education Certificate",
    power_of_attorney: "Power of Attorney",
    commercial_register: "Commercial Register",
    id_card: "ID Card",
    passport: "Passport",
    court_ruling: "Court Ruling",
    other: "Other",
    
    // Languages
    arabic: "Arabic",
    english: "English",
    french: "French",
    german: "German",
    spanish: "Spanish",
    italian: "Italian",
    
    // File preview
    openInNewWindow: "Open in new window",
    download: "Download",
    cannotPreview: "Cannot preview this file type",
    openFile: "Open File",
    preview: "Preview",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    close: "Close",
    usageCount: "Usage count",
    unknown: "Unknown",
    document: "Document",
    startNow: "Start Now",
    countries: "Countries",
    docTypes: "Doc Types",
    categories: "categories",
    template: "template",
    analyzeAuto: "or image • Will be analyzed automatically",
    dropHere: "Drop files here",
    multipleAllowed: "• Multiple files allowed",
    viewUploadedFile: "View uploaded file",
    addKeywordBtn: "Add",
    anyNotes: "Any additional notes...",
    selectCountry: "Select country",
    selectType: "Select type",
    selectLanguage: "Select language",
    exampleName: "Example: Lebanese Birth Certificate",
    exampleAuthority: "Example: Ministry of Interior",
  },
  ar: {
    // Navigation
    home: "الرئيسية",
    customers: "العملاء",
    upload: "رفع",
    match: "مطابقة",
    templates: "النماذج",
    recentUploads: "آخر الرفع",
    appName: "Template Matcher",
    
    // Home page
    welcomeTitle: "مطابقة نماذج المستندات",
    welcomeDescription: "ارفع المستندات واعثر على النماذج المطابقة بسرعة وسهولة",
    matchNewDocument: "مطابقة مستند جديد",
    browseTemplates: "تصفح النماذج",
    totalTemplates: "إجمالي النماذج",
    matchesThisMonth: "المطابقات هذا الشهر",
    successRate: "نسبة النجاح",
    recentActivity: "النشاط الأخير",
    noRecentActivity: "لا يوجد نشاط حديث",
    matchedWith: "تطابق مع",
    similarity: "التشابه",
    
    // Upload page
    uploadDocuments: "رفع المستندات",
    uploadDescription: "ارفع المستندات لتحليلها وحفظها كنماذج",
    processing: "جاري المعالجة",
    completed: "مكتمل",
    failed: "فشل",
    pending: "في الانتظار",
    dragDropFiles: "اسحب الملفات وأفلتها هنا",
    orClickToSelect: "أو اضغط لاختيار الملفات",
    filesReadyToUpload: "ملفات جاهزة للرفع",
    uploading: "جاري الرفع والتحليل...",
    uploadFiles: "رفع",
    file: "ملف",
    files: "ملفات",
    
    // Match page
    matchTitle: "مطابقة مستند",
    matchDescription: "ارفع مستنداً للبحث عن نماذج مطابقة",
    uploadToMatch: "ارفع مستنداً للمطابقة",
    analyzing: "جاري التحليل...",
    matchResults: "نتائج المطابقة",
    bestMatch: "أفضل تطابق",
    otherMatches: "تطابقات أخرى",
    noMatchFound: "لم يتم العثور على تطابق",
    useTemplate: "استخدام النموذج",
    recentMatches: "المطابقات الأخيرة",
    popularTemplates: "النماذج الشائعة",
    
    // Templates page
    templatesTitle: "مكتبة النماذج",
    templatesDescription: "تصفح وإدارة نماذج المستندات",
    addTemplate: "إضافة نموذج",
    editTemplate: "تعديل النموذج",
    deleteTemplate: "حذف النموذج",
    searchTemplates: "البحث في النماذج...",
    allCountries: "جميع الدول",
    allTypes: "جميع الأنواع",
    allLanguages: "جميع اللغات",
    catalogView: "عرض الكتالوج",
    listView: "عرض القائمة",
    noTemplatesFound: "لم يتم العثور على نماذج",
    
    // Template form
    templateName: "اسم النموذج",
    originalFileName: "اسم الملف الأصلي",
    country: "الدولة",
    documentType: "نوع المستند",
    language: "اللغة",
    issuingAuthority: "جهة الإصدار",
    keywords: "كلمات مفتاحية",
    addKeyword: "إضافة كلمة",
    notes: "ملاحظات",
    save: "حفظ",
    cancel: "إلغاء",
    
    // Document types
    birth_certificate: "شهادة ميلاد",
    marriage_certificate: "عقد زواج",
    death_certificate: "شهادة وفاة",
    divorce_certificate: "وثيقة طلاق",
    education_certificate: "شهادة تعليمية",
    power_of_attorney: "توكيل",
    commercial_register: "سجل تجاري",
    id_card: "بطاقة هوية",
    passport: "جواز سفر",
    court_ruling: "حكم محكمة",
    other: "أخرى",
    
    // Languages
    arabic: "العربية",
    english: "الإنجليزية",
    french: "الفرنسية",
    german: "الألمانية",
    spanish: "الإسبانية",
    italian: "الإيطالية",
    
    // File preview
    openInNewWindow: "فتح في نافذة جديدة",
    download: "تحميل",
    cannotPreview: "لا يمكن معاينة هذا النوع من الملفات",
    openFile: "فتح الملف",
    preview: "معاينة",
    
    // Common
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    confirm: "تأكيد",
    delete: "حذف",
    edit: "تعديل",
    view: "عرض",
    close: "إغلاق",
    usageCount: "عدد الاستخدامات",
    unknown: "غير محدد",
    document: "مستند",
    startNow: "ابدأ الآن",
    countries: "دولة",
    docTypes: "نوع مستند",
    categories: "تصنيف",
    template: "نموذج",
    analyzeAuto: "أو صورة • سيتم تحليلها تلقائياً",
    dropHere: "أفلت الملفات هنا",
    multipleAllowed: "• يمكن رفع عدة ملفات",
    viewUploadedFile: "عرض الملف المرفوع",
    addKeywordBtn: "إضافة",
    anyNotes: "أي ملاحظات إضافية...",
    selectCountry: "اختر الدولة",
    selectType: "اختر النوع",
    selectLanguage: "اختر اللغة",
    exampleName: "مثال: شهادة ميلاد لبنانية - وزارة الداخلية",
    exampleAuthority: "مثال: وزارة الداخلية",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("app_language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("app_language", language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === "en" ? "ar" : "en");
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}