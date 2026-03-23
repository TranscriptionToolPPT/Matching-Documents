import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, User, Phone, Mail, FileText, 
  Edit, Trash2, Eye, MessageCircle, Copy, Check,
  ChevronDown, ChevronUp, UserPlus, Clock, Download
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import CustomerDetail from "@/components/customers/CustomerDetail";

export default function Customers() {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const exportCSV = () => {
    const rows = [
      ["الاسم", "الهاتف", "واتساب", "الإيميل", "الطلبات", "ملاحظات"],
      ...filteredCustomers.map(c => [
        c.name, c.phone || "", c.whatsapp || "", c.email || "",
        c.total_orders || 0, c.notes || ""
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "customers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(search) ||
      c.phone?.includes(search) ||
      c.whatsapp?.includes(search) ||
      c.email?.toLowerCase().includes(search) ||
      c.passport_names?.some(p => 
        p.name_ar?.includes(search) || 
        p.name_en?.toLowerCase().includes(search)
      )
    );
  });

  if (selectedCustomer) {
    return (
      <CustomerDetail 
        customer={selectedCustomer} 
        onBack={() => setSelectedCustomer(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isRTL ? "قاعدة بيانات العملاء" : "Customer Database"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {customers.length} {isRTL ? "عميل" : "customers"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} disabled={filteredCustomers.length === 0}>
              <Download className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {isRTL ? "تصدير CSV" : "Export CSV"}
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {isRTL ? "إضافة عميل" : "Add Customer"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir={isRTL ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle>{isRTL ? "إضافة عميل جديد" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <CustomerForm 
                onSubmit={(data) => createMutation.mutate(data)}
                loading={createMutation.isPending}
                isRTL={isRTL}
              />
            </DialogContent>
          </Dialog>
          </div>
          </div>

          {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <Input
                placeholder={isRTL ? "بحث بالاسم أو الرقم أو أسماء الباسبور..." : "Search by name, phone, or passport names..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? "pr-10" : "pl-10"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{isRTL ? "لا يوجد عملاء" : "No customers found"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(customer => (
              <Card 
                key={customer.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{customer.name}</CardTitle>
                        {customer.phone && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(isRTL ? "هل تريد حذف هذا العميل؟" : "Delete this customer?")) {
                          deleteMutation.mutate(customer.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {customer.whatsapp && (
                      <Badge variant="secondary" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Badge>
                    )}
                    {customer.passport_names?.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {customer.passport_names.length} {isRTL ? "اسم" : "names"}
                      </Badge>
                    )}
                    {customer.total_orders > 0 && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {customer.total_orders} {isRTL ? "طلب" : "orders"}
                      </Badge>
                    )}
                  </div>
                  {customer.passport_names?.length > 0 && (
                    <div className="text-xs text-gray-500 truncate">
                      {customer.passport_names[0].name_ar || customer.passport_names[0].name_en}
                      {customer.passport_names.length > 1 && ` (+${customer.passport_names.length - 1})`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerForm({ initialData, onSubmit, loading, isRTL }) {
  const [formData, setFormData] = useState(initialData || {
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    notes: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>{isRTL ? "اسم العميل *" : "Customer Name *"}</Label>
        <Input 
          value={formData.name} 
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{isRTL ? "رقم الهاتف" : "Phone"}</Label>
          <Input 
            value={formData.phone} 
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label>{isRTL ? "واتساب" : "WhatsApp"}</Label>
          <Input 
            value={formData.whatsapp} 
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>{isRTL ? "البريد الإلكتروني" : "Email"}</Label>
        <Input 
          type="email"
          value={formData.email} 
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
        <Textarea 
          value={formData.notes} 
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ" : "Save")}
      </Button>
    </form>
  );
}