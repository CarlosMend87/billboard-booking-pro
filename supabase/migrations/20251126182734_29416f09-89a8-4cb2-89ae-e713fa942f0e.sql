-- Actualizar el rol del usuario Jose.lopez@rentable.mx a owner
UPDATE profiles 
SET role = 'owner', empresa = 'Rentable'
WHERE user_id = 'b3c279af-1f37-45c3-834b-fac892425cf8';

-- Eliminar el rol actual de user_roles
DELETE FROM user_roles 
WHERE user_id = 'b3c279af-1f37-45c3-834b-fac892425cf8';

-- Insertar el nuevo rol owner en user_roles
INSERT INTO user_roles (user_id, role)
VALUES ('b3c279af-1f37-45c3-834b-fac892425cf8', 'owner');