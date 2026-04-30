import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { apiRequest } from "@/lib/query-client";
import { storeToken, getToken, deleteToken } from "@/services/tokenStorage";

WebBrowser.maybeCompleteAuthSession();

const ONBOARDING_KEY = "@soccer_diary_onboarded";
const USER_CACHE_KEY = "@soccer_diary_user_cache";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  age?: number;
  team?: string;
  position?: string;
  preferredFoot?: "Left" | "Right" | "Both";
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isOnboarded: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const [token, cachedUser, onboarded] = await Promise.all([
        getToken(),
        AsyncStorage.getItem(USER_CACHE_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      setIsOnboarded(onboarded === "true");

      if (!token) {
        setIsLoading(false);
        return;
      }

      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }

      try {
        const res = await apiRequest("GET", "/api/auth/me");
        const serverUser = await res.json();
        const authUser = serverToAuthUser(serverUser);
        setUser(authUser);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser));
      } catch {
        await deleteToken();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      }
    } catch (error) {
      console.error("Auth init error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  function serverToAuthUser(data: any): AuthUser {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      age: data.age ?? undefined,
      team: data.team ?? undefined,
      position: data.position ?? undefined,
      preferredFoot: data.preferredFoot ?? data.preferred_foot ?? undefined,
      avatarUrl: data.avatarUrl ?? data.avatar_url ?? undefined,
    };
  }

  async function handleAuthResponse(res: Response) {
    const data = await res.json();
    await storeToken(data.token);
    const authUser = serverToAuthUser(data.user);
    setUser(authUser);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser));
  }

  const signInWithApple = async () => {
    if (Platform.OS !== "ios") {
      throw new Error("Apple Sign-In is only available on iOS");
    }
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const email = credential.email || `${credential.user}@privaterelay.appleid.com`;
    const name =
      credential.fullName?.givenName && credential.fullName?.familyName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
        : credential.fullName?.givenName || "Soccer Player";

    const res = await apiRequest("POST", "/api/auth/session", {
      provider: "apple",
      idToken: credential.identityToken,
      email,
      name,
    });

    await handleAuthResponse(res);
  };

  const signInWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) {
      throw new Error("Google Sign-In is not configured yet. Please use email sign-in.");
    }

    const redirectUri = AuthSession.makeRedirectUri({ scheme: "soccerdiary" });

    const discovery = {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
    };

    const request = new AuthSession.AuthRequest({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri,
      scopes: ["openid", "email", "profile"],
      responseType: AuthSession.ResponseType.Token,
    });

    const result = await request.promptAsync(discovery);

    if (result.type !== "success") {
      throw new Error("Google Sign-In was cancelled");
    }

    const accessToken = result.params.access_token;
    const userInfoRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    );
    const userInfo = await userInfoRes.json();

    const res = await apiRequest("POST", "/api/auth/session", {
      provider: "google",
      idToken: accessToken,
      email: userInfo.email,
      name: userInfo.name || userInfo.given_name,
    });

    await handleAuthResponse(res);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/session", {
      provider: "email",
      email,
      password,
    });
    await handleAuthResponse(res);
  };

  const signUpWithEmail = async (name: string, email: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/session", {
      provider: "email",
      email,
      password,
      name,
      isSignUp: true,
    });
    await handleAuthResponse(res);
  };

  const signOut = async () => {
    await deleteToken();
    await AsyncStorage.multiRemove([USER_CACHE_KEY]);
    setUser(null);
  };

  const updateUser = async (updates: Partial<AuthUser>) => {
    if (!user) return;

    const res = await apiRequest("PATCH", "/api/auth/me", {
      name: updates.name,
      avatarUrl: updates.avatarUrl,
      team: updates.team,
      position: updates.position,
      preferredFoot: updates.preferredFoot,
      age: updates.age,
    });
    const serverUser = await res.json();
    const authUser = serverToAuthUser(serverUser);
    setUser(authUser);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(authUser));
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    setIsOnboarded(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isOnboarded,
        signInWithApple,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        updateUser,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
