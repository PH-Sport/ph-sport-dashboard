import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/auth-context';

export interface Profile {
  id: string;
  given_name: string;
  family_name?: string | null;
  alias?: string | null;
  full_name: string;
  display_name: string;
  role: 'ADMIN' | 'DESIGNER';
  created_at: string;
  avatar_url?: string | null;
}

interface UsersData {
  users: Profile[];
}

interface UseUsersDataReturn {
  users: Profile[];
  isLoading: boolean;
  error: Error | null;
  mutate: () => void;
}

const fetchUsersData = async (): Promise<UsersData> => {
  const supabase = createClient();

  // Load users
  const { data: usersData, error: usersError } = await supabase
    .from('profiles')
    .select('id, given_name, family_name, alias, full_name, display_name, role, created_at, avatar_url')
    .eq('is_dev', false)
    .order('created_at', { ascending: true });

  if (usersError) throw usersError;

  return {
    users: usersData || [],
  };
};

export function useUsersData(): UseUsersDataReturn {
  const { profile, status } = useAuth();
  const isAdmin = status === 'AUTHENTICATED' && profile?.role === 'ADMIN';

  const { data, error, isLoading, mutate } = useSWR<UsersData>(
    // Only fetch when authenticated as admin
    isAdmin ? 'users-data' : null,
    fetchUsersData
  );

  return {
    users: data?.users ?? [],
    isLoading,
    error: error ?? null,
    mutate,
  };
}
