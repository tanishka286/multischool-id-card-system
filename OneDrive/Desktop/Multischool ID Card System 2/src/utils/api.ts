// Centralized API base URL configuration
// In development: uses localhost backend
// In production: uses VITE_API_URL from environment variables (set in Vercel)
const getApiBaseUrl = (): string => {
  // If VITE_API_URL is explicitly set, use it (for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to localhost for development
  return 'http://localhost:5001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

// Auth token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken') || null;
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 404 specifically (template not found)
    if (response.status === 404) {
      const error = await response.json().catch(() => ({ message: 'Not found' }));
      const notFoundError = new Error(error.message || 'Not found');
      (notFoundError as any).status = 404;
      throw notFoundError;
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  // Handle file downloads (blob responses)
  if (response.headers.get('content-type')?.includes('application/vnd.openxmlformats')) {
    return response.blob() as unknown as T;
  }

  return response.json();
}

// Template API functions
export const templateAPI = {
  // Get templates by type
  getTemplates: async (type?: string, schoolId?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; count: number }>(
      `/templates${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get template by ID
  getTemplateById: async (templateId: string) => {
    return apiRequest<{ success: boolean; data: any }>(
      `/templates/${templateId}`
    );
  },

  // Get active template by type
  getActiveTemplate: async (type: string, schoolId?: string) => {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any }>(
      `/templates/active/${type}${queryString ? `?${queryString}` : ''}`
    );
  },

  // Download Excel template by type
  downloadExcelTemplate: async (type: string, schoolId?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<Blob>(
      `/templates/download-excel/${type}${queryString ? `?${queryString}` : ''}`
    );
  },

  // Download Excel template by template ID
  downloadExcelTemplateById: async (templateId: string): Promise<Blob> => {
    return apiRequest<Blob>(`/templates/${templateId}/download-excel`);
  },
};

// Helper function to download blob as file
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Auth API functions
export const authAPI = {
  // Login user
  login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: any }> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token if login successful
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },

  // Get current user
  getCurrentUser: async (): Promise<{ success: boolean; user: any }> => {
    return apiRequest<{ success: boolean; user: any }>('/auth/me');
  },

  // Google sign-in
  googleSignIn: async (idToken: string): Promise<{ success: boolean; token?: string; user?: any; message?: string }> => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Google sign-in failed' }));
      throw new Error(error.message || 'Google sign-in failed');
    }

    const data = await response.json();
    
    // Store token if login successful
    if (data.success && data.token) {
      setAuthToken(data.token);
    }
    
    return data;
  },

  // Logout (clear token)
  logout: (): void => {
    setAuthToken(null);
  },
};

// Bulk import API functions
export const bulkImportAPI = {
  // Import data from Excel file
  importExcel: async (file: File, entityType: string): Promise<{ success: boolean; message: string; results: any }> => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/bulk-import/${entityType}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// Student API functions
export const studentAPI = {
  // Get all students
  getStudents: async (classId?: string, page = 1, limit = 10, schoolId?: string) => {
    const params = new URLSearchParams();
    if (classId) params.append('classId', classId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/students${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create a student
  createStudent: async (studentData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },

  // Update a student
  updateStudent: async (studentId: string, studentData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(studentData),
    });
  },

  // Delete a student
  deleteStudent: async (studentId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/students/${studentId}`, {
      method: 'DELETE',
    });
  },
};

// Teacher API functions
export const teacherAPI = {
  // Get all teachers
  getTeachers: async (page = 1, limit = 10, schoolId?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/teachers${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create a teacher
  createTeacher: async (teacherData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  },

  // Update a teacher
  updateTeacher: async (teacherId: string, teacherData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/teachers/${teacherId}`, {
      method: 'PATCH',
      body: JSON.stringify(teacherData),
    });
  },

  // Delete a teacher
  deleteTeacher: async (teacherId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/teachers/${teacherId}`, {
      method: 'DELETE',
    });
  },
};

// Class API functions
export const classAPI = {
  // Get all classes
  getClasses: async (sessionId?: string, page = 1, limit = 10, schoolId?: string) => {
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/classes${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create a class
  createClass: async (classData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>('/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  // Freeze a class
  freezeClass: async (classId: string) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/classes/${classId}/freeze`, {
      method: 'PATCH',
    });
  },

  // Unfreeze a class
  unfreezeClass: async (classId: string) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/classes/${classId}/unfreeze`, {
      method: 'PATCH',
    });
  },
};

// Session API functions
export const sessionAPI = {
  // Get all sessions
  getSessions: async (page = 1, limit = 10, schoolId?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/sessions${queryString ? `?${queryString}` : ''}`
    );
  },

  // Create a session
  createSession: async (sessionData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  // Activate a session
  activateSession: async (sessionId: string) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/sessions/${sessionId}/activate`, {
      method: 'PATCH',
    });
  },

  // Deactivate a session
  deactivateSession: async (sessionId: string) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/sessions/${sessionId}/deactivate`, {
      method: 'PATCH',
    });
  },
};

// User API functions
export const userAPI = {
  // Get all users
  getUsers: async (page = 1, limit = 10, role?: string, schoolId?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (role) params.append('role', role);
    if (schoolId) params.append('schoolId', schoolId);
    
    const queryString = params.toString();
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(
      `/users${queryString ? `?${queryString}` : ''}`
    );
  },

  // Get user by ID
  getUser: async (userId: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/users/${userId}`);
  },

  // Create a user
  createUser: async (userData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update a user
  updateUser: async (userId: string, userData: any) => {
    return apiRequest<{ success: boolean; data: any; message: string }>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Delete a user
  deleteUser: async (userId: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};

