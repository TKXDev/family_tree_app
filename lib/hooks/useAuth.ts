import { useCallback } from "react";
import { useApi } from "./useApi";
import { authApi, User } from "../api";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const api = useApi<User>();

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await api.execute(() => authApi.signIn(email, password));
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
        return data;
      } catch (error) {
        throw error;
      }
    },
    [api, router]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const data = await api.execute(() =>
          authApi.signUp(email, password, name)
        );
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
        return data;
      } catch (error) {
        throw error;
      }
    },
    [api, router]
  );

  const signOut = useCallback(async () => {
    try {
      await api.execute(() => authApi.signOut());
      localStorage.removeItem("token");
      router.push("/");
    } catch (error) {
      throw error;
    }
  }, [api, router]);

  const getCurrentUser = useCallback(async () => {
    return api.execute(() => authApi.getCurrentUser());
  }, [api]);

  return {
    user: api.data,
    loading: api.loading,
    error: api.error,
    signIn,
    signUp,
    signOut,
    getCurrentUser,
    reset: api.reset,
  };
}
