import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { ADMIN_EMAIL, STAFF_EMAIL } from "../config/authConfig";

function resolveRole(user) {
  if (!user) return null;
  if (user.email === ADMIN_EMAIL) return "admin";
  if (user.email === STAFF_EMAIL) return "staff";
  return null;
}

/**
 * Supabase Authのログイン状態を管理するフック。
 * profilesテーブルは持たず、ログイン後のメールアドレスをauthConfig.jsの
 * 固定値と比較してロール（"admin" | "staff" | null）を判定する。
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, message: "ログインに失敗しました。パスワードをご確認ください。" };
    }
    setUser(data.user);
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, role: resolveRole(user), loading, login, logout };
}
