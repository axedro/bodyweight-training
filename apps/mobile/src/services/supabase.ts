import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://172.20.10.9:54321';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la aplicación
export interface UserProfile {
  id: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  experience_level?: string;
  available_days?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

// Servicios de autenticación
export const authService = {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'Error inesperado' };
    }
  },

  async signUp(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: 'Error inesperado' };
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};

// Servicios de perfil de usuario
export const profileService = {
  async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: userId,
            email: profileData.email,
            age: profileData.age,
            weight: profileData.weight,
            height: profileData.height,
            experience_level: profileData.experience_level,
            available_days: profileData.available_days,
          }
        ]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al crear perfil' };
    }
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  },

  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Error al actualizar perfil' };
    }
  },
};
