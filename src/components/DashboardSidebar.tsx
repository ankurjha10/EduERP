import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  GraduationCap,
  Menu,
  X,
  LayoutDashboard,
  Users,
  DollarSign,
  Building2,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  role: 'admin' | 'staff' | 'student';
  activeSection: string;
  onSectionChange: (section: string) => void;
  admissionsPendingCount?: number;
}

const DashboardSidebar = ({ role, activeSection, onSectionChange, admissionsPendingCount }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const getMenuItems = () => {
    switch(role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'admissions', label: 'Admissions', icon: Users },
          { id: 'fees', label: 'Fees Management', icon: DollarSign },
          { id: 'hostel', label: 'Hostel Management', icon: Building2 },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'staff':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance', icon: Users },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'reports', label: 'Reports', icon: BarChart3 },
        ];
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'fees', label: 'Fees', icon: DollarSign },
          { id: 'hostel', label: 'Hostel', icon: Building2 },
          { id: 'exams', label: 'Exams', icon: FileText },
          { id: 'profile', label: 'Profile', icon: Settings },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">EduERP</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeSection === item.id ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  isCollapsed && "justify-center px-2",
                  activeSection === item.id && "bg-sidebar-active text-sidebar-active-foreground"
                )}
                onClick={() => {
                  onSectionChange(item.id);
                  setIsMobileOpen(false);
                }}
              >
                <div className={cn("flex items-center", !isCollapsed && "w-full justify-between")}> 
                  <div className={cn("flex items-center", !isCollapsed && "")}> 
                    <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.id === 'admissions' && (admissionsPendingCount || 0) > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs min-w-[1.25rem] h-5 px-1">
                      {Math.min(admissionsPendingCount || 0, 99)}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          {!isCollapsed && (
            <div className="mb-3 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium capitalize">{role}</div>
              <div className="text-xs text-muted-foreground">{profile?.email || user?.email || '—'}</div>
            </div>
          )}
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
          >
            <LogOut className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;