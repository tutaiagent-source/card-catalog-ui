create or replace function public.prevent_username_change_once_set()
returns trigger
language plpgsql
as $$
begin
  if old.username is not null
     and old.username <> ''
     and new.username is distinct from old.username then
    raise exception 'Username cannot be changed once set';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_username_change_once_set on public.profiles;
create trigger profiles_prevent_username_change_once_set
before update on public.profiles
for each row execute function public.prevent_username_change_once_set();
