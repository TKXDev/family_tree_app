import { useCallback } from "react";
import { useApi } from "./useApi";
import { memberApi, Member } from "../api";

export function useMembers() {
  const api = useApi<Member[]>();

  const fetchMembers = useCallback(async () => {
    return api.execute(() => memberApi.getAllMembers());
  }, [api]);

  const createMember = useCallback(
    async (member: Omit<Member, "id">) => {
      return api.execute(() => memberApi.createMember(member));
    },
    [api]
  );

  const updateMember = useCallback(
    async (id: string, member: Partial<Member>) => {
      return api.execute(() => memberApi.updateMember(id, member));
    },
    [api]
  );

  const deleteMember = useCallback(
    async (id: string) => {
      return api.execute(() => memberApi.deleteMember(id));
    },
    [api]
  );

  const uploadPhoto = useCallback(
    async (id: string, file: File) => {
      return api.execute(() => memberApi.uploadPhoto(id, file));
    },
    [api]
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
    reset: api.reset,
  };
}
