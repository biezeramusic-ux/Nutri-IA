-- Imagens do resumo semanal partilhadas por link (Facebook, WhatsApp, ...).
-- Bucket público: qualquer pessoa com o link vê a imagem; só o dono escreve na sua pasta.
insert into storage.buckets (id, name, public)
values ('weekly-shares', 'weekly-shares', true)
on conflict (id) do update set public = true;

drop policy if exists "weekly_shares_insert_own" on storage.objects;
create policy "weekly_shares_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'weekly-shares' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "weekly_shares_read" on storage.objects;
create policy "weekly_shares_read" on storage.objects
  for select to public
  using (bucket_id = 'weekly-shares');
