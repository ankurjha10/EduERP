import { useEffect, useState } from "react";
import DashboardSidebar from '@/components/DashboardSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Building2, 
  FileText, 
  User,
  Calendar,
  Clock,
  CheckCircle,
  CreditCard,
  Download,
  Eye,
  Book,
  Award
} from "lucide-react";

const StudentDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [profileData, setProfileData] = useState({
    name: '',
    rollNo: '',
    course: '',
    year: '',
    email: '',
    phone: '',
    address: '',
    guardianName: '',
    guardianPhone: ''
  });

  const [studentRecord, setStudentRecord] = useState<any | null>(null);
  const [collegeName, setCollegeName] = useState<string>('');
  const [admissionDate, setAdmissionDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Dynamic placeholders until respective tables are implemented
  const stats: Array<{ title: string; value: string; icon: any; color: string }> = [];
  const feeDetails: Array<{ type: string; amount: number; dueDate: string; status: string }> = [];
  const examSchedule: Array<{ subject: string; date: string; time: string; duration: string; room: string }> = [];
  const results: Array<{ subject: string; marks: string; grade: string; credits: number }> = [];

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user?.id) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('students')
          .select(`
            id, user_id, email, college_id, created_at,
            full_name, dob, gender, nationality,
            id_type, id_number, mobile,
            address_current, address_permanent,
            program, specialization, category,
            father_name, father_occupation, mother_name, mother_occupation,
            guardian_name, guardian_relationship,
            parent_email, parent_mobile,
            academic, documents, photo_url, admission_date,
            colleges(name)
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setStudentRecord(data);
        const fetchedCollegeName = (data as any)?.colleges?.name || '';
        setCollegeName(fetchedCollegeName);
        const admitted = (data as any)?.admission_date || data?.created_at;
        setAdmissionDate(admitted ? new Date(admitted as string).toLocaleDateString() : '');

        setProfileData(prev => ({
          ...prev,
          name: (data as any)?.full_name || profile?.full_name || prev.name,
          email: (data as any)?.email || profile?.email || prev.email,
          phone: (data as any)?.mobile || prev.phone,
          address: (data as any)?.address_current || prev.address,
          guardianName: (data as any)?.guardian_name || prev.guardianName,
          guardianPhone: (data as any)?.parent_mobile || prev.guardianPhone,
          course: (data as any)?.specialization || prev.course,
          year: prev.year,
          rollNo: prev.rollNo,
        }));
      } catch (e: any) {
        setError(e?.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.full_name, profile?.email]);

  const handlePayment = (feeType, amount) => {
    toast({
      title: "Payment Initiated",
      description: `Payment of ₹${amount} for ${feeType} has been processed successfully`,
    });
  };

  // Profile is read-only for students; no save allowed

  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6 border border-card-border">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {profileData.name || 'Student'}!</h1>
        <p className="text-muted-foreground">
          {collegeName ? `${collegeName} • ` : ''}{admissionDate ? `Admitted: ${admissionDate}` : ''}{(!collegeName && !admissionDate) ? '—' : ''}
        </p>
      </div>

      {/* Stats Grid */}
      {stats.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-card-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`h-8 w-8 rounded-full bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 text-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Your next examinations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examSchedule.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming exams</div>
              ) : (
                examSchedule.slice(0, 3).map((exam, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{exam.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {exam.date} at {exam.time}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveSection('exams')}
                  >
                    View Details
                  </Button>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('fees')}
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Pay Fees
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('hostel')}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Hostel Info
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('exams')}
              >
                <FileText className="mr-2 h-4 w-4" />
                View Results
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('profile')}
              >
                <User className="mr-2 h-4 w-4" />
                Update Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>This month</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const fallbackDemo = 87; // temporary demo value
            const raw = (studentRecord as any)?.academic?.attendance_percentage as number | undefined;
            const attendancePercent = (typeof raw === 'number' && raw >= 0 && raw <= 100) ? raw : fallbackDemo;
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Present</div>
                  <div className="text-lg font-semibold">{attendancePercent}%</div>
                </div>
                <Progress value={attendancePercent} />
                {raw === undefined && (
                  <div className="text-xs text-muted-foreground">Showing temporary demo data</div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );

  const renderFees = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Fee Management</h2>
        <p className="text-muted-foreground">View and pay your fees</p>
      </div>

      {/* Fee Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Total Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeDetails.length > 0 ? `₹${feeDetails.reduce((t, f) => t + f.amount, 0).toLocaleString()}` : '—'}</div>
            <p className="text-sm text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Amount Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">—</div>
            <p className="text-sm text-muted-foreground">No data</p>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">—</div>
            <p className="text-sm text-muted-foreground">No data</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee Details */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
          <CardDescription>Breakdown of your fees</CardDescription>
        </CardHeader>
        <CardContent>
          {feeDetails.length === 0 ? (
            <div className="text-sm text-muted-foreground">No fee data available</div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feeDetails.map((fee, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{fee.type}</TableCell>
                  <TableCell>₹{fee.amount.toLocaleString()}</TableCell>
                  <TableCell>{fee.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={fee.status === 'Paid' ? 'default' : 'secondary'}>
                      {fee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {fee.status === 'Pending' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePayment(fee.type, fee.amount)}
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Pay Now
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toast({ title: "Receipt Downloaded", description: "Payment receipt downloaded successfully" })}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderHostel = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hostel Information</h2>
        <p className="text-muted-foreground">Your hostel details and services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Room Details</CardTitle>
            <CardDescription>Your current accommodation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Room Number</Label>
                <div className="font-medium">101-A</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Block</Label>
                <div className="font-medium">Block A</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Floor</Label>
                <div className="font-medium">1st Floor</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Room Type</Label>
                <div className="font-medium">4-Sharing</div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Label className="text-sm text-muted-foreground">Roommates</Label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>Palak Mehta</span>
                  <Badge variant="outline">CS002</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>Anjali</span>
                  <Badge variant="outline">CS003</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">Vacant</span>
                  <Badge variant="secondary">Available</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Hostel Services</CardTitle>
            <CardDescription>Available facilities and services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { service: 'Mess Timings', details: 'Breakfast: 7-9 AM, Lunch: 12-2 PM, Dinner: 7-9 PM' },
                { service: 'Laundry', details: 'Available Monday, Wednesday, Friday' },
                { service: 'Wi-Fi', details: '24/7 High-speed internet access' },
                { service: 'Security', details: '24/7 Security with CCTV monitoring' },
                { service: 'Common Room', details: 'TV, Games, and Study area available' },
              ].map((item, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="font-medium">{item.service}</div>
                  <div className="text-sm text-muted-foreground">{item.details}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hostel Complaints/Requests */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
          <CardDescription>Submit and track maintenance requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => toast({ title: "Request Submitted", description: "Your maintenance request has been submitted" })}
            >
              Submit New Request
            </Button>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Electrical</TableCell>
                  <TableCell>Fan not working properly</TableCell>
                  <TableCell><Badge variant="secondary">In Progress</Badge></TableCell>
                  <TableCell>Dec 10, 2024</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Plumbing</TableCell>
                  <TableCell>Tap leakage in bathroom</TableCell>
                  <TableCell><Badge>Completed</Badge></TableCell>
                  <TableCell>Dec 5, 2024</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Examinations</h2>
        <p className="text-muted-foreground">Exam schedule and results</p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Exam Schedule</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>
        
        <TabsContent value="schedule">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription>Your examination schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {examSchedule.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No exam schedule available</div>
                ) : examSchedule.map((exam, index) => (
                  <Card key={index} className="border-card-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-lg">{exam.subject}</div>
                          <div className="text-sm text-muted-foreground">
                            <Clock className="inline h-4 w-4 mr-1" />
                            {exam.date} at {exam.time} • {exam.duration}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Building2 className="inline h-4 w-4 mr-1" />
                            {exam.room}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => toast({ title: "Exam Details", description: `Details for ${exam.subject} exam opened` })}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>Your latest examination results</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">No results available</TableCell>
                    </TableRow>
                  ) : (
                    results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.subject}</TableCell>
                      <TableCell>{result.marks}</TableCell>
                      <TableCell>
                        <Badge variant={result.grade.includes('A') ? 'default' : 'secondary'}>
                          {result.grade}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.credits}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toast({ title: "Result Card Downloaded", description: `Result card for ${result.subject} downloaded` })}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* Summary cards removed until dynamic data exists */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timetable">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Class Timetable</CardTitle>
              <CardDescription>Your weekly class schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">No timetable available</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Management</h2>
        <p className="text-muted-foreground">Update your personal information</p>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rollNo">Roll Number</Label>
              <Input
                id="rollNo"
                value={profileData.rollNo}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input
                id="course"
                value={profileData.course}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={profileData.year}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileData.address}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input
                id="guardianName"
                value={profileData.guardianName}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Guardian Phone</Label>
              <Input
                id="guardianPhone"
                value={profileData.guardianPhone}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* Read-only: save action removed for students */}
        </CardContent>
      </Card>

      {/* Academic Progress */}
      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Academic Progress</CardTitle>
          <CardDescription>Your academic journey overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">8.7</div>
              <div className="text-sm text-muted-foreground">Current CGPA</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">45/60</div>
              <div className="text-sm text-muted-foreground">Credits Completed</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">87%</div>
              <div className="text-sm text-muted-foreground">Attendance</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">2nd</div>
              <div className="text-sm text-muted-foreground">Current Year</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return renderDashboardHome();
      case 'fees':
        return renderFees();
      case 'hostel':
        return renderHostel();
      case 'exams':
        return renderExams();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboardHome();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        role="student" 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-8 pt-16 lg:pt-8">
          {error && (
            <div className="mb-4">
              <Alert variant="destructive">
                <AlertTitle>Failed to load</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading your dashboard...</div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;