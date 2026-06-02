-- Server-side keep-warm for dse-market-data (requires pg_cron + pg_net extensions).
-- Enable both in Supabase Dashboard → Database → Extensions before running.
--
-- After migration, configure runtime settings once (SQL Editor):
--   alter database postgres set app.settings.supabase_url = 'https://YOUR_PROJECT.supabase.co';
--   alter database postgres set app.settings.anon_key = 'YOUR_ANON_OR_PUBLISHABLE_KEY';
--
-- Or run the manual cron SQL documented in docs/closed-beta-runbook.md.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_dse_market_data_proxy()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  project_url text := current_setting('app.settings.supabase_url', true);
  anon_key text := current_setting('app.settings.anon_key', true);
  request_id bigint;
begin
  if project_url is null or anon_key is null then
    raise notice 'invoke_dse_market_data_proxy skipped — set app.settings.supabase_url and app.settings.anon_key';
    return null;
  end if;

  select net.http_get(
    url := project_url || '/functions/v1/dse-market-data',
    headers := jsonb_build_object(
      'Accept', 'application/json',
      'apikey', anon_key
    )
  )
  into request_id;

  return request_id;
end;
$$;

revoke all on function public.invoke_dse_market_data_proxy() from public;
grant execute on function public.invoke_dse_market_data_proxy() to postgres;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname in (
      'dse-market-data-keep-warm-market',
      'dse-market-data-keep-warm-offhours',
      'dse-market-data-keep-warm-weekend'
    );

    perform cron.schedule(
      'dse-market-data-keep-warm-market',
      '*/10 4-9 * * 0-4',
      $$select public.invoke_dse_market_data_proxy();$$
    );

    perform cron.schedule(
      'dse-market-data-keep-warm-offhours',
      '*/30 0-3,10-23 * * 0-4',
      $$select public.invoke_dse_market_data_proxy();$$
    );

    perform cron.schedule(
      'dse-market-data-keep-warm-weekend',
      '*/30 * * * 5,6',
      $$select public.invoke_dse_market_data_proxy();$$
    );
  end if;
exception
  when others then
    raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end;
$$;
