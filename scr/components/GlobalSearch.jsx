import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Users, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";

export default function GlobalSearch({ open, onClose }) {
  const { isRTL } = useLanguage();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-usage_count', 1000),
    enabled: open,
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 500),
    enabled: open,
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const q = query.toLowerCase();

  const matchedTemplates = q.length > 1 ? templates.filter(t =>
    t.name?.toLowerCase().includes(q) ||
    t.original_name?.toLowerCase().includes(q) ||
    t.country?.toLowerCase().includes(q) ||
    t.keywords?.some(k => k.toLowerCase().includes(q)) ||
    t.issuing_authority?.toLowerCase().includes(q)
  ).slice(0, 5) : [];

  const matchedCustomers = q.length > 1 ? customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.phone?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.passport_names?.some(p => p.name_ar?.includes(q) || p.name_en?.toLowerCase().includes(q))
  ).slice(0, 5) : [];

  const total = matchedTemplates.length + matchedCustomers.length;

  const goTo = (page) => {
    navigate(createPageUrl(page));
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <Input
            autoFocus
            placeholder={isRTL ? "ابحث في النماذج والعملاء..." : "Search templates & customers..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-base bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {q.length > 1 ? (
          <div className="max-h-96 overflow-y-auto p-2 pb-4">
            {total === 0 ? (
              <p className="text-center text-gray-400 py-10 text-sm">
                {isRTL ? "لا توجد نتائج" : "No results found"}
              </p>
            ) : (
              <div className="space-y-3">
                {matchedTemplates.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                      {isRTL ? "النماذج" : "Templates"} ({matchedTemplates.length})
                    </p>
                    {matchedTemplates.map(t => (
                      <button key={t.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 text-start transition-colors"
                        onClick={() => goTo("Templates")}
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{t.original_name || t.name}</p>
                          <p className="text-xs text-gray-400">{t.country}</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{t.document_type?.replace(/_/g, ' ')}</Badge>
                      </button>
                    ))}
                  </div>
                )}
                {matchedCustomers.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
                      {isRTL ? "العملاء" : "Customers"} ({matchedCustomers.length})
                    </p>
                    {matchedCustomers.map(c => (
                      <button key={c.id}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 text-start transition-colors"
                        onClick={() => goTo("Customers")}
                      >
                        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                          {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-200" />
            {isRTL ? "ابدأ الكتابة للبحث في كل شيء..." : "Start typing to search everything..."}
            <p className="text-xs mt-1 text-gray-300">{isRTL ? "Ctrl+K" : "Ctrl+K"}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}