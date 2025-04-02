import { useCallback } from "react";
import { useApi } from "./useApi";
import { treeApi } from "../api";

export function useTree() {
  const api = useApi<any>();

  const fetchTree = useCallback(async () => {
    return api.execute(() => treeApi.getTree());
  }, [api]);

  const updateTree = useCallback(
    async (tree: any) => {
      return api.execute(() => treeApi.updateTree(tree));
    },
    [api]
  );

  const exportTree = useCallback(
    async (format: "png" | "pdf" | "json"): Promise<Blob> => {
      try {
        const response = await api.execute(() => treeApi.exportTree(format));
        return response;
      } catch (error) {
        console.error("Export failed:", error);
        throw error;
      }
    },
    [api]
  );

  return {
    tree: api.data,
    loading: api.loading,
    error: api.error,
    fetchTree,
    updateTree,
    exportTree,
    reset: api.reset,
  };
}
