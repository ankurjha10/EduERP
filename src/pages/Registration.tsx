import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  CheckCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  User
} from "lucide-react";

const Registration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<{
    collegeName: string;
    collegeCode: string;
    establishedYear: string;
    collegeType: string;
    affiliation: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    website: string;
    principalName: string;
    principalEmail: string;
    principalPhone: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    collegeLogo: string | null;
    affiliationCertificate: string | null;
    agreementAccepted: boolean;
  }>({
    collegeName: "",
    collegeCode: "",
    establishedYear: "",
    collegeType: "",
    affiliation: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    principalName: "",
    principalEmail: "",
    principalPhone: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    collegeLogo: null,
    affiliationCertificate: null,
    agreementAccepted: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateStep = (step: number) => {
    const newErrors: {[key: string]: string} = {};
    
    switch(step) {
      case 1:
        if (!formData.collegeName) newErrors.collegeName = "College name is required";
        if (!formData.collegeCode) newErrors.collegeCode = "College code is required";
        if (!formData.establishedYear) newErrors.establishedYear = "Established year is required";
        if (!formData.collegeType) newErrors.collegeType = "College type is required";
        if (!formData.affiliation) newErrors.affiliation = "Affiliation is required";
        break;
      case 2:
        if (!formData.address) newErrors.address = "Address is required";
        if (!formData.city) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.pincode) newErrors.pincode = "Pincode is required";
        if (!formData.phone) newErrors.phone = "Phone is required";
        if (!formData.email) newErrors.email = "Email is required";
        break;
      case 3:
        if (!formData.principalName) newErrors.principalName = "Principal name is required";
        if (!formData.principalEmail) newErrors.principalEmail = "Principal email is required";
        if (!formData.adminName) newErrors.adminName = "Admin name is required";
        if (!formData.adminEmail) newErrors.adminEmail = "Admin email is required";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (!formData.agreementAccepted) {
      setErrors({ agreement: "Please accept the terms and conditions" });
      return;
    }

    // Simulate registration process
    toast({
      title: "Registration Successful!",
      description: "Your college has been registered successfully. Redirecting to login...",
    });

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const handleFileUpload = (field) => {
    // Mock file upload
    setFormData({ ...formData, [field]: "uploaded_file.pdf" });
    toast({
      title: "File Uploaded",
      description: "File uploaded successfully!",
    });
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const steps = [
    { number: 1, title: "Basic Information", icon: Building2 },
    { number: 2, title: "Contact Details", icon: MapPin },
    { number: 3, title: "Administrative", icon: User },
    { number: 4, title: "Documents", icon: FileText }
  ];

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
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 
                    ${currentStep >= step.number 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : 'border-border text-muted-foreground bg-background'
                    }
                  `}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className="text-sm font-medium">{step.title}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-0.5 mx-4 
                    ${currentStep > step.number ? 'bg-primary' : 'bg-border'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-2xl">College Registration</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's start with basic information about your college"}
              {currentStep === 2 && "Please provide contact and location details"}
              {currentStep === 3 && "Add administrative contact information"}
              {currentStep === 4 && "Upload required documents and complete registration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="collegeName">College Name *</Label>
                  <Input
                    id="collegeName"
                    value={formData.collegeName}
                    onChange={(e) => updateFormData('collegeName', e.target.value)}
                    className={errors.collegeName ? 'border-destructive' : ''}
                    placeholder="Enter college name"
                  />
                  {errors.collegeName && <p className="text-sm text-destructive">{errors.collegeName}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="collegeCode">College Code *</Label>
                  <Input
                    id="collegeCode"
                    value={formData.collegeCode}
                    onChange={(e) => updateFormData('collegeCode', e.target.value)}
                    className={errors.collegeCode ? 'border-destructive' : ''}
                    placeholder="Enter college code"
                  />
                  {errors.collegeCode && <p className="text-sm text-destructive">{errors.collegeCode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year *</Label>
                  <Select value={formData.establishedYear} onValueChange={(value) => updateFormData('establishedYear', value)}>
                    <SelectTrigger className={errors.establishedYear ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 70 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.establishedYear && <p className="text-sm text-destructive">{errors.establishedYear}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collegeType">College Type *</Label>
                  <Select value={formData.collegeType} onValueChange={(value) => updateFormData('collegeType', value)}>
                    <SelectTrigger className={errors.collegeType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="arts">Arts & Science</SelectItem>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="commerce">Commerce</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.collegeType && <p className="text-sm text-destructive">{errors.collegeType}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="affiliation">University/Board Affiliation *</Label>
                  <Input
                    id="affiliation"
                    value={formData.affiliation}
                    onChange={(e) => updateFormData('affiliation', e.target.value)}
                    className={errors.affiliation ? 'border-destructive' : ''}
                    placeholder="Enter university or board name"
                  />
                  {errors.affiliation && <p className="text-sm text-destructive">{errors.affiliation}</p>}
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    className={errors.address ? 'border-destructive' : ''}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                  {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={errors.city ? 'border-destructive' : ''}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    className={errors.state ? 'border-destructive' : ''}
                    placeholder="Enter state"
                  />
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => updateFormData('pincode', e.target.value)}
                    className={errors.pincode ? 'border-destructive' : ''}
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    className={errors.phone ? 'border-destructive' : ''}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    className={errors.email ? 'border-destructive' : ''}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Administrative Details */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Principal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principalName">Principal Name *</Label>
                      <Input
                        id="principalName"
                        value={formData.principalName}
                        onChange={(e) => updateFormData('principalName', e.target.value)}
                        className={errors.principalName ? 'border-destructive' : ''}
                        placeholder="Enter principal name"
                      />
                      {errors.principalName && <p className="text-sm text-destructive">{errors.principalName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principalEmail">Principal Email *</Label>
                      <Input
                        id="principalEmail"
                        type="email"
                        value={formData.principalEmail}
                        onChange={(e) => updateFormData('principalEmail', e.target.value)}
                        className={errors.principalEmail ? 'border-destructive' : ''}
                        placeholder="Enter principal email"
                      />
                      {errors.principalEmail && <p className="text-sm text-destructive">{errors.principalEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="principalPhone">Principal Phone</Label>
                      <Input
                        id="principalPhone"
                        value={formData.principalPhone}
                        onChange={(e) => updateFormData('principalPhone', e.target.value)}
                        placeholder="Enter principal phone"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">System Administrator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminName">Admin Name *</Label>
                      <Input
                        id="adminName"
                        value={formData.adminName}
                        onChange={(e) => updateFormData('adminName', e.target.value)}
                        className={errors.adminName ? 'border-destructive' : ''}
                        placeholder="Enter admin name"
                      />
                      {errors.adminName && <p className="text-sm text-destructive">{errors.adminName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Admin Email *</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => updateFormData('adminEmail', e.target.value)}
                        className={errors.adminEmail ? 'border-destructive' : ''}
                        placeholder="Enter admin email"
                      />
                      {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminPhone">Admin Phone</Label>
                      <Input
                        id="adminPhone"
                        value={formData.adminPhone}
                        onChange={(e) => updateFormData('adminPhone', e.target.value)}
                        placeholder="Enter admin phone"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>College Logo</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload college logo</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleFileUpload('collegeLogo')}
                      >
                        Choose File
                      </Button>
                      {formData.collegeLogo && (
                        <p className="text-sm text-success mt-2">✓ File uploaded</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Affiliation Certificate</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">Upload affiliation certificate</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleFileUpload('affiliationCertificate')}
                      >
                        Choose File
                      </Button>
                      {formData.affiliationCertificate && (
                        <p className="text-sm text-success mt-2">✓ File uploaded</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-6 bg-muted/50">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreement"
                      checked={formData.agreementAccepted}
                      onCheckedChange={(checked) => updateFormData('agreementAccepted', checked)}
                      className={errors.agreement ? 'border-destructive' : ''}
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="agreement"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the Terms and Conditions
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By registering, you agree to our terms of service and privacy policy.
                        You confirm that all information provided is accurate and complete.
                      </p>
                      {errors.agreement && <p className="text-sm text-destructive">{errors.agreement}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} className="flex items-center space-x-2">
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex items-center space-x-2">
              <span>Register College</span>
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registration;