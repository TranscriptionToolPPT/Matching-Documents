import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, FileText, Search, Upload, Globe, Users, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import GlobalSearch from "@/components/GlobalSearch";

function LayoutContent({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navItems = [
  { name: "Home", labelKey: "home", icon: Home },
  { name: "Customers", labelKey: "customers", icon: Users },
  { name: "Upload", labelKey: "upload", icon: Upload },
  { name: "RecentUploads", labelKey: "recentUploads", icon: Clock },
  { name: "MatchTemplate", labelKey: "match", icon: Search },
  { name: "Templates", labelKey: "templates", icon: FileText }];


  const CollapseIcon = isRTL ?
  collapsed ? ChevronLeft : ChevronRight :
  collapsed ? ChevronRight : ChevronLeft;

  return (
    <div className="min-h-screen flex bg-gray-50" dir={isRTL ? "rtl" : "ltr"}>
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="relative bg-white border-e border-gray-200 flex flex-col shrink-0 z-40 shadow-sm"
        style={{ minHeight: "100vh" }}>

        {/* Logo */}
        <div className="flex items-center gap-3 h-14 px-3 border-b border-gray-100 overflow-hidden">
          <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed &&
            <motion.span
              key="logo-text"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="font-bold text-gray-900 text-sm whitespace-nowrap overflow-hidden">

                {t("appName")}
              </motion.span>
            }
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="bg-[#dfd5a5] px-2 py-3 flex-1 flex flex-col gap-1">
          {navItems.map((navItem) => {
            const Icon = navItem.icon;
            const isActive = currentPath === createPageUrl(navItem.name);
            return (
              <Link
                key={navItem.name}
                to={createPageUrl(navItem.name)}
                title={collapsed ? t(navItem.labelKey) : undefined}
                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors overflow-hidden ${
                isActive ?
                "bg-blue-50 text-blue-600" :
                "text-gray-600 hover:bg-gray-100"}`
                }>

                <Icon className="w-5 h-5 shrink-0" />
                <AnimatePresence>
                  {!collapsed &&
                  <motion.span
                    key={navItem.name + "-label"}
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden">

                      {t(navItem.labelKey)}
                    </motion.span>
                  }
                </AnimatePresence>
              </Link>);

          })}
        </nav>

        {/* Language Toggle - TOP */}
        <div className="px-2 pt-2 border-b border-gray-100 pb-2">
          <button
            onClick={toggleLanguage}
            title={collapsed ? language === "en" ? "عربي" : "English" : undefined}
            className="flex items-center gap-3 w-full px-2.5 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors overflow-hidden">

            <Globe className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed &&
              <motion.span
                key="lang-label-top"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden">

                  {language === "en" ? "عربي" : "English"}
                </motion.span>
              }
            </AnimatePresence>
          </button>
        </div>

        {/* Search Button */}
        <div className="px-2 pb-2">
          <button
            onClick={() => setSearchOpen(true)}
            title={collapsed ? isRTL ? "بحث Ctrl+K" : "Search Ctrl+K" : undefined}
            className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors overflow-hidden">

            <Search className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed &&
              <motion.span
                key="search-label"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden flex items-center gap-2">

                  {isRTL ? "بحث" : "Search"}
                  <span className="text-xs text-gray-300 bg-gray-100 px-1 rounded">⌘K</span>
                </motion.span>
              }
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -end-3 top-16 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-50">

          <CollapseIcon className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>);

}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>);

}