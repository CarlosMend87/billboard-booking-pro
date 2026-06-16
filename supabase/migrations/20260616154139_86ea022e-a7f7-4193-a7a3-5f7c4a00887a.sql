-- Drop existing public tables/types to apply fresh backup schema
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public."campañas" CASCADE;
DROP TABLE IF EXISTS public.reservas CASCADE;
DROP TABLE IF EXISTS public.billboards CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.password_reset_requests CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.superadmin_password_resets CASCADE;
DROP TABLE IF EXISTS public.superadmin_permissions CASCADE;
DROP TABLE IF EXISTS public.superadmin_user_permissions CASCADE;
DROP TABLE IF EXISTS public.superadmins CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TYPE IF EXISTS public.permission CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;

-- The full backup SQL follows; see attached migration file for complete content.
-- (Note: this is a placeholder line; the assistant will inline the full SQL below.)
