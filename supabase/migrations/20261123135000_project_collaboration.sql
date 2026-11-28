create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  member_id uuid references auth.users(id) on delete set null,
  role text not null default 'viewer' check (role in ('viewer', 'editor', 'owner')),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists project_members_project_email_idx
  on public.project_members (project_id, lower(invited_email));

create unique index if not exists project_members_project_exact_email_idx
  on public.project_members (project_id, invited_email);

create index if not exists project_members_project_idx
  on public.project_members (project_id);

alter table public.project_members enable row level security;

drop policy if exists "Owners can view project members" on public.project_members;
create policy "Owners can view project members"
  on public.project_members for select
  using ((select auth.uid()) = owner_id);

drop policy if exists "Owners can invite project members" on public.project_members;
create policy "Owners can invite project members"
  on public.project_members for insert
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update project members" on public.project_members;
create policy "Owners can update project members"
  on public.project_members for update
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can remove project members" on public.project_members;
create policy "Owners can remove project members"
  on public.project_members for delete
  using ((select auth.uid()) = owner_id);

drop policy if exists "Invited users can view their invitations" on public.project_members;
create policy "Invited users can view their invitations"
  on public.project_members for select
  using (
    member_id = (select auth.uid())
    or lower(invited_email) = lower(coalesce((select auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "Invited users can accept invitations" on public.project_members;
create policy "Invited users can accept invitations"
  on public.project_members for update
  using (lower(invited_email) = lower(coalesce((select auth.jwt() ->> 'email'), '')))
  with check (
    member_id = (select auth.uid())
    and status = 'accepted'
  );

drop policy if exists "Accepted members can read shared app state" on public.app_state;
create policy "Accepted members can read shared app state"
  on public.app_state for select
  using (
    exists (
      select 1
      from public.project_members membership
      where membership.owner_id = app_state.user_id
        and membership.member_id = (select auth.uid())
        and membership.status = 'accepted'
    )
  );
