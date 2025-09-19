// Definições de tipos para @supabase/supabase-js
declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    app_metadata: any;
    user_metadata: any;
    aud: string;
    email?: string;
    role?: string;
  }

  export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }

  export interface PostgrestResponse<T> {
    data: T | null;
    error: {
      message: string;
      details: string;
      hint: string;
      code: string;
    } | null;
    count: number | null;
    status: number;
    statusText: string;
  }
}
