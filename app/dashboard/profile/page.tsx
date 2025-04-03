import { useDynamicPageTitle } from "@/lib/hooks/usePageTitle";

export default function ProfilePage() {
  // Other state and hooks...

  // Add usePageTitle hook
  useDynamicPageTitle({
    title: "My Profile",
    loading: isLoading,
    error: error,
  });

  // Rest of the component code...
}
