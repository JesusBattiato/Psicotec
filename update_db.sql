-- Añadir la columna de experiencias para admitir empleos infinitos (JSON)
ALTER TABLE candidates ADD COLUMN experiencias jsonb;

-- Añadir la columna foto para codificar la imagen en base64
ALTER TABLE candidates ADD COLUMN foto text;
