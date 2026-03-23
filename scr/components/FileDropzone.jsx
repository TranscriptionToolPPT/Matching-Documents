import React, { useCallback, useState } from "react";
import { Upload, File, X, Loader2, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/components/LanguageContext";

export default function FileDropzone({ onFilesSelected, multiple = true, accept = ".pdf,.jpg,.jpeg,.png" }) {
  const { t, isRTL } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);
    });
    
    if (droppedFiles.length > 0) {
      if (multiple) {
        setFiles(prev => [...prev, ...droppedFiles]);
      } else {
        setFiles([droppedFiles[0]]);
      }
    }
  }, [multiple]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (multiple) {
      setFiles(prev => [...prev, ...selectedFiles]);
    } else {
      setFiles(selectedFiles.slice(0, 1));
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    const filesToUpload = [...files];
    setFiles([]); // clear immediately so user can add more files right away
    onFilesSelected(filesToUpload);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <Image className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? "border-blue-500 bg-blue-50 scale-[1.02]" 
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }`}
      >
        <input
          type="file"
          onChange={handleFileSelect}
          accept={accept}
          multiple={multiple}
          className="hidden"
          id="file-drop-input"
        />
        <label htmlFor="file-drop-input" className="cursor-pointer block">
          <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragging ? t("dropHere") : t("dragDropFiles")}
          </p>
          <p className="text-sm text-gray-500">
            {t("orClickToSelect")}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            PDF, JPG, PNG {multiple && t("multipleAllowed")}
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {files.length} {t("filesReadyToUpload")}:
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  <div>
                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeFile(idx)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={handleUpload} 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={uploading}
          >
            <>
              <Upload className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t("uploadFiles")} {files.length} {files.length === 1 ? t("file") : t("files")}
            </>
          </Button>
        </div>
      )}
    </div>
  );
}