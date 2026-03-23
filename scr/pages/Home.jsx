import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  FileText, Search, Upload, FolderOpen, 
  TrendingUp, Clock, Star, ArrowLeft, ArrowRight,
  Users, CheckCircle, Activity, Zap
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <motion.div variants={item}>
      <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow duration-300">
        <CardContent className="p-0">
          <div className={`h-1.5 w-full ${color}`} />
          <div className="p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-6 h-6 ${color.replace("bg-", "text-")}`} />
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ActionCard({ to, icon: Icon, iconBg, iconColor, title, description, btnLabel, btnClass, isRTL }) {
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  return (
    <motion.div variants={item}>
      <Link to={to}>
        <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md group">
          <CardContent className="p-8">
            <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-7 h-7 ${iconColor}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-500 mb-5 text-sm leading-relaxed">{description}</p>
            <Button className={btnClass}>
              {btnLabel}
              <Arrow className={`w-4 h-4 ${isRTL ? "mr-2" : "ml-2"}`} />
            </Button>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { t, isRTL } = useLanguage();

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => base44.entities.Template.list('-created_date', 100),
  });
  const { data: history = [] } = useQuery({
    queryKey: ['match-history'],
    queryFn: () => base44.entities.MatchHistory.list('-created_date', 10),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 100),
  });

  const todayMatches = history.filter(h => {
    return new Date(h.created_date).toDateString() === new Date().toDateString();
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t("welcomeTitle")}</h1>
          </div>
          <p className="text-gray-500 mt-1 text-base">{t("welcomeDescription")}</p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={FileText}  value={templates.length} label={t("totalTemplates")}    color="bg-blue-500"   bg="bg-blue-50" />
          <StatCard icon={Users}     value={customers.length} label={t("customers")}         color="bg-violet-500" bg="bg-violet-50" />
          <StatCard icon={TrendingUp} value={[...new Set(templates.map(t => t.country))].length} label={t("countries")} color="bg-emerald-500" bg="bg-emerald-50" />
          <StatCard icon={Clock}     value={todayMatches}     label={t("matchesThisMonth")}  color="bg-amber-500"  bg="bg-amber-50" />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <ActionCard to={createPageUrl("MatchTemplate")} icon={Search}    iconBg="bg-blue-600"   iconColor="text-white" title={t("matchNewDocument")} description={t("matchDescription")} btnLabel={t("startNow")}      btnClass="bg-blue-600 hover:bg-blue-700 text-white" isRTL={isRTL} />
          <ActionCard to={createPageUrl("Upload")}        icon={Upload}    iconBg="bg-indigo-600" iconColor="text-white" title={t("upload")}          description={t("uploadDescription")} btnLabel={t("uploadFiles")} btnClass="bg-indigo-600 hover:bg-indigo-700 text-white" isRTL={isRTL} />
          <ActionCard to={createPageUrl("Customers")}     icon={Users}     iconBg="bg-violet-600" iconColor="text-white" title={t("customers")}       description={isRTL ? "إدارة بيانات العملاء والجوازات" : "Manage clients & passport data"} btnLabel={isRTL ? "فتح" : "Open"} btnClass="bg-violet-600 hover:bg-violet-700 text-white" isRTL={isRTL} />
          <ActionCard to={createPageUrl("Templates")}     icon={FolderOpen} iconBg="bg-emerald-600" iconColor="text-white" title={t("templatesTitle")} description={t("templatesDescription")} btnLabel={t("browseTemplates")} btnClass="bg-emerald-600 hover:bg-emerald-700 text-white" isRTL={isRTL} />
        </motion.div>

        {/* Recent Activity */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 text-lg">{t("recentActivity")}</h3>
                </div>
                <div className="space-y-2">
                  {history.slice(0, 5).map((h, i) => (
                    <motion.div key={h.id} initial={{ opacity: 0, x: isRTL ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                      className="flex justify-between items-center p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-gray-800">{h.uploaded_file_name}</p>
                          <p className="text-xs text-gray-400">{t("matchedWith")} {h.matched_template_name}</p>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{h.similarity_score}%</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}