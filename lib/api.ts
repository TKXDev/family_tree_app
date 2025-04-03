import api from "./axios";

// Types
export interface Member {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  photo?: string;
  parents: string[];
  spouse?: string;
  children: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  token?: string;
  role: "admin" | "user";
}

// Auth APIs
export const authApi = {
  signIn: async (email: string, password: string) => {
    const response = await api.post("/auth/signin", { email, password });
    return response.data.user;
  },

  signUp: async (email: string, password: string, name: string) => {
    const response = await api.post("/auth/signup", {
      email,
      password,
      name,
    });
    return response.data.user;
  },

  signOut: async () => {
    const response = await api.post("/auth/logout", {});
    return response.data;
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      console.log("getCurrentUser response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting current user:", error);
      throw error;
    }
  },
};

// Member APIs
export const memberApi = {
  getAllMembers: async () => {
    const response = await api.get("/members");
    return response.data;
  },

  getMember: async (id: string) => {
    const response = await api.get(`/members/${id}`);
    return response.data;
  },

  createMember: async (member: Omit<Member, "id">) => {
    const user = await authApi.getCurrentUser();
    if (user.role !== "admin") {
      throw new Error("Only admins can create members");
    }
    const response = await api.post("/members", member);
    return response.data;
  },

  updateMember: async (id: string, member: Partial<Member>) => {
    const user = await authApi.getCurrentUser();
    if (user.role !== "admin") {
      throw new Error("Only admins can update members");
    }
    const response = await api.put(`/members/${id}`, member);
    return response.data;
  },

  deleteMember: async (id: string) => {
    const user = await authApi.getCurrentUser();
    if (user.role !== "admin") {
      throw new Error("Only admins can delete members");
    }
    const response = await api.delete(`/members/${id}`);
    return response.data;
  },

  uploadPhoto: async (id: string, file: File) => {
    const user = await authApi.getCurrentUser();
    if (user.role !== "admin") {
      throw new Error("Only admins can upload photos");
    }
    const formData = new FormData();
    formData.append("photo", file);
    const response = await api.post(`/members/${id}/photo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// Family Tree APIs
export const treeApi = {
  getTree: async () => {
    const response = await api.get("/family-tree");
    return response.data;
  },

  updateTree: async (tree: any) => {
    const response = await api.put("/family-tree", tree);
    return response.data;
  },

  exportTree: async (format: "png" | "pdf" | "json") => {
    const response = await api.get(`/family-tree/export?format=${format}`, {
      responseType: "blob",
    });
    return response.data;
  },
};

// Search APIs
export const searchApi = {
  searchMembers: async (query: string) => {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};
