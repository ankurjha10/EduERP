import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Menu, 
  X, 
  GraduationCap, 
  Users, 
  BookOpen, 
  BarChart3, 
  Shield, 
  Clock,
  ArrowRight,
  CheckCircle,
  Building2,
  UserCheck,
  FileSpreadsheet
} from "lucide-react";

const Landing = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student lifecycle management from admission to graduation with detailed profiles and progress tracking."
    },
    {
      icon: BookOpen,
      title: "Academic Management",
      description: "Streamline curriculum planning, exam scheduling, and result management with integrated academic workflows."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Real-time insights and comprehensive reports to make data-driven decisions for institutional growth."
    },
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security with role-based access control and compliance with educational standards."
    },
    {
      icon: Clock,
      title: "Time Management",
      description: "Automated scheduling, attendance tracking, and time management tools for efficient operations."
    },
    {
      icon: FileSpreadsheet,
      title: "Financial Management",
      description: "Complete fee management, financial reporting, and budget tracking with automated payment processing."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">EduERP</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <Link to="/auth">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register College</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a href="#features" className="block px-3 py-2 text-muted-foreground hover:text-foreground">Features</a>
              <a href="#about" className="block px-3 py-2 text-muted-foreground hover:text-foreground">About</a>
              <a href="#contact" className="block px-3 py-2 text-muted-foreground hover:text-foreground">Contact</a>
              <div className="flex flex-col space-y-2 px-3 pt-2">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">Register College</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Modern ERP Solution for
              <span className="block text-primary">Educational Institutions</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Streamline your college operations with our comprehensive ERP system. 
              Manage students, staff, academics, finances, and more from a single, 
              intuitive platform designed for modern educational institutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/apply">
                <Button size="lg" className="group">
                  Apply for Admission
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="lg">
                  View Demo Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Manage Your Institution
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive ERP solution covers all aspects of educational administration 
              with modern, user-friendly interfaces.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer border-card-border"
              >
                <CardHeader>
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose EduERP?
              </h2>
              <div className="space-y-4">
                {[
                  "Complete institutional management in one platform",
                  "Real-time analytics and reporting",
                  "Mobile-responsive design for anywhere access",
                  "Automated workflows and notifications",
                  "Secure data handling and backup",
                  "24/7 customer support"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/apply">
                  <Button size="lg">
                    Apply Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-card-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-dashboard-stat1" />
                    <CardTitle className="text-sm font-medium">Institutions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">500+</div>
                  <p className="text-xs text-muted-foreground">Trust our platform</p>
                </CardContent>
              </Card>
              <Card className="border-card-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-dashboard-stat2" />
                    <CardTitle className="text-sm font-medium">Students</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">50K+</div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                </CardContent>
              </Card>
              <Card className="border-card-border col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-dashboard-stat3" />
                    <CardTitle className="text-sm font-medium">Efficiency Improvement</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold">40%</div>
                  <p className="text-xs text-muted-foreground">Average operational efficiency increase</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">EduERP</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Empowering educational institutions with modern, efficient, 
                and user-friendly ERP solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground">Features</a></li>
                <li><Link to="/admin" className="text-muted-foreground hover:text-foreground">Demo</Link></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 EduERP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;