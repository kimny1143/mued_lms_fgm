import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { supabase } from "./supabase";
import { UserRole } from "./types";

// NextAuthのセッション型を拡張
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: UserRole;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: import.meta.env.VITE_SUPABASE_URL,
    secret: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  }),
  providers: [
    GoogleProvider({
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      // セッションにユーザーロールを追加
      if (session?.user) {
        try {
          // Supabaseからユーザーロール情報を取得
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (error) {
            console.error("Error fetching user role:", error);
            session.user.role = UserRole.STUDENT; // デフォルトロール
          } else if (data) {
            session.user.role = data.role as UserRole;
          }
          
          // ユーザーIDをセッションに追加
          session.user.id = user.id;
        } catch (error) {
          console.error("Session callback error:", error);
        }
      }
      return session;
    },
    async signIn({ user }) {
      try {
        // 新規ユーザー登録時にデフォルトロールを設定
        if (user?.id) {
          const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (error && error.code === "PGRST116") {
            // ユーザーが存在しない場合は新規作成（ロールはデフォルトでSTUDENT）
            const { error: insertError } = await supabase
              .from("users")
              .insert({
                id: user.id,
                email: user.email,
                role: UserRole.STUDENT,
              });

            if (insertError) {
              console.error("Error creating user with role:", insertError);
              return false;
            }
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: import.meta.env.VITE_NEXTAUTH_SECRET,
}; 