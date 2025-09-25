import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  ArrowLeft, 
  LogIn, 
  Eye, 
  EyeOff,
  User,
  Users,
  UserCheck,
  Shield
} from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState<{
    role: string;
    email: string;
    password: string;
    rememberMe: boolean;
  }>({
    role: "",
    email: "",
    password: "",
    rememberMe: false
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const roles = [
    { value: "admin", label: "Administrator", icon: Shield, description: "Full system access" },
    { value: "staff", label: "Staff Member", icon: Users, description: "Academic & administrative" },
    { value: "student", label: "Student", icon: User, description: "Student portal access" }
  ];

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.role) newErrors.role = "Please select a role";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = () => {
    if (!validateForm()) return;

    // Simulate login process
    toast({
      title: "Login Successful!",
      description: `Welcome back! Redirecting to ${formData.role} dashboard...`,
    });

    setTimeout(() => {
      switch(formData.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'staff':
          navigate('/staff');
          break;
        case 'student':
          navigate('/student');
          break;
        default:
          navigate('/');
      }
    }, 1500);
  };

  const handleForgotPassword = () => {
    if (!forgotPasswordEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Reset Link Sent!",
      description: "Check your email for password reset instructions",
    });
    
    setShowForgotPassword(false);
    setForgotPasswordEmail("");
  };

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-full max-w-md px-4">
          <Card className="border-card-border">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email Address</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Button onClick={handleForgotPassword} className="w-full">
                    Send Reset Link
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <Link to="/register">
              <Button variant="outline" size="sm">
                Register College
              </Button>
            </Link>
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
            <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="mt-2 text-muted-foreground">
              Sign in to your EduERP account
            </p>
          </div>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Login to Dashboard</CardTitle>
              <CardDescription>
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                    <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center space-x-2">
                            <role.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-muted-foreground">{role.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-destructive">{errors.role}</p>}
                </div>

                {/* Role Description */}
                {formData.role && (
                  <div className="p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const role = roles.find(r => r.value === formData.role);
                        const IconComponent = role?.icon;
                        return IconComponent ? <IconComponent className="h-5 w-5 text-primary" /> : null;
                      })()}
                      <div>
                        <div className="font-medium">
                          {roles.find(r => r.value === formData.role)?.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {roles.find(r => r.value === formData.role)?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
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

                {/* Password */}
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

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => updateFormData('rememberMe', checked)}
                    />
                    <Label htmlFor="remember" className="text-sm">
                      Remember me
                    </Label>
                  </div>
                  <Button
                    variant="link"
                    className="px-0 text-sm"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>

                {/* Login Button */}
                <Button onClick={handleLogin} className="w-full" size="lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Button>

                {/* Demo Credentials */}
                {formData.role && (
                  <div className="mt-6 p-4 bg-accent/50 rounded-lg border border-border">
                    <div className="text-sm font-medium mb-2">Demo Credentials:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Email: {formData.role}@demo.edu</div>
                      <div>Password: demo123</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        updateFormData('email', `${formData.role}@demo.edu`);
                        updateFormData('password', 'demo123');
                      }}
                    >
                      Use Demo Credentials
                    </Button>
                  </div>
                )}

                {/* Register Link */}
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:underline font-medium">
                      Register your college
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;