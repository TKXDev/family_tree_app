import { useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { memberApi, Member } from "../api";
import { toast } from "react-hot-toast";
import { useAuth } from "./useAuth";

export function useMembers() {
  const api = useApi<Member[]>();
  const { isAdmin } = useAuth();

  const fetchMembers = useCallback(async () => {
    try {
      return await api.execute(() => memberApi.getAllMembers());
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to fetch members");
      throw error;
    }
  }, [api]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const createMember = useCallback(
    async (member: Omit<Member, "id">) => {
      try {
        if (!isAdmin) {
          toast.error("Permission denied: Only admin users can create members");
          throw new Error("Permission denied: Admin role required");
        }

        const result = await api.execute(() => memberApi.createMember(member));
        toast.success("Member created successfully");
        fetchMembers(); // Refresh the list
        return result;
      } catch (error) {
        console.error("Error creating member:", error);
        if (error instanceof Error && error.message.includes("Only admin")) {
          toast.error("Permission denied: Only admin users can create members");
        } else {
          toast.error("Failed to create member");
        }
        throw error;
      }
    },
    [api, fetchMembers, isAdmin]
  );

  const updateMember = useCallback(
    async (id: string, member: Partial<Member>) => {
      try {
        if (!isAdmin) {
          toast.error("Permission denied: Only admin users can update members");
          throw new Error("Permission denied: Admin role required");
        }

        const result = await api.execute(() =>
          memberApi.updateMember(id, member)
        );
        toast.success("Member updated successfully");
        fetchMembers(); // Refresh the list
        return result;
      } catch (error) {
        console.error("Error updating member:", error);
        if (error instanceof Error && error.message.includes("Only admin")) {
          toast.error("Permission denied: Only admin users can update members");
        } else {
          toast.error("Failed to update member");
        }
        throw error;
      }
    },
    [api, fetchMembers, isAdmin]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      try {
        if (!isAdmin) {
          toast.error("Permission denied: Only admin users can delete members");
          throw new Error("Permission denied: Admin role required");
        }

        const result = await api.execute(() => memberApi.deleteMember(id));
        toast.success("Member deleted successfully");
        fetchMembers(); // Refresh the list
        return result;
      } catch (error) {
        console.error("Error deleting member:", error);
        if (error instanceof Error && error.message.includes("Only admin")) {
          toast.error("Permission denied: Only admin users can delete members");
        } else {
          toast.error("Failed to delete member");
        }
        throw error;
      }
    },
    [api, fetchMembers, isAdmin]
  );

  const uploadPhoto = useCallback(
    async (id: string, file: File) => {
      try {
        if (!isAdmin) {
          toast.error("Permission denied: Only admin users can upload photos");
          throw new Error("Permission denied: Admin role required");
        }

        const result = await api.execute(() => memberApi.uploadPhoto(id, file));
        toast.success("Photo uploaded successfully");
        fetchMembers(); // Refresh the list
        return result;
      } catch (error) {
        console.error("Error uploading photo:", error);
        if (error instanceof Error && error.message.includes("Only admin")) {
          toast.error("Permission denied: Only admin users can upload photos");
        } else {
          toast.error("Failed to upload photo");
        }
        throw error;
      }
    },
    [api, fetchMembers, isAdmin]
  );

  return {
    members: api.data,
    loading: api.loading,
    error: api.error,
    fetchMembers,
    createMember,
    updateMember,
    deleteMember,
    uploadPhoto,
  };
}
