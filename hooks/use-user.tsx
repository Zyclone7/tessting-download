"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import CustomLoader from "@/components/loader";

// Define a type for the user data. You can extend this as needed.
interface User {
  nickname: string;
  image: string;
  token: any;
  id: number;
  role: string | null;
  status: number | null;
  name: string;
  email: string;
  contact_number: string | null;
  merchant_id: any;
  bank_name: string | null;
  bank_account_number: string | null;
  cf_share: number | null;
  business_name: any;
  business_address: any;
  level: number;
  travel_agency: string;
  social_media_page: string;
  user_upline_id: number;
  user_kyc: number;
  profile_pic_url: string;
  travel_logo_url: string;
  // Add more fields as needed
}

interface UserContextType {
  user: User | null | undefined;
  token: string | null | undefined;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearUser: () => void;
  updateUserField: <K extends keyof User>(field: K, value: User[K]) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with undefined instead of null to indicate "loading" state
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("user");
        const savedToken = localStorage.getItem("token");

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(null); // Explicitly set to null when not found
        }

        if (savedToken) {
          setToken(savedToken);
        } else {
          setToken(null); // Explicitly set to null when not found
        }
      } catch (error) {
        console.error("Error loading auth data from localStorage:", error);
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Persist auth state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && !isLoading) {
      if (user !== null && user !== undefined) {
        localStorage.setItem("user", JSON.stringify(user));
      } else if (user === null) {
        localStorage.removeItem("user");
      }

      if (token !== null && token !== undefined) {
        localStorage.setItem("token", token);
      } else if (token === null) {
        localStorage.removeItem("token");
      }
    }
  }, [user, token, isLoading]);

  const clearUser = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  const updateUserField = <K extends keyof User>(field: K, value: User[K]) => {
    if (user && user[field] !== value) {
      const updatedUser = { ...user, [field]: value };
      setUser(updatedUser);
      console.log(`Updated user field ${String(field)} to:`, value); // Add debugging
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        clearUser,
        updateUserField,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

// Component to ensure redirection
export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useUserContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user === null) {
      router.push("/login");
    }
  }, [user, router, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          transform: "scale(2.5)",
        }}
      >
        <CustomLoader /> {/* Or any loading indicator/component */}
      </div>
    );
  }

  // Only render children if user is authenticated
  return user ? <>{children}</> : null;
};
