import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { 
  GraduationCap, 
  ArrowLeft, 
  LogIn, 
  Eye, 
  EyeOff,
  Loader2,
  Building2
} from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, userRole, signIn, getColleges, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    collegeId: ""
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colleges, setColleges] = useState<Array<{id: string, name: string, address?: string}>>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  // Load colleges on component mount
  useEffect(() => {
    const loadColleges = async () => {
      try {
        const collegesData = await getColleges();
        setColleges(collegesData);
      } catch (error) {
        console.error('Error loading colleges:', error);
      } finally {
        setCollegesLoading(false);
      }
    };

    loadColleges();
  }, [getColleges]);

  // Redirect if already authenticated (for users who are already logged in)
  useEffect(() => {
    if (user && userRole) {
      switch (userRole) {
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        case 'staff':
          navigate('/staff', { replace: true });
          break;
        case 'student':
          navigate('/student', { replace: true });
          break;
      }
    }
  }, [user, userRole, navigate]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.collegeId) {
      newErrors.collegeId = "College selection is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      const result = await signIn(formData.email, formData.password, formData.collegeId);
      
      // Handle immediate redirect after successful sign-in
      if (!result.error && result.userRole) {
        // Small delay to show the success toast
        setTimeout(() => {
          switch (result.userRole) {
            case 'admin':
              navigate('/admin', { replace: true });
              break;
            case 'staff':
              navigate('/staff', { replace: true });
              break;
            case 'student':
              navigate('/student', { replace: true });
              break;
          }
        }, 1500); // 1.5 second delay to show toast
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">EduERP</span>
            </Link>
            <div className="text-sm text-muted-foreground">
              EduERP Login
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-primary/10 p-3 rounded-full">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-foreground">
              Welcome Back
            </h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your EduERP account
            </p>
          </div>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>
                Sign In
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="collegeId">College *</Label>
                  <Select
                    value={formData.collegeId}
                    onValueChange={(value) => updateFormData('collegeId', value)}
                  >
                    <SelectTrigger className={errors.collegeId ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select your college" />
                    </SelectTrigger>
                    <SelectContent>
                      {collegesLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading colleges...</span>
                          </div>
                        </SelectItem>
                      ) : colleges.length === 0 ? (
                        <SelectItem value="no-colleges" disabled>
                          No colleges available - Please run the database migration first
                        </SelectItem>
                      ) : (
                        colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4" />
                              <span>{college.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.collegeId && <p className="text-sm text-destructive">{errors.collegeId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                    placeholder="Enter your email"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={isSubmitting || collegesLoading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Contact your college administrator for account access
                  </p>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;