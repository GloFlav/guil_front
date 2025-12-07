// AppSidebar.jsx - VERSION SIMPLIFIÉE

import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/Sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/Collapsible";
import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { menu_principal } from "./constant";
import { useIsMobile } from "@/hooks/useIsMobile";

const AppSidebar = () => {
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const isDeviceMobile = useIsMobile();

  const handleLinkClick = () => {
    if (isDeviceMobile) {
      setOpenMobile(false);
    }
  };

  // ===== MENU MOBILE =====
  const MobileBottomMenu = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex justify-around items-center py-2">
          {menu_principal.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.url;

            return (
              <Link
                key={item.title}
                to={item.url}
                onClick={handleLinkClick}
                className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors ${
                  isActive ? "text-[#5DA781]" : "text-gray-600 hover:text-[#5DA781]"
                }`}
              >
                <Icon size={20} />
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // ===== RENDU DESKTOP =====
  const renderMenu = () => {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {menu_principal.map((item) =>
              item.items ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link
                                to={subItem.url}
                                onClick={handleLinkClick}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition hover:text-green-400 active:text-helloSoin ${
                                  location.pathname === subItem.url
                                    ? "text-helloSoin bg-gray-100"
                                    : "text-gray-700"
                                }`}
                              >
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={item.url}
                      onClick={handleLinkClick}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition hover:text-green-400 active:text-helloSoin ${
                        location.pathname === item.url
                          ? "text-helloSoin bg-gray-100"
                          : "text-gray-700"
                      }`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // ===== RENDU FINAL =====
  if (isDeviceMobile) {
    return <MobileBottomMenu />;
  }

  return (
    <Sidebar collapsible="icon" className="z-20 overflow-x-hidden">
      <SidebarContent className="bg-white overflow-x-hidden">
        {renderMenu()}
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail title="" className="hover:bg-gray-50" />
    </Sidebar>
  );
};

export default AppSidebar;