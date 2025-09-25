import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'staff' | 'student';

interface College {
  id: string;
  name: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  college_id: string;
  college?: College;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  userCollege: College | null;
  loading: boolean;
  signIn: (email: string, password: string, collegeId: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  getColleges: () => Promise<College[]>;
  createUser: (email: string, password: string, role: UserRole, collegeId: string, fullName?: string) => Promise<{ error: any }>;
  updateUserRole: (userId: string, role: UserRole, collegeId: string) => Promise<{ error: any }>;
  getUsersByCollege: (collegeId: string) => Promise<{ admins: UserWithRole[], staff: UserWithRole[], students: UserWithRole[] }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userCollege, setUserCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Get user role and college from the new tables
      const { data: roleData, error: roleError } = await supabase
        .rpc('get_user_role', { _user_id: userId });

      if (roleError) {
        console.error('Error fetching role:', roleError);
        return;
      }

      const { data: collegeIdData, error: collegeIdError } = await supabase
        .rpc('get_user_college_id', { _user_id: userId });

      if (collegeIdError) {
        console.error('Error fetching college ID:', collegeIdError);
        return;
      }

      // Fetch college details
      let collegeData = null;
      if (collegeIdData) {
        const { data: college, error: collegeError } = await supabase
          .from('colleges')
          .select('*')
          .eq('id', collegeIdData)
          .maybeSingle();

        if (collegeError) {
          console.error('Error fetching college:', collegeError);
        } else {
          collegeData = college;
        }
      }

      setProfile(profileData);
      setUserRole(roleData || null);
      setUserCollege(collegeData);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the profile fetch to avoid blocking the auth state change
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setUserCollege(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, collegeId: string) => {
    try {
      setLoading(true);
      
      // Step 1: Attempt to sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        toast({
          title: "Sign In Error", 
          description: authError.message,
          variant: "destructive"
        });
        return { error: authError };
      }

      // Step 2: Check if email exists in role tables for the specified college
      const [adminResult, staffResult, studentResult] = await Promise.all([
        supabase
          .from('admins')
          .select('id, user_id, college_id')
          .eq('email', email)
          .eq('college_id', collegeId)
          .maybeSingle(),
        supabase
          .from('staff')
          .select('id, user_id, college_id')
          .eq('email', email)
          .eq('college_id', collegeId)
          .maybeSingle(),
        supabase
          .from('students')
          .select('id, user_id, college_id')
          .eq('email', email)
          .eq('college_id', collegeId)
          .maybeSingle()
      ]);

      const adminData = adminResult.data;
      const staffData = staffResult.data;
      const studentData = studentResult.data;

      // Step 3: Determine user role and verify access
      let userRole: UserRole | null = null;
      let userRoleData = null;

      if (adminData) {
        userRole = 'admin';
        userRoleData = adminData;
      } else if (staffData) {
        userRole = 'staff';
        userRoleData = staffData;
      } else if (studentData) {
        userRole = 'student';
        userRoleData = studentData;
      }

      // Step 4: Handle unauthorized access
      if (!userRole || !userRoleData) {
        await supabase.auth.signOut();
        toast({
          title: "Unauthorized Access",
          description: "Your email is not registered for this college. Please contact your administrator.",
          variant: "destructive"
        });
        return { error: new Error('Unauthorized access') };
      }

      // Step 5: Verify user ID matches (security check)
      if (authData.user && userRoleData.user_id !== authData.user.id) {
        await supabase.auth.signOut();
        toast({
          title: "Authentication Error",
          description: "User authentication mismatch. Please contact support.",
          variant: "destructive"
        });
        return { error: new Error('Authentication mismatch') };
      }

      // Step 6: Set user data and fetch college info
      setUserRole(userRole);
      
      // Fetch college details
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('*')
        .eq('id', collegeId)
        .single();
      
      setUserCollege(collegeData);

      // Step 7: Show success toast
      toast({
        title: "Sign In Successful!",
        description: `Welcome back! Redirecting to ${userRole} dashboard...`
      });

      return { 
        error: null, 
        userRole, 
        redirectTo: `/${userRole}-dashboard` 
      };
    } catch (error: any) {
      toast({
        title: "Sign In Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Signed Out",
          description: "You have been signed out successfully."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Sign Out Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) return { error: new Error('No user logged in') };
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Update Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Refetch profile
        await fetchUserProfile(user.id);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully."
        });
      }

      return { error };
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const getColleges = async (): Promise<College[]> => {
    try {
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching colleges:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getColleges:', error);
      return [];
    }
  };

  const createUser = async (email: string, password: string, role: UserRole, collegeId: string, fullName?: string) => {
    try {
      setLoading(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            college_id: collegeId
          }
        }
      });

      if (authError) {
        toast({
          title: "User Creation Error",
          description: authError.message,
          variant: "destructive"
        });
        return { error: authError };
      }

      toast({
        title: "User Created Successfully!",
        description: `User account created for ${email} with ${role} role.`
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "User Creation Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole, collegeId: string) => {
    try {
      // Remove user from all role tables first
      await supabase.from('admins').delete().eq('user_id', userId);
      await supabase.from('staff').delete().eq('user_id', userId);
      await supabase.from('students').delete().eq('user_id', userId);

      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return { error: new Error('User profile not found') };
      }

      // Add user to new role table
      const tableName = role === 'admin' ? 'admins' : role === 'staff' ? 'staff' : 'students';
      const { error } = await supabase
        .from(tableName)
        .insert({
          user_id: userId,
          email: profile.email,
          college_id: collegeId
        });

      if (error) {
        toast({
          title: "Role Update Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Role Updated Successfully!",
        description: `User role updated to ${role}.`
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Role Update Error",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const getUsersByCollege = async (collegeId: string) => {
    try {
      const [adminsResult, staffResult, studentsResult] = await Promise.all([
        supabase
          .from('admins')
          .select(`
            id,
            user_id,
            email,
            college_id,
            created_at,
            updated_at,
            colleges!inner(id, name, address)
          `)
          .eq('college_id', collegeId),
        supabase
          .from('staff')
          .select(`
            id,
            user_id,
            email,
            college_id,
            created_at,
            updated_at,
            colleges!inner(id, name, address)
          `)
          .eq('college_id', collegeId),
        supabase
          .from('students')
          .select(`
            id,
            user_id,
            email,
            college_id,
            created_at,
            updated_at,
            colleges!inner(id, name, address)
          `)
          .eq('college_id', collegeId)
      ]);

      return {
        admins: adminsResult.data || [],
        staff: staffResult.data || [],
        students: studentsResult.data || []
      };
    } catch (error) {
      console.error('Error in getUsersByCollege:', error);
      return { admins: [], staff: [], students: [] };
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    userCollege,
    loading,
    signIn,
    signOut,
    updateProfile,
    getColleges,
    createUser,
    updateUserRole,
    getUsersByCollege
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};