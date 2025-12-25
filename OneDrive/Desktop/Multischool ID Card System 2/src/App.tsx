import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SuperadminDashboard } from './components/superadmin/SuperadminDashboard';
import { ManageSchools } from './components/superadmin/ManageSchools';
import { ManageSchoolAdmins } from './components/superadmin/ManageSchoolAdmins';
import { SchooladminDashboard } from './components/schooladmin/SchooladminDashboard';
import { ManageStudents } from './components/schooladmin/ManageStudents';
import { ManageStudents as SuperadminManageStudents } from './components/superadmin/ManageStudents';
import { ManageTeachers } from './components/schooladmin/ManageTeachers';
import { ManageTeachers as SuperadminManageTeachers } from './components/superadmin/ManageTeachers';
import { BulkOperations } from './components/schooladmin/BulkOperations';
import { BulkOperations as SuperadminBulkOperations } from './components/superadmin/BulkOperations';
import { TemplateManagement } from './components/schooladmin/TemplateManagement';
import { TemplateManagement as SuperadminTemplateManagement } from './components/superadmin/TemplateManagement';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { BulkOperations as TeacherBulkOperations } from './components/teacher/BulkOperations';
import { authAPI } from './utils/api';

type UserRole = 'superadmin' | 'schooladmin' | 'teacher';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolName?: string;
  schoolId?: string;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const response = await authAPI.getCurrentUser();
          if (response.success && response.user) {
            const user = mapBackendUserToFrontend(response.user);
            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            // Invalid token, clear it
            authAPI.logout();
          }
        }
      } catch (error) {
        // Token invalid or expired, clear it
        authAPI.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Map backend user role format to frontend format
  const mapBackendUserToFrontend = (backendUser: any): User => {
    const roleMap: Record<string, UserRole> = {
      'Superadmin': 'superadmin',
      'Schooladmin': 'schooladmin',
      'Teacher': 'teacher',
    };

    return {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.email,
      role: roleMap[backendUser.role] || 'teacher',
      schoolName: backendUser.schoolName || undefined,
      schoolId: backendUser.schoolId || undefined,
    };
  };

  const handleLogin = (backendUser: any) => {
    const user = mapBackendUserToFrontend(backendUser);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (!currentUser) return null;

    // Superadmin views
    if (currentUser.role === 'superadmin') {
      switch (currentView) {
        case 'dashboard':
          return <SuperadminDashboard onNavigate={setCurrentView} />;
        case 'schools':
          return <ManageSchools />;
        case 'admins':
          return <ManageSchoolAdmins />;
        case 'teachers':
          return <SuperadminManageTeachers />;
        case 'templates':
          return <SuperadminTemplateManagement />;
        case 'students':
          return <SuperadminManageStudents />;
        case 'bulk':
          return <SuperadminBulkOperations userRole="superadmin" />;
        default:
          return <SuperadminDashboard onNavigate={setCurrentView} />;
      }
    }

    // Schooladmin views
    if (currentUser.role === 'schooladmin') {
      switch (currentView) {
        case 'dashboard':
          return <SchooladminDashboard onNavigate={setCurrentView} />;
        case 'students':
          return <ManageStudents />;
        case 'teachers':
          return <ManageTeachers />;
        case 'bulk':
          return <BulkOperations userRole="schooladmin" />;
        case 'templates':
          return <TemplateManagement />;
        default:
          return <SchooladminDashboard onNavigate={setCurrentView} />;
      }
    }

    // Teacher views
    if (currentUser.role === 'teacher') {
      switch (currentView) {
        case 'dashboard':
          return <TeacherDashboard />;
        case 'bulk':
          return <TeacherBulkOperations />;
        default:
          return <TeacherDashboard />;
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        userRole={currentUser!.role}
        currentView={currentView}
        onNavigate={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={currentUser!}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
