import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Camera } from "lucide-react";

const schema = z.object({
  college_id: z.string().uuid({ message: "Select campus" }),
  full_name: z.string().min(3, "Enter full name"),
  dob: z.string().min(1, "Select date of birth"),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Select gender" }),
  nationality: z.string().min(2, "Enter nationality"),
  id_type: z.enum(["Aadhaar", "Passport", "Other"], { required_error: "Select ID type" }),
  id_number: z.string().min(4, "Enter ID number"),
  address_current: z.string().min(5, "Enter current address"),
  address_permanent: z.string().min(5, "Enter permanent address"),
  email: z.string().email("Enter valid email"),
  mobile: z.string().min(10, "Enter valid mobile"),
  program: z.string().min(1, "Select program"),
  specialization: z.string().min(1, "Enter specialization"),
  category: z.string().min(1, "Select category"),
  tenth_school: z.string().min(1, "Enter school"),
  tenth_board: z.string().min(1, "Enter board"),
  tenth_year: z.string().min(1, "Enter year"),
  tenth_score: z.string().min(1, "Enter score"),
  twelfth_school: z.string().optional(),
  twelfth_board: z.string().optional(),
  twelfth_year: z.string().optional(),
  twelfth_score: z.string().optional(),
  ug_university: z.string().optional(),
  ug_program: z.string().optional(),
  ug_year: z.string().optional(),
  ug_score: z.string().optional(),
  subjects_breakdown: z.string().optional(),
  father_name: z.string().min(1, "Enter father's name"),
  father_occupation: z.string().optional(),
  mother_name: z.string().min(1, "Enter mother's name"),
  mother_occupation: z.string().optional(),
  guardian_name: z.string().optional(),
  guardian_relationship: z.string().optional(),
  parent_email: z.string().email("Enter valid email").optional(),
  parent_mobile: z.string().optional(),
  declaration: z.boolean().refine(v => v, { message: "You must accept declaration" })
});

type FormValues = z.infer<typeof schema>;

const fileKeys = [
  { key: "marksheet_10", label: "10th Marksheets" },
  { key: "marksheet_12", label: "12th Marksheets" },
  { key: "transfer_certificate", label: "Transfer Certificate (TC)" },
  { key: "id_proof_student", label: "Student ID Proof" },
  { key: "id_proof_parents", label: "Parents ID Proof" },
  { key: "passport", label: "Passport (if applicable)" },
  { key: "category_certificate", label: "Category Certificate" },
  { key: "digital_signature", label: "Digital Signature" }
];

const AdmissionForm = () => {
  const [colleges, setColleges] = useState<Array<{ id: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const loadColleges = async () => {
      const { data, error } = await supabase.from('colleges').select('id, name').order('name');
      if (!error) setColleges(data || []);
    };
    loadColleges();
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const onSubmit = async (values: FormValues) => {
    try {
      setUploading(true);
      // Upload files to storage bucket "admissions"
      const uploaded: Record<string, string> = {};
      // Upload photo first if present
      if (photoFile) {
        const photoPath = `${values.college_id}/${Date.now()}_${Math.random().toString(36).slice(2)}_${photoFile.name}`;
        const { error: upPhotoErr } = await supabase.storage.from('admissions').upload(photoPath, photoFile, { upsert: false });
        if (upPhotoErr) throw upPhotoErr;
        const { data: photoPub } = supabase.storage.from('admissions').getPublicUrl(photoPath);
        uploaded['photo'] = photoPub.publicUrl;
      }
      for (const spec of fileKeys) {
        const f = files[spec.key];
        if (!f) continue;
        const path = `${values.college_id}/${Date.now()}_${Math.random().toString(36).slice(2)}_${f.name}`;
        const { error: upErr } = await supabase.storage.from('admissions').upload(path, f, { upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('admissions').getPublicUrl(path);
        uploaded[spec.key] = pub.publicUrl;
      }

      // Build payload for pending_admissions
      const payload = {
        full_name: values.full_name,
        dob: values.dob,
        gender: values.gender,
        nationality: values.nationality,
        id_type: values.id_type,
        id_number: values.id_number,
        address_current: values.address_current,
        address_permanent: values.address_permanent,
        mobile: values.mobile,
        program: values.program,
        specialization: values.specialization,
        category: values.category,
        academic: {
          tenth: { school: values.tenth_school, board: values.tenth_board, year: values.tenth_year, score: values.tenth_score },
          twelfth: { school: values.twelfth_school, board: values.twelfth_board, year: values.twelfth_year, score: values.twelfth_score },
          ug: { university: values.ug_university, program: values.ug_program, year: values.ug_year, score: values.ug_score },
          subjects_breakdown: values.subjects_breakdown
        },
        parents: {
          father_name: values.father_name,
          father_occupation: values.father_occupation,
          mother_name: values.mother_name,
          mother_occupation: values.mother_occupation,
          guardian_name: values.guardian_name,
          guardian_relationship: values.guardian_relationship,
          parent_email: values.parent_email,
          parent_mobile: values.parent_mobile
        },
        documents: uploaded,
        payment: { status: 'pending' },
        declaration: values.declaration
      };

      const { error: insertErr } = await supabase
        .from('pending_admissions')
        .insert({
          college_id: values.college_id,
          email: values.email,
          data: payload
        });
      if (insertErr) throw insertErr;

      toast({ title: 'Application Submitted', description: 'Your application has been submitted successfully.' });
      window.location.href = '/';
    } catch (error: any) {
      toast({ title: 'Submission Failed', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const programOptions = useMemo(() => [
    'B.Tech', 'B.Com', 'B.A', 'B.Sc', 'MBA', 'MCA', 'M.Tech'
  ], []);

  const specializationOptions: Record<string, string[]> = {
    'B.Tech': ['Computer Science Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering'],
    'B.Com': ['Accounting', 'Finance', 'Marketing'],
    'B.A': ['English Literature', 'Economics', 'Psychology', 'Political Science'],
    'B.Sc': ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
    'MBA': ['Marketing', 'Finance', 'HR', 'Operations', 'Business Analytics'],
    'MCA': ['Software Engineering', 'Data Science', 'Cloud Computing'],
    'M.Tech': ['CSE', 'ECE', 'Mechanical', 'Civil']
  };

  const categoryOptions = ['General', 'SC', 'ST', 'OBC', 'EWS', 'Other'];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">College Admission Form</h1>
          <p className="text-muted-foreground">Fill in all the required details to apply for admission.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-card-border md:col-span-1 flex items-center justify-center">
              <CardContent className="p-6 w-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <input
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="photo-input" className="cursor-pointer">
                    <div className="relative h-40 w-40 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Photo Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                          <Camera className="h-6 w-6 mb-2" />
                          <span className="text-xs font-medium">ADD PROFILE\nPHOTO</span>
                        </div>
                      )}
                      {/* subtle overlay on hover to change photo */}
                      {photoPreview && (
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="hidden hover:flex text-white text-xs px-2 py-1 rounded">Change</span>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border md:col-span-2">
              <CardHeader>
                <CardTitle>Program and Campus</CardTitle>
                <CardDescription>Select the program and campus you are applying for.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preferred Campus *</Label>
                  <Select onValueChange={(v) => setValue('college_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.college_id && <p className="text-destructive text-sm">{errors.college_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Program of Study *</Label>
                  <Select onValueChange={(v) => setValue('program', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programOptions.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.program && <p className="text-destructive text-sm">{errors.program.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Specialization / Course *</Label>
                  <Select onValueChange={(v) => setValue('specialization', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      {(specializationOptions['B.Tech']).map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.specialization && <p className="text-destructive text-sm">{errors.specialization.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(v) => setValue('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-destructive text-sm">{errors.category.message}</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Full Name *</Label>
                <Input placeholder="Enter your name" {...register('full_name')} />
                {errors.full_name && <p className="text-destructive text-sm">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Input type="date" {...register('dob')} />
                {errors.dob && <p className="text-destructive text-sm">{errors.dob.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select onValueChange={(v) => setValue('gender', v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-destructive text-sm">{errors.gender.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nationality *</Label>
                <Input placeholder="e.g., Indian" {...register('nationality')} />
                {errors.nationality && <p className="text-destructive text-sm">{errors.nationality.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>ID Type *</Label>
                <Select onValueChange={(v) => setValue('id_type', v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aadhaar">Aadhaar</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.id_type && <p className="text-destructive text-sm">{errors.id_type.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>ID Number *</Label>
                <Input placeholder="Enter ID number" {...register('id_number')} />
                {errors.id_number && <p className="text-destructive text-sm">{errors.id_number.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Current Address *</Label>
                <Textarea rows={3} {...register('address_current')} />
                {errors.address_current && <p className="text-destructive text-sm">{errors.address_current.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Permanent Address *</Label>
                <Textarea rows={3} {...register('address_permanent')} />
                {errors.address_permanent && <p className="text-destructive text-sm">{errors.address_permanent.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input type="tel" {...register('mobile')} />
                {errors.mobile && <p className="text-destructive text-sm">{errors.mobile.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Academic History</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 font-medium">10th Grade</div>
              <div className="space-y-2">
                <Label>School *</Label>
                <Input {...register('tenth_school')} />
                {errors.tenth_school && <p className="text-destructive text-sm">{errors.tenth_school.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Board *</Label>
                <Input {...register('tenth_board')} />
                {errors.tenth_board && <p className="text-destructive text-sm">{errors.tenth_board.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input {...register('tenth_year')} />
                {errors.tenth_year && <p className="text-destructive text-sm">{errors.tenth_year.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Score/Percentage *</Label>
                <Input {...register('tenth_score')} />
                {errors.tenth_score && <p className="text-destructive text-sm">{errors.tenth_score.message}</p>}
              </div>

              <div className="md:col-span-2 font-medium">12th Grade (or Diploma)</div>
              <div className="space-y-2">
                <Label>School/College</Label>
                <Input {...register('twelfth_school')} />
              </div>
              <div className="space-y-2">
                <Label>Board</Label>
                <Input {...register('twelfth_board')} />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input {...register('twelfth_year')} />
              </div>
              <div className="space-y-2">
                <Label>Score/Percentage</Label>
                <Input {...register('twelfth_score')} />
              </div>

              <div className="md:col-span-2 font-medium">Previous Degree (PG applicants)</div>
              <div className="space-y-2">
                <Label>University</Label>
                <Input {...register('ug_university')} />
              </div>
              <div className="space-y-2">
                <Label>Program</Label>
                <Input {...register('ug_program')} />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input {...register('ug_year')} />
              </div>
              <div className="space-y-2">
                <Label>Final Grade/Percentage</Label>
                <Input {...register('ug_score')} />
              </div>

              <div className="md:col-span-2">
                <Label>Subject-wise Marks (PCM/Bio etc.)</Label>
                <Textarea rows={3} placeholder="e.g., Physics: 95, Chemistry: 92, Math: 98" {...register('subjects_breakdown')} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Parent / Guardian Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Father's Name *</Label>
                <Input {...register('father_name')} />
                {errors.father_name && <p className="text-destructive text-sm">{errors.father_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input {...register('father_occupation')} />
              </div>
              <div className="space-y-2">
                <Label>Mother's Name *</Label>
                <Input {...register('mother_name')} />
                {errors.mother_name && <p className="text-destructive text-sm">{errors.mother_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input {...register('mother_occupation')} />
              </div>
              <div className="space-y-2">
                <Label>Guardian Name</Label>
                <Input {...register('guardian_name')} />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input {...register('guardian_relationship')} />
              </div>
              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input type="email" {...register('parent_email')} />
              </div>
              <div className="space-y-2">
                <Label>Parent Mobile</Label>
                <Input type="tel" {...register('parent_mobile')} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Document Uploads</CardTitle>
              <CardDescription>Upload clear scanned copies. Accepted types: images/PDF.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fileKeys.map(spec => (
                <div key={spec.key} className="space-y-2">
                  <Label>{spec.label}</Label>
                  <Input type="file" onChange={(e) => setFiles(prev => ({ ...prev, [spec.key]: e.target.files?.[0] || null }))} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardHeader>
              <CardTitle>Declaration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <input id="decl" type="checkbox" onChange={(e) => setValue('declaration', e.target.checked)} className="mt-1" />
                <Label htmlFor="decl" className="font-normal">
                  I hereby declare that the information provided is true and correct to the best of my knowledge.
                </Label>
              </div>
              {errors.declaration && <p className="text-destructive text-sm">{errors.declaration.message}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting || uploading}>
                  {uploading ? 'Uploading...' : (isSubmitting ? 'Submitting...' : 'Submit Application')}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
              </div>
              <p className="text-xs text-muted-foreground">Payment: After submitting, you will receive a link/email to complete the application fee payment.</p>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
};

export default AdmissionForm;



