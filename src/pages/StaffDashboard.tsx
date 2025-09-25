import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  Download,
  Save,
  Upload
} from "lucide-react";

const StaffDashboard = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');

  // Mock data
  const stats = [
    { title: 'Classes Assigned', value: '8', icon: Users, color: 'dashboard-stat1' },
    { title: 'Total Students', value: '340', icon: Users, color: 'dashboard-stat2' },
    { title: 'Pending Exams', value: '3', icon: FileText, color: 'dashboard-stat3' },
    { title: 'Attendance Rate', value: '87%', icon: CheckCircle, color: 'dashboard-stat4' },
  ];

  const students = [
    { id: 1, name: 'Aarav Sharma', rollNo: 'CS001', present: true },
    { id: 2, name: 'Priya Patel', rollNo: 'CS002', present: false },
    { id: 3, name: 'Rahul Kumar', rollNo: 'CS003', present: true },
    { id: 4, name: 'Ananya Singh', rollNo: 'CS004', present: true },
    { id: 5, name: 'Vikram Reddy', rollNo: 'CS005', present: false },
    { id: 6, name: 'Kavya Nair', rollNo: 'CS006', present: true },
  ];

  const [attendance, setAttendance] = useState(
    students.reduce((acc, student) => ({ ...acc, [student.id]: student.present }), {})
  );

  const handleAttendanceChange = (studentId, present) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const saveAttendance = () => {
    toast({
      title: "Attendance Saved",
      description: "Student attendance has been recorded successfully",
    });
  };

  const renderDashboardHome = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '9:00 AM', subject: 'Mathematics', class: 'B.Tech CSE 2nd Year', room: 'Room 101' },
                { time: '11:00 AM', subject: 'Physics', class: 'B.Tech CSE 1st Year', room: 'Room 205' },
                { time: '2:00 PM', subject: 'Chemistry', class: 'B.Tech CSE 2nd Year', room: 'Lab 301' },
              ].map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium">{schedule.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {schedule.class} • {schedule.room}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{schedule.time}</div>
                </div>
              ))}
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
                onClick={() => setActiveSection('attendance')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Mark Attendance
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('exams')}
              >
                <FileText className="mr-2 h-4 w-4" />
                Enter Exam Marks
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setActiveSection('reports')}
              >
                <Download className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance Management</h2>
        <p className="text-muted-foreground">Mark and manage student attendance</p>
      </div>

      <Card className="border-card-border">
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select class and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="btech-cse-1">B.Tech CSE 1st Year</SelectItem>
                  <SelectItem value="btech-cse-2">B.Tech CSE 2nd Year</SelectItem>
                  <SelectItem value="btech-cse-3">B.Tech CSE 3rd Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
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
              <Label>Date</Label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>
          </div>

          {selectedClass && selectedSubject && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Student List</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newAttendance = {};
                      students.forEach(student => newAttendance[student.id] = true);
                      setAttendance(newAttendance);
                    }}
                  >
                    Mark All Present
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const newAttendance = {};
                      students.forEach(student => newAttendance[student.id] = false);
                      setAttendance(newAttendance);
                    }}
                  >
                    Mark All Absent
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">Roll No: {student.rollNo}</div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`present-${student.id}`}
                          checked={attendance[student.id]}
                          onCheckedChange={(checked) => handleAttendanceChange(student.id, checked)}
                        />
                        <Label htmlFor={`present-${student.id}`}>Present</Label>
                      </div>
                      <Badge variant={attendance[student.id] ? "default" : "secondary"}>
                        {attendance[student.id] ? "Present" : "Absent"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Attendance
                </Button>
                <Button onClick={saveAttendance}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderExams = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exam Management</h2>
        <p className="text-muted-foreground">Enter and manage exam marks</p>
      </div>

      <Tabs defaultValue="enter-marks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enter-marks">Enter Marks</TabsTrigger>
          <TabsTrigger value="view-results">View Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="enter-marks">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Enter Exam Marks</CardTitle>
              <CardDescription>Enter marks for students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Select Exam</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mid-sem">Mid Semester</SelectItem>
                      <SelectItem value="end-sem">End Semester</SelectItem>
                      <SelectItem value="internal">Internal Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
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
                  <Label>Maximum Marks</Label>
                  <Input placeholder="100" />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Marks Obtained</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.rollNo}</TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>
                        <Input className="w-20" placeholder="0" />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">-</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4">
                <Button onClick={() => toast({ title: "Marks Saved", description: "Exam marks have been saved successfully" })}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Marks
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="view-results">
          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Exam Results</CardTitle>
              <CardDescription>View previously entered results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select exam to view results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="math-mid">Mathematics - Mid Semester</SelectItem>
                    <SelectItem value="physics-mid">Physics - Mid Semester</SelectItem>
                    <SelectItem value="chem-mid">Chemistry - Mid Semester</SelectItem>
                  </SelectContent>
                </Select>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Marks</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>CS001</TableCell>
                      <TableCell>Aarav Sharma</TableCell>
                      <TableCell>85/100</TableCell>
                      <TableCell><Badge>A</Badge></TableCell>
                      <TableCell><Badge variant="default">Pass</Badge></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CS002</TableCell>
                      <TableCell>Priya Patel</TableCell>
                      <TableCell>78/100</TableCell>
                      <TableCell><Badge>B+</Badge></TableCell>
                      <TableCell><Badge variant="default">Pass</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Generate and export reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { 
            title: 'Attendance Report', 
            description: 'Student attendance summary', 
            icon: Clock,
            action: () => toast({ title: "Report Generated", description: "Attendance report exported successfully" })
          },
          { 
            title: 'Marks Report', 
            description: 'Exam results and grades', 
            icon: FileText,
            action: () => toast({ title: "Report Generated", description: "Marks report exported successfully" })
          },
          { 
            title: 'Class Performance', 
            description: 'Overall class analysis', 
            icon: Users,
            action: () => toast({ title: "Report Generated", description: "Performance report exported successfully" })
          },
          { 
            title: 'Subject Analysis', 
            description: 'Subject-wise performance', 
            icon: Calendar,
            action: () => toast({ title: "Report Generated", description: "Subject analysis exported successfully" })
          },
        ].map((report, index) => (
          <Card key={index} className="border-card-border">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <report.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{report.title}</div>
                  <div className="text-sm text-muted-foreground">{report.description}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={report.action}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={report.action}>
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeSection) {
      case 'dashboard':
        return renderDashboardHome();
      case 'attendance':
        return renderAttendance();
      case 'exams':
        return renderExams();
      case 'reports':
        return renderReports();
      default:
        return renderDashboardHome();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        role="staff" 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="lg:ml-64 transition-all duration-300">
        <main className="p-4 lg:p-8 pt-16 lg:pt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;