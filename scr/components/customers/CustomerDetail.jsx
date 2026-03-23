import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowRight, ArrowLeft, User, Phone, Mail, MessageCircle, 
  Plus, Trash2, Copy, Check, Edit, FileText, Upload,
  Save, X, Eye
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import FilePreview from "@/components/FilePreview";

export default function CustomerDetail({ customer, onBack }) {
  const { t, isRTL } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(customer);
  const [copiedField, setCopiedField] = useState(null);
  const [newName, setNewName] = useState({ name_ar: "", name_en: "", passport_number: "", relation: "" });
  const [newData, setNewData] = useState({ label: "", value: "" });
  const [previewFile, setPreviewFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.update(customer.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsEditing(false);
    },
  });

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const addPassportName = () => {
    if (!newName.name_ar && !newName.name_en) return;
    const names = [...(editData.passport_names || []), newName];
    setEditData({ ...editData, passport_names: names });
    setNewName({ name_ar: "", name_en: "", passport_number: "", relation: "" });
  };

  const removePassportName = (idx) => {
    const names = editData.passport_names.filter((_, i) => i !== idx);
    setEditData({ ...editData, passport_names: names });
  };

  const addSavedData = () => {
    if (!newData.label || !newData.value) return;
    const data = [...(editData.saved_data || []), newData];
    setEditData({ ...editData, saved_data: data });
    setNewData({ label: "", value: "" });
  };

  const removeSavedData = (idx) => {
    const data = editData.saved_data.filter((_, i) => i !== idx);
    setEditData({ ...editData, saved_data: data });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const files = [...(editData.files || []), { 
      name: file.name, 
      url: file_url,
      type: file.name.split('.').pop().toLowerCase()
    }];
    setEditData({ ...editData, files });
    setUploading(false);
  };

  const removeFile = (idx) => {
    const files = editData.files.filter((_, i) => i !== idx);
    setEditData({ ...editData, files });
  };

  const handleSave = () => {
    updateMutation.mutate(editData);
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <BackArrow className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex gap-2 text-sm text-gray-500">
                  {customer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>}
                  {customer.whatsapp && <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{customer.whatsapp}</span>}
                </div>
              </div>
            </div>
          </div>
          
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditData(customer); }}>
                <X className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                {isRTL ? "حفظ" : "Save"}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className={`w-4 h-4 ${isRTL ? "ml-1" : "mr-1"}`} />
              {isRTL ? "تعديل" : "Edit"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passport Names */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                {isRTL ? "الأسماء المعتمدة (الباسبور)" : "Passport Names"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(isEditing ? editData : customer).passport_names?.length > 0 ? (
                <div className="space-y-3">
                  {(isEditing ? editData : customer).passport_names.map((name, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-xs">
                          {name.relation || (isRTL ? "غير محدد" : "Not specified")}
                        </Badge>
                        <div className="flex gap-1">
                          {!isEditing && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(`${name.name_ar}\n${name.name_en}`, `name-${idx}`)}
                            >
                              {copiedField === `name-${idx}` ? 
                                <Check className="w-3 h-3 text-green-500" /> : 
                                <Copy className="w-3 h-3" />
                              }
                            </Button>
                          )}
                          {isEditing && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500"
                              onClick={() => removePassportName(idx)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-lg">{name.name_ar}</p>
                      <p className="text-gray-600">{name.name_en}</p>
                      {name.passport_number && (
                        <p className="text-xs text-gray-400 mt-1">
                          {isRTL ? "باسبور:" : "Passport:"} {name.passport_number}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {isRTL ? "لا توجد أسماء محفوظة" : "No saved names"}
                </p>
              )}
              
              {isEditing && (
                <div className="mt-4 p-3 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm font-medium mb-2">{isRTL ? "إضافة اسم جديد" : "Add New Name"}</p>
                  <div className="space-y-2">
                    <Input 
                      placeholder={isRTL ? "الاسم بالعربي" : "Arabic Name"}
                      value={newName.name_ar}
                      onChange={(e) => setNewName({ ...newName, name_ar: e.target.value })}
                    />
                    <Input 
                      placeholder={isRTL ? "الاسم بالإنجليزي" : "English Name"}
                      value={newName.name_en}
                      onChange={(e) => setNewName({ ...newName, name_en: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder={isRTL ? "رقم الباسبور" : "Passport #"}
                        value={newName.passport_number}
                        onChange={(e) => setNewName({ ...newName, passport_number: e.target.value })}
                      />
                      <Input 
                        placeholder={isRTL ? "صلة القرابة" : "Relation"}
                        value={newName.relation}
                        onChange={(e) => setNewName({ ...newName, relation: e.target.value })}
                      />
                    </div>
                    <Button type="button" variant="outline" className="w-full" onClick={addPassportName}>
                      <Plus className="w-4 h-4 mr-1" />
                      {isRTL ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-500" />
                {isRTL ? "بيانات محفوظة" : "Saved Data"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(isEditing ? editData : customer).saved_data?.length > 0 ? (
                <div className="space-y-2">
                  {(isEditing ? editData : customer).saved_data.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <p className="font-medium">{item.value}</p>
                      </div>
                      <div className="flex gap-1">
                        {!isEditing && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(item.value, `data-${idx}`)}
                          >
                            {copiedField === `data-${idx}` ? 
                              <Check className="w-3 h-3 text-green-500" /> : 
                              <Copy className="w-3 h-3" />
                            }
                          </Button>
                        )}
                        {isEditing && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-red-500"
                            onClick={() => removeSavedData(idx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {isRTL ? "لا توجد بيانات محفوظة" : "No saved data"}
                </p>
              )}
              
              {isEditing && (
                <div className="mt-4 p-3 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-sm font-medium mb-2">{isRTL ? "إضافة بيانات" : "Add Data"}</p>
                  <div className="space-y-2">
                    <Input 
                      placeholder={isRTL ? "الوصف (مثل: العنوان)" : "Label (e.g., Address)"}
                      value={newData.label}
                      onChange={(e) => setNewData({ ...newData, label: e.target.value })}
                    />
                    <Input 
                      placeholder={isRTL ? "القيمة" : "Value"}
                      value={newData.value}
                      onChange={(e) => setNewData({ ...newData, value: e.target.value })}
                    />
                    <Button type="button" variant="outline" className="w-full" onClick={addSavedData}>
                      <Plus className="w-4 h-4 mr-1" />
                      {isRTL ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Files */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-500" />
                {isRTL ? "ملفات محفوظة" : "Saved Files"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(isEditing ? editData : customer).files?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(isEditing ? editData : customer).files.map((file, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => setPreviewFile({ file_url: file.url, name: file.name, file_type: file.type })}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {isEditing && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-500"
                              onClick={() => removeFile(idx)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  {isRTL ? "لا توجد ملفات" : "No files"}
                </p>
              )}
              
              {isEditing && (
                <div className="mt-4">
                  <Input 
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">{isRTL ? "جاري الرفع..." : "Uploading..."}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(customer.notes || isEditing) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">{isRTL ? "ملاحظات" : "Notes"}</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea 
                    value={editData.notes || ""}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <FilePreview 
          file={previewFile} 
          isOpen={!!previewFile} 
          onClose={() => setPreviewFile(null)} 
        />
      </div>
    </div>
  );
}