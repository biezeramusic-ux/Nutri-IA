import { File } from 'expo-file-system';
import { compressForStorage } from './imageCompressor';
import { supabase } from './supabase';

/** Imagens do utilizador na nuvem: sempre reduzidas a ~50 KB, num bucket privado (pasta com o uid). */
const BUCKET = 'meal-photos';

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** Comprime a imagem para ~50 KB e envia-a. Nunca lança erro: a imagem local continua a funcionar sem rede. */
export async function uploadCloudImage(name: string, localUri: string): Promise<boolean> {
  try {
    const uid = await currentUserId();
    if (!uid) return false;
    const small = await compressForStorage(localUri);
    const bytes = await (await fetch(small.uri)).arrayBuffer();
    const { error } = await supabase.storage.from(BUCKET).upload(`${uid}/${name}`, bytes, { contentType: 'image/jpeg', upsert: true });
    return !error;
  } catch {
    return false;
  }
}

export async function removeCloudImage(name: string): Promise<void> {
  try {
    const uid = await currentUserId();
    if (uid) await supabase.storage.from(BUCKET).remove([`${uid}/${name}`]);
  } catch {
    // ignora
  }
}

/** Descarrega uma imagem da nuvem para o ficheiro local (ex.: telemóvel novo). */
export async function downloadCloudImage(name: string, dest: File): Promise<boolean> {
  try {
    const uid = await currentUserId();
    if (!uid) return false;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${uid}/${name}`, 300);
    if (error || !data) return false;
    if (dest.exists) dest.delete();
    await File.downloadFileAsync(data.signedUrl, dest);
    return true;
  } catch {
    return false;
  }
}

/** Nomes das imagens na nuvem que começam por `prefix`. */
export async function listCloudImages(prefix: string): Promise<string[]> {
  try {
    const uid = await currentUserId();
    if (!uid) return [];
    const { data, error } = await supabase.storage.from(BUCKET).list(uid, { search: prefix, limit: 200 });
    if (error || !data) return [];
    return data.map((f) => f.name).filter((n) => n.startsWith(prefix));
  } catch {
    return [];
  }
}

