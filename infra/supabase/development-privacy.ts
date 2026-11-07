/** Applied only to the owner's empty development project, alongside the V1 migrations. */
export function developmentPrivacy(password:string){
 if(!/^[A-Za-z0-9_-]{40,80}$/.test(password))throw new Error('Invalid generated development credential');
 const names=['tenants','workspaces','user','session','account','verification','memberships','rateLimit','_migrations'];
 return `
create table if not exists public._migrations(name text primary key,applied_at timestamptz not null default now());
create role ts_app_server login inherit nosuperuser nobypassrls nocreatedb nocreaterole noreplication connection limit 16 password '${password}';
grant ts_runtime to ts_app_server;
grant usage on schema public to ts_app_server;
${names.map(name=>`alter table public."${name}" enable row level security;
revoke all on table public."${name}" from public,anon,authenticated;
grant select,insert,update,delete on table public."${name}" to ts_app_server;
create policy internal_application_server on public."${name}" for all to ts_app_server using(true) with check(true);`).join('\n')}
revoke insert,update,delete on public._migrations from ts_app_server;
revoke all on schema app from public,anon,authenticated;
revoke all on all tables in schema app from public,anon,authenticated;
revoke all on all functions in schema app from public,anon,authenticated;
alter function app.reject_mutation() set search_path=pg_catalog,app;
revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
alter default privileges in schema public revoke all on tables from anon,authenticated;
alter default privileges in schema app revoke all on tables from public,anon,authenticated;
insert into public._migrations(name) values ('001_initial.sql'),('002_auth_rate_limit.sql'),('003_domain_references.sql'),('004_opportunity_contact.sql');
`;
}
