import { useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/Sidebar";
import hello_soin from "@/assets/main_logo.png";
import { ROUTE_SECRETAIRE_HOME } from '@/components/common/secretaire.constants'

const AppSidebarHeader = () => {
    const [userAuth, setUserAuth] = useState({
        role: null,
        roles: [],
        isValid: false,
        userId: null
    });
    
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                if (decoded.exp && decoded.exp < currentTime) {
                    localStorage.removeItem('authToken');
                    setUserAuth({ role: null, roles: [], isValid: false, userId: null });
                    return;
                }
                
                const role = decoded?.role ?? null;
                const roles = Array.isArray(decoded?.roles)
                  ? decoded.roles
                  : [decoded?.roles].filter(Boolean);
                const userId = decoded?.sub || decoded?.userId || decoded?.id_user || null;
                
                setUserAuth({ 
                    role, 
                    roles, 
                    isValid: true, 
                    userId 
                });
                
                } catch (error) {
                localStorage.removeItem('authToken');
                setUserAuth({ role: null, roles: [], isValid: false, userId: null });
            }
        }
    }, []);
    
    const handleLogoClick = (e) => {
        e.preventDefault();
        
        if (!userAuth.isValid) {
            window.location.href = '/login';
            return;
        }
        
        // Redirection selon le rôle principal
        if (userAuth.roles.includes('praticien')) {
            window.location.href = '/praticien/dashboard';
        } else if (userAuth.roles.includes('secretaire')) {
            window.location.href = ROUTE_SECRETAIRE_HOME;
        } else {
            window.location.href = '/';
        }
    };

    return(
        <SidebarHeader className="bg-white">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton className="hover:bg-white" size="lg" asChild>
                        <a onClick={handleLogoClick}>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <img 
                                    src={hello_soin} 
                                    alt="Hello Soin Logo" 
                                    className="h-auto w-auto rounded-lg object-cover object-center cursor-pointer" 
                                />
                            </div>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
    );
};

export default AppSidebarHeader;
