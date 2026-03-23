import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

export default function FilePreview({ file, isOpen, onClose }) {
  const { t, isRTL } = useLanguage();
  
  if (!file) return null;

  const fileUrl = file.file_url || file.url;
  const fileName = file.name || file.original_name || "File";
  const fileType = file.file_type || detectFileType(fileUrl);

  function detectFileType(url) {
    if (!url) return "unknown";
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    return 'unknown';
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-base truncate max-w-[70%]">{fileName}</DialogTitle>
          <div className="flex items-center gap-2">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                {t("openInNewWindow")}
              </Button>
            </a>
            <a href={fileUrl} download={fileName}>
              <Button variant="outline" size="sm">
                <Download className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                {t("download")}
              </Button>
            </a>
          </div>
        </DialogHeader>
        
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)] bg-gray-100">
          {fileType === 'pdf' ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`}
              className="w-full h-[70vh] rounded-lg border bg-white"
              title={fileName}
            />
          ) : fileType === 'image' ? (
            <div className="flex items-center justify-center">
              <img 
                src={fileUrl} 
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>{t("cannotPreview")}</p>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <Button className="mt-4">{t("openFile")}</Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}