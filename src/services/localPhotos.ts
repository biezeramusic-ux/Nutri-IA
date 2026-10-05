import { Directory, File, Paths } from 'expo-file-system';

/**
 * Cópia local da foto "como foi tirada". Fica no telemóvel (qualidade original);
 * só a versão de ~50 KB vai para o Supabase.
 */
const photosDir = () => new Directory(Paths.document, 'meal-photos');

export function persistLocalPhoto(mealId: string, sourceUri: string): string | undefined {
  try {
    const dir = photosDir();
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const dest = new File(dir, `${mealId}.jpg`);
    new File(sourceUri).copy(dest, { overwrite: true });
    return dest.uri;
  } catch {
    return undefined;
  }
}

export function getLocalPhotoUri(mealId: string): string | undefined {
  try {
    const file = new File(photosDir(), `${mealId}.jpg`);
    return file.exists ? file.uri : undefined;
  } catch {
    return undefined;
  }
}
