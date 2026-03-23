import React from "react";
import { CloudUpload, ScanText, GitCompare, CheckCircle2, Loader2 } from "lucide-react";

const STEPS = [
  { key: "uploading", icon: CloudUpload, labelAr: "رفع الملف", labelEn: "Uploading" },
  { key: "analyzing", icon: ScanText,   labelAr: "تحليل المستند", labelEn: "Analyzing" },
  { key: "matching",  icon: GitCompare, labelAr: "مطابقة النماذج", labelEn: "Matching" },
  { key: "done",      icon: CheckCircle2, labelAr: "اكتمل", labelEn: "Done" },
];

const ORDER = ["uploading", "analyzing", "matching", "done"];

export default function ProgressSteps({ step, isRTL }) {
  const currentIdx = ORDER.indexOf(step);

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const pending = idx > currentIdx;
        const Icon = s.icon;

        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                done    ? "bg-green-100 text-green-600" :
                active  ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300 ring-offset-1" :
                          "bg-gray-100 text-gray-300"
              }`}>
                {active ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={`text-xs font-medium ${
                done ? "text-green-600" : active ? "text-blue-600" : "text-gray-300"
              }`}>
                {isRTL ? s.labelAr : s.labelEn}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mb-4 rounded transition-all duration-500 ${
                idx < currentIdx ? "bg-green-400" : "bg-gray-200"
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}