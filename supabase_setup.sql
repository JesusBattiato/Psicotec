CREATE TABLE candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  nombre text, apellido text, email text, tel text,
  ciudad text, provincia text, linkedin text, titulo text,
  resumen text, puesto text, modalidad text, disp text,
  edu1tit text, edu1niv text, edu1inst text, edu1anio text,
  edu2tit text, edu2inst text, edu2anio text,
  e1emp text, e1cargo text, e1desde text, e1hasta text, e1desc text,
  e2emp text, e2cargo text, e2desde text, e2hasta text, e2desc text,
  e3emp text, e3cargo text, e3desde text, e3hasta text,
  skillsH text, skillsS text, idiomas text,
  consent boolean, ts text, apreciacion text
);

-- Allow public insert and read for now
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select" ON candidates FOR SELECT USING (true);
CREATE POLICY "Public update" ON candidates FOR UPDATE USING (true);
CREATE POLICY "Public delete" ON candidates FOR DELETE USING (true);
