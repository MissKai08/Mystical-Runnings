import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { loadUserProfile, UserProfile } from "@/utils/userProfile";

interface UserProfileContextValue {
  profile: UserProfile | null;
  setProfile: (p: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  setProfile: () => {},
  refreshProfile: async () => {},
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    const p = await loadUserProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
