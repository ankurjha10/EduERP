import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAuth, UserRole } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Users, Search, UserCog, Shield, User, GraduationCap, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  created_at: string;
  user_roles?: {
    role: UserRole;
  }[];
}

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [updatingRoles, setUpdatingRoles] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles separately and then roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        throw profilesError;
      }

      // Fetch roles separately
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Combine the data
      const usersWithRoles = (profiles || []).map(profile => ({
        ...profile,
        user_roles: roles?.filter(role => role.user_id === profile.user_id) || []
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingRoles(prev => new Set([...prev, userId]));

      // First, remove existing role
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then, insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole,
          assigned_by: user?.id
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}`,
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    } finally {
      setUpdatingRoles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getRoleIcon = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'staff':
        return <Users className="h-4 w-4" />;
      case 'student':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = user.user_roles?.[0]?.role;
    const matchesRole = selectedRole === 'all' || userRole === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'staff', label: 'Staff Member' },
    { value: 'student', label: 'Student' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <UserCog className="h-5 w-5 text-primary" />
          <Badge variant="outline" className="px-3 py-1">
            {users.length} Total Users
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading users...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((profile) => {
                  const currentRole = profile.user_roles?.[0]?.role;
                  const isUpdating = updatingRoles.has(profile.user_id);
                  
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {profile.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {profile.user_id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>
                        {currentRole ? (
                          <Badge 
                            variant={getRoleBadgeVariant(currentRole)}
                            className="flex items-center space-x-1 w-fit"
                          >
                            {getRoleIcon(currentRole)}
                            <span className="capitalize">{currentRole}</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Role</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(profile.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Select
                            value={currentRole || ''}
                            onValueChange={(value: UserRole) => updateUserRole(profile.user_id, value)}
                            disabled={isUpdating || profile.user_id === user?.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Assign role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  <div className="flex items-center space-x-2">
                                    {getRoleIcon(role.value)}
                                    <span>{role.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isUpdating && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                        </div>
                        {profile.user_id === user?.id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cannot change your own role
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;