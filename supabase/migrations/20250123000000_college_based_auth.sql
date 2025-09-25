-- Create Colleges table
CREATE TABLE public.colleges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Admins table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_user_role(UUID);
DROP FUNCTION IF EXISTS public.get_user_college_id(UUID);
DROP FUNCTION IF EXISTS public.has_role(UUID, TEXT);

-- Function to get user's college ID
CREATE OR REPLACE FUNCTION public.get_user_college_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT college_id FROM public.admins WHERE user_id = _user_id),
    (SELECT college_id FROM public.staff WHERE user_id = _user_id),
    (SELECT college_id FROM public.students WHERE user_id = _user_id)
  )
$$;

-- Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.staff WHERE user_id = _user_id) THEN 'staff'
    WHEN EXISTS (SELECT 1 FROM public.students WHERE user_id = _user_id) THEN 'student'
    ELSE NULL
  END
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(_user_id) = _role
$$;

-- RLS Policies for colleges
CREATE POLICY "Anyone can view colleges"
ON public.colleges
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage colleges"
ON public.colleges
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for admins
CREATE POLICY "Admins can view all admins"
ON public.admins
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all admins"
ON public.admins
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for staff
CREATE POLICY "Admins can view all staff"
ON public.staff
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view staff in their college"
ON public.staff
FOR SELECT
TO authenticated
USING (public.get_user_college_id(auth.uid()) = college_id);

CREATE POLICY "Admins can manage all staff"
ON public.staff
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Admins can view all students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view students in their college"
ON public.students
FOR SELECT
TO authenticated
USING (public.get_user_college_id(auth.uid()) = college_id);

CREATE POLICY "Students can view students in their college"
ON public.students
FOR SELECT
TO authenticated
USING (public.get_user_college_id(auth.uid()) = college_id);

CREATE POLICY "Admins can manage all students"
ON public.students
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration with college assignment
CREATE OR REPLACE FUNCTION public.handle_new_user_with_college()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _college_id UUID;
  _role TEXT;
BEGIN
  -- Get college_id from metadata
  _college_id := (NEW.raw_user_meta_data ->> 'college_id')::UUID;
  _role := NEW.raw_user_meta_data ->> 'role';
  
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Insert into appropriate role table based on metadata
  IF _role = 'admin' AND _college_id IS NOT NULL THEN
    INSERT INTO public.admins (user_id, email, college_id)
    VALUES (NEW.id, NEW.email, _college_id);
  ELSIF _role = 'staff' AND _college_id IS NOT NULL THEN
    INSERT INTO public.staff (user_id, email, college_id)
    VALUES (NEW.id, NEW.email, _college_id);
  ELSIF _role = 'student' AND _college_id IS NOT NULL THEN
    INSERT INTO public.students (user_id, email, college_id)
    VALUES (NEW.id, NEW.email, _college_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_with_college();

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON public.colleges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample colleges
INSERT INTO public.colleges (name, address) VALUES
('Demo University', '123 Education Street, Demo City'),
('Tech Institute', '456 Innovation Avenue, Tech Town'),
('Business College', '789 Commerce Road, Business District');
