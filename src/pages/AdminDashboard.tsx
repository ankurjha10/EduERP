

// @ts-nocheck
import { useState, useEffect } from "react";
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { 
  Users, 
  DollarSign, 
  Building2, 
  FileText, 
  TrendingUp,
  Download,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  MoreHorizontal,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X
} from "lucide-react";

// Fees Management Section Component
const FeesSection = () => {
  const { userCollege } = useAuth();
  const [filters, setFilters] = useState<{ program: string; branch: string; year: string }>({ program: '', branch: '', year: '' });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'status' | 'due'>('due');
  const [isLoading, setIsLoading] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);

  const programOptions = ['B.Tech', 'B.Com', 'B.A', 'B.Sc', 'MBA', 'MCA', 'M.Tech'];
  const branchOptions: Record<string, string[]> = {
    'B.Tech': ['CSE', 'IT', 'ECE', 'ME', 'CE'],
    'B.Com': ['Accounting', 'Finance', 'Marketing'],
    'B.A': ['English', 'Economics', 'Psychology', 'Political Science'],
    'B.Sc': ['CS', 'Math', 'Physics', 'Chemistry', 'Biology'],
    'MBA': ['Marketing', 'Finance', 'HR', 'Operations', 'BA'],
    'MCA': ['SE', 'DS', 'Cloud'],
    'M.Tech': ['CSE', 'ECE', 'ME', 'CE']
  };
  const yearOptions = ['2024-25', '2025-26', '2026-27'];

  useEffect(() => {
    if (!userCollege?.id) return;
    loadData();
  }, [userCollege?.id, filters.program, filters.branch, filters.year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load students of this college
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, user_id, email, created_at')
        .eq('college_id', userCollege!.id);

      // Load fee transactions filtered by program/branch/year
      const query = supabase
        .from('fee_transactions')
        .select('id, student_id, kind, fee_type, amount, payment_date, payment_mode, academic_year, program, branch');

      let { data: txData } = await query
        .eq('academic_year', filters.year || null)
        .eq('program', filters.program || null)
        .eq('branch', filters.branch || null);

      // If filters are empty, re-fetch without eq(null)
      if (!filters.year || !filters.program || !filters.branch) {
        const base = supabase
          .from('fee_transactions')
          .select('id, student_id, kind, fee_type, amount, payment_date, payment_mode, academic_year, program, branch');
        const q2 = base
          .match({
            ...(filters.year ? { academic_year: filters.year } : {}),
            ...(filters.program ? { program: filters.program } : {}),
            ...(filters.branch ? { branch: filters.branch } : {})
          });
        const { data } = await q2;
        txData = data || [];
      }

      const studentIdToInfo: Record<string, any> = {};
      (studentsData || []).forEach(s => {
        studentIdToInfo[s.user_id || s.id] = s;
      });

      // Aggregate per student
      const map: Record<string, any> = {};
      (txData || []).forEach(tx => {
        const sid = tx.student_id;
        if (!map[sid]) {
          const info = studentIdToInfo[sid] || {};
          map[sid] = {
            student_id: sid,
            name: info.full_name || info.email?.split('@')[0] || 'Student',
            roll: info.roll_number || 'N/A',
            program: tx.program,
            branch: tx.branch,
            year: tx.academic_year,
            totalFee: 0,
            paid: 0
          };
        }
        if (tx.kind === 'charge') map[sid].totalFee += Number(tx.amount || 0);
        if (tx.kind === 'payment') map[sid].paid += Number(tx.amount || 0);
      });

      const rows = Object.values(map).map((r: any) => ({
        ...r,
        due: Math.max(0, (r.totalFee || 0) - (r.paid || 0)),
        status: ((r.totalFee || 0) - (r.paid || 0)) <= 0 ? 'Paid' : ((r.paid || 0) === 0 ? 'Unpaid' : 'Partial')
      }));

      setStudents(studentsData || []);
      setSummaries(rows);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load fees data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRows = summaries
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || String(r.roll).toLowerCase().includes(q);
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'due') return (b.due || 0) - (a.due || 0);
      const order = { Paid: 2, Partial: 1, Unpaid: 0 } as any;
      return (order[b.status] || 0) - (order[a.status] || 0);
    });

  const openAddTx = (studentId?: string) => {
    setEditingTx({ id: null, student_id: studentId || '', kind: 'payment', fee_type: '', amount: '', payment_date: new Date().toISOString().slice(0,10), payment_mode: 'Online', academic_year: filters.year, program: filters.program, branch: filters.branch });
    setShowTxModal(true);
  };

  const saveTx = async () => {
    if (!editingTx) return;
    try {
      const payload = { ...editingTx, amount: Number(editingTx.amount) };
      let res;
      if (editingTx.id) {
        res = await supabase.from('fee_transactions').update(payload).eq('id', editingTx.id);
      } else {
        res = await supabase.from('fee_transactions').insert(payload);
      }
      if (res.error) throw res.error;
      toast({ title: 'Saved', description: 'Fee record saved' });
      setShowTxModal(false);
      setEditingTx(null);
      loadData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const exportCsv = () => {
    const headers = ['Student Name','Roll Number','Program','Branch','Academic Year','Total Fee','Paid','Due','Payment Status'];
    const lines = [headers.join(',')].concat(filteredRows.map((r: any) => [r.name, r.roll, r.program || '', r.branch || '', r.year || '', r.totalFee, r.paid, r.due, r.status].join(',')));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_${filters.year || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full md:max-w-4xl">
          <div className="space-y-1">
            <Label>Course</Label>
            <Select onValueChange={(v) => setFilters(prev => ({ ...prev, program: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {programOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Branch</Label>
            <Select onValueChange={(v) => setFilters(prev => ({ ...prev, branch: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                {(branchOptions[filters.program] || []).map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Academic Year</Label>
            <Select onValueChange={(v) => setFilters(prev => ({ ...prev, year: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Search</Label>
            <Input placeholder="Student name or roll" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due">Due Amount</SelectItem>
              <SelectItem value="status">Payment Status</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Student Fee Details</CardTitle>
          <CardDescription>Summary by student based on selected filters</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Total Fee</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((r: any) => (
                  <TableRow key={r.student_id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.roll}</TableCell>
                    <TableCell>₹{r.totalFee || 0}</TableCell>
                    <TableCell>₹{r.paid || 0}</TableCell>
                    <TableCell>₹{r.due || 0}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'Paid' ? 'default' : r.status === 'Partial' ? 'secondary' : 'destructive'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openAddTx(r.student_id)}>Add/Update</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTxModal} onOpenChange={setShowTxModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTx?.id ? 'Edit Fee Record' : 'Add Fee Record'}</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Kind</Label>
                <Select value={editingTx.kind} onValueChange={(v) => setEditingTx((p: any) => ({ ...p, kind: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charge">Charge (Total/Additional Fee)</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee Type</Label>
                <Input value={editingTx.fee_type} onChange={(e) => setEditingTx((p: any) => ({ ...p, fee_type: e.target.value }))} placeholder="e.g., Semester Fee" />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={editingTx.amount} onChange={(e) => setEditingTx((p: any) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input type="date" value={editingTx.payment_date} onChange={(e) => setEditingTx((p: any) => ({ ...p, payment_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={editingTx.payment_mode} onValueChange={(v) => setEditingTx((p: any) => ({ ...p, payment_mode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="DD">DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTxModal(false)}>Cancel</Button>
            <Button onClick={saveTx}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  college_id: string;
  college?: { name: string };
  created_at: string;
  updated_at: string;
}

interface UserManagementState {
  admins: User[];
  staff: User[];
  students: User[];
  loading: boolean;
  searchTerm: string;
  currentPage: { admins: number; staff: number; students: number };
  itemsPerPage: number;
  showAddModal: { admins: boolean; staff: boolean; students: boolean };
  newUser: {
    email: string;
    password: string;
    fullName: string;
    role: 'admin' | 'staff' | 'student';
  };
  isCreating: boolean;
}

const AdminDashboard = () => {
  const { profile, userCollege, user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [colleges, setColleges] = useState<Array<{id: string, name: string, address?: string}>>([]);
  const [pendingAdmissions, setPendingAdmissions] = useState<any[]>([]);
  const [isLoadingAdmissions, setIsLoadingAdmissions] = useState<boolean>(false);
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  
  // User Management State
  const [userManagement, setUserManagement] = useState<UserManagementState>({
    admins: [],
    staff: [],
    students: [],
    loading: false,
    searchTerm: '',
    currentPage: { admins: 1, staff: 1, students: 1 },
    itemsPerPage: 10,
    showAddModal: { admins: false, staff: false, students: false },
    newUser: {
      email: '',
      password: '',
      fullName: '',
      role: 'admin'
    },
    isCreating: false
  });

  // Load colleges on component mount
  useEffect(() => {
    const loadColleges = async () => {
      try {
        const { data, error } = await supabase
          .from('colleges')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setColleges(data || []);
      } catch (error) {
        console.error('Error loading colleges:', error);
        toast({
          title: "Error",
          description: "Failed to load colleges",
          variant: "destructive"
        });
      }
    };

    loadColleges();
  }, []);

  // Load users when college changes
  useEffect(() => {
    if (userCollege?.id) {
      loadUsers();
      loadPendingAdmissions();
    }
  }, [userCollege?.id]);

  // Load users from Supabase
  const loadUsers = async () => {
    if (!userCollege?.id) return;

    setUserManagement(prev => ({ ...prev, loading: true }));

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
            colleges!inner(name)
          `)
          .eq('college_id', userCollege.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('staff')
          .select(`
            id,
            user_id,
            email,
            college_id,
            created_at,
            updated_at,
            colleges!inner(name)
          `)
          .eq('college_id', userCollege.id)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('students')
          .select(`
            id,
            user_id,
            email,
            college_id,
            created_at,
            updated_at,
            colleges!inner(name)
          `)
          .eq('college_id', userCollege.id)
          .order('created_at', { ascending: false })
      ]);

      if (adminsResult.error) throw adminsResult.error;
      if (staffResult.error) throw staffResult.error;
      if (studentsResult.error) throw studentsResult.error;

      setUserManagement(prev => ({
        ...prev,
        admins: adminsResult.data || [],
        staff: staffResult.data || [],
        students: studentsResult.data || [],
        loading: false
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
      setUserManagement(prev => ({ ...prev, loading: false }));
    }
  };

  // Load pending admissions
  const loadPendingAdmissions = async () => {
    if (!userCollege?.id) return;
    setIsLoadingAdmissions(true);
    try {
      const { data, error } = await supabase
        .from('pending_admissions')
        .select('*')
        .eq('college_id', userCollege.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendingAdmissions(data || []);
    } catch (error) {
      console.error('Error loading pending admissions:', error);
      toast({ title: 'Error', description: 'Failed to load pending applications', variant: 'destructive' });
    } finally {
      setIsLoadingAdmissions(false);
    }
  };

  const extractField = (app: any, key: string) => {
    // Try common paths: top-level, data JSON, different casings
    if (!app) return '';
    const d = app.data || app.application_data || {};
    return (
      app[key] || d[key] || app[key.toLowerCase?.()] || d[key.toLowerCase?.()] || ''
    );
  };

  const getApplicantName = (app: any) => {
    return extractField(app, 'full_name') || extractField(app, 'name') || extractField(app, 'first_name') + (extractField(app, 'last_name') ? ` ${extractField(app, 'last_name')}` : '') || extractField(app, 'applicant_name') || extractField(app, 'guardian_name') || 'Unknown';
  };

  const getApplicantEmail = (app: any) => {
    return extractField(app, 'email') || extractField(app, 'applicant_email') || '';
  };

  const openDetails = (app: any) => {
    setSelectedApplication(app);
    setRejectReason('');
    setIsDetailsOpen(true);
  };

  const approveApplication = async () => {
    if (!selectedApplication || !userCollege?.id) return;
    const email = getApplicantEmail(selectedApplication);
    const fullName = getApplicantName(selectedApplication);
    if (!email) {
      toast({ title: 'Missing Email', description: 'Application has no email address.', variant: 'destructive' });
      return;
    }
    try {
      // Create Auth user with default password
      const defaultPassword = 'Welcome@123';
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });
      if (authError) throw authError;

      // Insert into students table
      const { error: insertStudentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          email,
          college_id: userCollege.id
        });
      if (insertStudentError) throw insertStudentError;

      // Remove from pending
      const { error: deleteError } = await supabase
        .from('pending_admissions')
        .delete()
        .eq('id', selectedApplication.id);
      if (deleteError) throw deleteError;

      toast({ title: 'Approved', description: 'Application approved and student created.' });
      setIsDetailsOpen(false);
      setSelectedApplication(null);
      loadPendingAdmissions();
      // Optionally refresh users list
      loadUsers();
    } catch (error: any) {
      console.error('Approve error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to approve application', variant: 'destructive' });
    }
  };

  const rejectApplication = async () => {
    if (!selectedApplication || !userCollege?.id) return;
    if (!rejectReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a rejection reason.', variant: 'destructive' });
      return;
    }
    try {
      const adminName = (profile && (profile as any).full_name) || (profile && (profile as any).email) || user?.email || 'Admin';
      // Insert into rejected_admissions with a copy of data
      const { error: rejectInsertError } = await supabase
        .from('rejected_admissions')
        .insert({
          college_id: userCollege.id,
          email: getApplicantEmail(selectedApplication),
          rejected_by: adminName,
          rejected_reason: rejectReason,
          rejected_at: new Date().toISOString(),
          application_data: selectedApplication
        });
      if (rejectInsertError) throw rejectInsertError;

      // Remove from pending
      const { error: deleteError } = await supabase
        .from('pending_admissions')
        .delete()
        .eq('id', selectedApplication.id);
      if (deleteError) throw deleteError;

      toast({ title: 'Rejected', description: 'Application has been rejected.' });
      setIsDetailsOpen(false);
      setSelectedApplication(null);
      setRejectReason('');
      loadPendingAdmissions();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to reject application', variant: 'destructive' });
    }
  };

  // Create new user using Supabase Admin API
  const createNewUser = async (role: 'admin' | 'staff' | 'student') => {
    const { email, password, fullName } = userManagement.newUser;

    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Email and password are required",
        variant: "destructive"
      });
      return;
    }

    if (!userCollege?.id) {
      toast({
        title: "Error",
        description: "No college selected",
        variant: "destructive"
      });
      return;
    }

    setUserManagement(prev => ({ ...prev, isCreating: true }));

    try {
      // Create user in Supabase Auth using admin client
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0]
        }
      });

      if (authError) throw authError;

      // Insert user into appropriate role table
      const tableName = role === 'admin' ? 'admins' : role === 'staff' ? 'staff' : 'students';
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({
          user_id: authData.user.id,
          email,
          college_id: userCollege.id
        });

      if (insertError) throw insertError;

      // Update profile if full name provided
      if (fullName) {
        await supabase
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email,
            full_name: fullName
          });
      }

      toast({
        title: "Success",
        description: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`
      });

      // Reset form and close modal
      setUserManagement(prev => ({
        ...prev,
        newUser: { email: '', password: '', fullName: '', role: 'admin' },
        showAddModal: { ...prev.showAddModal, [role]: false },
        isCreating: false
      }));

      // Reload users
      loadUsers();

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive"
      });
      setUserManagement(prev => ({ ...prev, isCreating: false }));
    }
  };

  // Delete user
  const deleteUser = async (userId: string, role: 'admin' | 'staff' | 'student') => {
    try {
      // Delete from role table
      const tableName = role === 'admin' ? 'admins' : role === 'staff' ? 'staff' : 'students';
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Delete from auth.users using admin client
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      toast({
        title: "Success",
        description: "User deleted successfully"
      });

      // Reload users
      loadUsers();

    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  // Filter users based on search term
  const getFilteredUsers = (users: User[], searchTerm: string) => {
    if (!searchTerm) return users;
    return users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  // Paginate users
  const getPaginatedUsers = (users: User[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return users.slice(startIndex, startIndex + itemsPerPage);
  };

  // Dashboard stats can be wired to real data later; remove hardcoded admissions-related content
  const stats = [
    { title: 'Total Students', value: userManagement.students.length.toString(), change: '', icon: Users, color: 'dashboard-stat1' },
    { title: 'New Admissions', value: (pendingAdmissions?.length || 0).toString(), change: '', icon: FileText, color: 'dashboard-stat2' },
    { title: 'Hostel Occupancy', value: '-', change: '', icon: Building2, color: 'dashboard-stat3' },
    { title: 'Fees Collected', value: '-', change: '', icon: DollarSign, color: 'dashboard-stat4' },
  ];

  const handleStatClick = (statTitle) => {
    switch(statTitle) {
      case 'Total Students':
        setActiveSection('admissions');
        break;
      case 'New Admissions':
        setActiveSection('admissions');
        break;
      case 'Hostel Occupancy':
        setActiveSection('hostel');
        break;
      case 'Fees Collected':
        setActiveSection('fees');
        break;
    }
    toast({
      title: "Section Updated",
      description: `Switched to ${statTitle.toLowerCase()} section`,
    });
  };

  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-card-border"
            onClick={() => handleStatClick(stat.title)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 text-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-success">{stat.change}</span> from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Pending admissions awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingAdmissions ? (
                <div className="text-sm text-muted-foreground">Loading applications...</div>
              ) : (
                (pendingAdmissions || []).slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                      <div className="font-medium">{getApplicantName(app)}</div>
                      <div className="text-sm text-muted-foreground">{getApplicantEmail(app)}</div>
                  </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Pending</Badge>
                      <Button variant="outline" size="sm" onClick={() => openDetails(app)}>View Details</Button>
                </div>
                  </div>
                ))
              )}
              {!isLoadingAdmissions && (pendingAdmissions || []).length === 0 && (
                <div className="text-sm text-muted-foreground">No pending applications.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('admissions')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Student
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('fees')}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Manage Fees
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('reports')}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('hostel')}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Hostel Management
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAdmissions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admissions</h2>
          <p className="text-muted-foreground">Review and process pending applications</p>
        </div>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search applications by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoadingAdmissions ? [] : pendingAdmissions)
                .filter((app) => {
                  const name = getApplicantName(app).toLowerCase();
                  const email = getApplicantEmail(app).toLowerCase();
                  const q = searchTerm.toLowerCase();
                  return !q || name.includes(q) || email.includes(q);
                })
                .map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{getApplicantName(app)}</TableCell>
                    <TableCell>{getApplicantEmail(app)}</TableCell>
                    <TableCell>{app.created_at ? new Date(app.created_at).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDetails(app)}>
                          <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {isLoadingAdmissions && (
            <div className="text-sm text-muted-foreground mt-4">Loading applications...</div>
          )}
          {!isLoadingAdmissions && pendingAdmissions.length === 0 && (
            <div className="text-sm text-muted-foreground mt-4">No pending applications.</div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>Review all details before decision.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-auto">
            {selectedApplication && (
              <div className="space-y-2">
                {Object.entries({ ...(selectedApplication.data || {}), ...selectedApplication })
                  .filter(([k]) => !['data', 'application_data'].includes(k))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <div className="text-sm text-muted-foreground capitalize whitespace-nowrap">{key.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-foreground break-all flex-1 text-right">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>
        </div>
                  ))}
      </div>
            )}
            <div className="space-y-2">
              <Label>Reject Reason</Label>
              <Textarea placeholder="Provide reason if rejecting" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
      </div>
          </div>
          <DialogFooter className="flex justify-between gap-2">
            <Button variant="destructive" onClick={rejectApplication}>
              Reject
                  </Button>
            <Button onClick={approveApplication}>
              Approve
                  </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderFees = () => (
    <FeesSection />
  );

  const renderHostel = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Hostel Management</h2>
          <p className="text-muted-foreground">Manage hostel rooms and student accommodation</p>
        </div>
        <Button onClick={() => toast({ title: "Room Assignment", description: "Room assignment interface opened" })}>
          <Building2 className="mr-2 h-4 w-4" />
          Assign Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 12 }, (_, i) => {
          const roomNumber = 101 + i;
          const isOccupied = i % 3 !== 0;
          return (
            <Card 
              key={roomNumber} 
              className={`cursor-pointer hover:shadow-md transition-all border-card-border ${
                isOccupied ? 'bg-destructive/10' : 'bg-success/10'
              }`}
              onClick={() => toast({ 
                title: `Room ${roomNumber}`, 
                description: isOccupied ? 'Room details opened' : 'Room available for assignment' 
              })}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="font-semibold">Room {roomNumber}</div>
                  <div className={`text-sm ${isOccupied ? 'text-destructive' : 'text-success'}`}>
                    {isOccupied ? 'Occupied' : 'Available'}
                  </div>
                  {isOccupied && (
                    <div className="text-xs text-muted-foreground mt-1">
                      2/4 beds occupied
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Hostel Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">1,956</div>
              <div className="text-sm text-muted-foreground">Total Residents</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">144</div>
              <div className="text-sm text-muted-foreground">Available Beds</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">93.1%</div>
              <div className="text-sm text-muted-foreground">Occupancy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Exam Management</h2>
          <p className="text-muted-foreground">Schedule exams and manage results</p>
        </div>
        <Button onClick={() => toast({ title: "Exam Scheduled", description: "New exam has been scheduled" })}>
          <Calendar className="mr-2 h-4 w-4" />
          Schedule Exam
        </Button>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
          <TabsTrigger value="results">Results Entry</TabsTrigger>
          <TabsTrigger value="reports">Result Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription>Scheduled examinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { subject: 'Mathematics', date: 'Dec 20, 2024', time: '10:00 AM', duration: '3 hours' },
                  { subject: 'Physics', date: 'Dec 22, 2024', time: '2:00 PM', duration: '3 hours' },
                  { subject: 'Chemistry', date: 'Dec 24, 2024', time: '10:00 AM', duration: '3 hours' },
                ].map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="font-medium">{exam.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {exam.date} at {exam.time} • {exam.duration}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Enter Results</CardTitle>
              <CardDescription>Enter exam results for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Subject</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="math">Mathematics</SelectItem>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="btech1">B.Tech 1st Year</SelectItem>
                        <SelectItem value="btech2">B.Tech 2nd Year</SelectItem>
                        <SelectItem value="btech3">B.Tech 3rd Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => toast({ title: "Results Entered", description: "Exam results have been saved" })}>
                  Load Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Result Reports</CardTitle>
              <CardDescription>Generate and download result reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Semester Results', description: 'Complete semester examination results' },
                    { title: 'Subject-wise Analysis', description: 'Performance analysis by subject' },
                    { title: 'Class Performance', description: 'Overall class performance report' },
                    { title: 'Grade Distribution', description: 'Distribution of grades across students' },
                  ].map((report, index) => (
                    <Card key={index} className="border-card-border">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{report.title}</div>
                            <div className="text-sm text-muted-foreground">{report.description}</div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toast({ title: "Report Downloaded", description: `${report.title} downloaded successfully` })}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-muted-foreground">Generate comprehensive reports and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Student Report', description: 'Complete student database report', icon: Users },
          { title: 'Financial Report', description: 'Fee collection and financial summary', icon: DollarSign },
          { title: 'Academic Report', description: 'Academic performance and results', icon: FileText },
          { title: 'Hostel Report', description: 'Hostel occupancy and management', icon: Building2 },
          { title: 'Attendance Report', description: 'Student and staff attendance analysis', icon: Calendar },
          { title: 'Custom Report', description: 'Build your own custom reports', icon: BarChart3 },
        ].map((report, index) => (
          <Card key={index} className="border-card-border cursor-pointer hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{report.title}</div>
                  <div className="text-sm text-muted-foreground">{report.description}</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: "Report Generated", description: `${report.title} generated successfully` })}
                >
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toast({ title: "Export Complete", description: `${report.title} exported to CSV` })}
                >
                  CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">Manage system configuration and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="backup">Backup & Security</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-card-border">
              <CardHeader>
                <CardTitle>Institution Info</CardTitle>
                <CardDescription>Read-only details of your institution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Institution Name</div>
                    <div className="text-sm font-medium">{userCollege?.name || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Contact Email</div>
                    <div className="text-sm font-medium">{(userCollege as any)?.contact_email || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Phone Number</div>
                    <div className="text-sm font-medium">{(userCollege as any)?.contact_phone || '—'}</div>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Address</div>
                    <div className="text-sm font-medium">{(userCollege as any)?.address || '—'}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground mb-2">Logo</div>
                    <div className="h-20 w-20 rounded bg-muted border flex items-center justify-center overflow-hidden">
                      {(userCollege as any)?.logo_url ? (
                        <img src={(userCollege as any).logo_url} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No Logo</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle>ERP Details</CardTitle>
                <CardDescription>Deployment and license information</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ERP Version</div>
                  <div className="text-sm font-medium">v1.0.0</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Update</div>
                  <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm text-muted-foreground">License</div>
                  <div className="text-sm font-medium">Community (Non-commercial)</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle>System Info</CardTitle>
                <CardDescription>Runtime and module status</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Server</div>
                  <div className="text-sm font-medium">Vercel/Node (client) + Supabase</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Database</div>
                  <div className="text-sm font-medium">Supabase Postgres</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-sm text-muted-foreground">Active Modules</div>
                  <div className="text-sm font-medium">Admissions, Users, Fees, Exams, Reports, Hostel</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardHeader>
                <CardTitle>Important Links</CardTitle>
                <CardDescription>Help and policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Help / Documentation</div>
                  <a className="text-sm text-primary underline" href="#" target="_blank" rel="noreferrer">Open</a>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Support Contact</div>
                  <a className="text-sm text-primary underline" href="mailto:support@example.com">support@example.com</a>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">Terms & Policies</div>
                  <a className="text-sm text-primary underline" href="#" target="_blank" rel="noreferrer">View</a>
                </div>
              </CardContent>
            </Card>

            
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and roles for {userCollege?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Admins Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Administrators</h3>
                    <Dialog 
                      open={userManagement.showAddModal.admins} 
                      onOpenChange={(open) => 
                        setUserManagement(prev => ({
                          ...prev,
                          showAddModal: { ...prev.showAddModal, admins: open },
                          newUser: { ...prev.newUser, role: 'admin' }
                        }))
                      }
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Administrator</DialogTitle>
                          <DialogDescription>
                            Create a new administrator account for {userCollege?.name}
                          </DialogDescription>
                        </DialogHeader>
              <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Full Name (Optional)</Label>
                            <Input
                              value={userManagement.newUser.fullName}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, fullName: e.target.value }
                              }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              value={userManagement.newUser.email}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, email: e.target.value }
                              }))}
                              placeholder="Enter email address"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                              value={userManagement.newUser.password}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, password: e.target.value }
                              }))}
                              placeholder="Enter password"
                              type="password"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => createNewUser('admin')}
                            disabled={userManagement.isCreating}
                          >
                            {userManagement.isCreating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Admin'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search administrators..."
                        value={userManagement.searchTerm}
                        onChange={(e) => setUserManagement(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Admins Table */}
                  <Card className="border-card-border">
                    <CardContent className="p-0">
                      {userManagement.loading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading administrators...</span>
                        </div>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getPaginatedUsers(
                                getFilteredUsers(userManagement.admins, userManagement.searchTerm),
                                userManagement.currentPage.admins,
                                userManagement.itemsPerPage
                              ).map((admin) => (
                                <TableRow key={admin.id}>
                                  <TableCell className="font-medium">
                                    {admin.full_name || admin.email.split('@')[0]}
                                  </TableCell>
                                  <TableCell>{admin.email}</TableCell>
                                  <TableCell>
                                    {new Date(admin.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteUser(admin.user_id, 'admin')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {/* Pagination */}
                          {getFilteredUsers(userManagement.admins, userManagement.searchTerm).length > userManagement.itemsPerPage && (
                            <div className="flex items-center justify-between p-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                Showing {((userManagement.currentPage.admins - 1) * userManagement.itemsPerPage) + 1} to{' '}
                                {Math.min(userManagement.currentPage.admins * userManagement.itemsPerPage, getFilteredUsers(userManagement.admins, userManagement.searchTerm).length)} of{' '}
                                {getFilteredUsers(userManagement.admins, userManagement.searchTerm).length} administrators
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, admins: Math.max(1, prev.currentPage.admins - 1) }
                                  }))}
                                  disabled={userManagement.currentPage.admins === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, admins: prev.currentPage.admins + 1 }
                                  }))}
                                  disabled={userManagement.currentPage.admins * userManagement.itemsPerPage >= getFilteredUsers(userManagement.admins, userManagement.searchTerm).length}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Staff Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Staff</h3>
                    <Dialog 
                      open={userManagement.showAddModal.staff} 
                      onOpenChange={(open) => 
                        setUserManagement(prev => ({
                          ...prev,
                          showAddModal: { ...prev.showAddModal, staff: open },
                          newUser: { ...prev.newUser, role: 'staff' }
                        }))
                      }
                    >
                      <DialogTrigger asChild>
                        <Button>
                  <Plus className="mr-2 h-4 w-4" />
                          Add Staff
                </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Staff Member</DialogTitle>
                          <DialogDescription>
                            Create a new staff account for {userCollege?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Full Name (Optional)</Label>
                            <Input
                              value={userManagement.newUser.fullName}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, fullName: e.target.value }
                              }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              value={userManagement.newUser.email}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, email: e.target.value }
                              }))}
                              placeholder="Enter email address"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                              value={userManagement.newUser.password}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, password: e.target.value }
                              }))}
                              placeholder="Enter password"
                              type="password"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => createNewUser('staff')}
                            disabled={userManagement.isCreating}
                          >
                            {userManagement.isCreating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Staff'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search staff..."
                        value={userManagement.searchTerm}
                        onChange={(e) => setUserManagement(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Staff Table */}
                  <Card className="border-card-border">
                    <CardContent className="p-0">
                      {userManagement.loading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading staff...</span>
                        </div>
                      ) : (
                        <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                                <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                              {getPaginatedUsers(
                                getFilteredUsers(userManagement.staff, userManagement.searchTerm),
                                userManagement.currentPage.staff,
                                userManagement.itemsPerPage
                              ).map((staff) => (
                                <TableRow key={staff.id}>
                                  <TableCell className="font-medium">
                                    {staff.full_name || staff.email.split('@')[0]}
                                  </TableCell>
                                  <TableCell>{staff.email}</TableCell>
                                  <TableCell>
                                    {new Date(staff.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteUser(staff.user_id, 'staff')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          
                          {/* Pagination */}
                          {getFilteredUsers(userManagement.staff, userManagement.searchTerm).length > userManagement.itemsPerPage && (
                            <div className="flex items-center justify-between p-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                Showing {((userManagement.currentPage.staff - 1) * userManagement.itemsPerPage) + 1} to{' '}
                                {Math.min(userManagement.currentPage.staff * userManagement.itemsPerPage, getFilteredUsers(userManagement.staff, userManagement.searchTerm).length)} of{' '}
                                {getFilteredUsers(userManagement.staff, userManagement.searchTerm).length} staff
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, staff: Math.max(1, prev.currentPage.staff - 1) }
                                  }))}
                                  disabled={userManagement.currentPage.staff === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, staff: prev.currentPage.staff + 1 }
                                  }))}
                                  disabled={userManagement.currentPage.staff * userManagement.itemsPerPage >= getFilteredUsers(userManagement.staff, userManagement.searchTerm).length}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Students Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Students</h3>
                    <Dialog 
                      open={userManagement.showAddModal.students} 
                      onOpenChange={(open) => 
                        setUserManagement(prev => ({
                          ...prev,
                          showAddModal: { ...prev.showAddModal, students: open },
                          newUser: { ...prev.newUser, role: 'student' }
                        }))
                      }
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Student
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Student</DialogTitle>
                          <DialogDescription>
                            Create a new student account for {userCollege?.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Full Name (Optional)</Label>
                            <Input
                              value={userManagement.newUser.fullName}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, fullName: e.target.value }
                              }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              value={userManagement.newUser.email}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, email: e.target.value }
                              }))}
                              placeholder="Enter email address"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                              value={userManagement.newUser.password}
                              onChange={(e) => setUserManagement(prev => ({
                                ...prev,
                                newUser: { ...prev.newUser, password: e.target.value }
                              }))}
                              placeholder="Enter password"
                              type="password"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={() => createNewUser('student')}
                            disabled={userManagement.isCreating}
                          >
                            {userManagement.isCreating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Student'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Search Bar */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search students..."
                        value={userManagement.searchTerm}
                        onChange={(e) => setUserManagement(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Students Table */}
                  <Card className="border-card-border">
                    <CardContent className="p-0">
                      {userManagement.loading ? (
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="ml-2">Loading students...</span>
                        </div>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                    <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {getPaginatedUsers(
                                getFilteredUsers(userManagement.students, userManagement.searchTerm),
                                userManagement.currentPage.students,
                                userManagement.itemsPerPage
                              ).map((student) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-medium">
                                    {student.full_name || student.email.split('@')[0]}
                                  </TableCell>
                                  <TableCell>{student.email}</TableCell>
                      <TableCell>
                                    {new Date(student.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteUser(student.user_id, 'student')}
                                      >
                                        <Trash2 className="h-4 w-4" />
                        </Button>
                                    </div>
                      </TableCell>
                    </TableRow>
                              ))}
                  </TableBody>
                </Table>
                          
                          {/* Pagination */}
                          {getFilteredUsers(userManagement.students, userManagement.searchTerm).length > userManagement.itemsPerPage && (
                            <div className="flex items-center justify-between p-4 border-t">
                              <div className="text-sm text-muted-foreground">
                                Showing {((userManagement.currentPage.students - 1) * userManagement.itemsPerPage) + 1} to{' '}
                                {Math.min(userManagement.currentPage.students * userManagement.itemsPerPage, getFilteredUsers(userManagement.students, userManagement.searchTerm).length)} of{' '}
                                {getFilteredUsers(userManagement.students, userManagement.searchTerm).length} students
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, students: Math.max(1, prev.currentPage.students - 1) }
                                  }))}
                                  disabled={userManagement.currentPage.students === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setUserManagement(prev => ({
                                    ...prev,
                                    currentPage: { ...prev.currentPage, students: prev.currentPage.students + 1 }
                                  }))}
                                  disabled={userManagement.currentPage.students * userManagement.itemsPerPage >= getFilteredUsers(userManagement.students, userManagement.searchTerm).length}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Backup & Security</CardTitle>
              <CardDescription>Data backup and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-card-border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="font-medium">Last Backup</div>
                      <div className="text-sm text-muted-foreground">Dec 15, 2024 at 2:00 AM</div>
                      <Button 
                        className="mt-2" 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast({ title: "Backup Started", description: "System backup has been initiated" })}
                      >
                        Create Backup
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-card-border">
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="font-medium">Security Status</div>
                      <div className="text-sm text-success">All systems secure</div>
                      <Button className="mt-2" variant="outline" size="sm">
                        Security Scan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return renderDashboardHome();
      case 'admissions':
        return renderAdmissions();
      case 'fees':
        return renderFees();
      case 'hostel':
        return renderHostel();
      case 'exams':
        return renderExams();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboardHome();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        role="admin" 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
        admissionsPendingCount={pendingAdmissions.length}
      />
      
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;