import { Directory, File, Paths } from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';

/** Foto de perfil: reduzida para 320 px e guardada só no telemóvel. */
const dir = () => new Directory(Paths.document, 'avatars');
const fileFor = (userId: string) => new File(dir(), `${userId}.jpg`);

/** Devolve o endereço da foto (com marca de tempo para atualizar a imagem em cache), ou null. */
export function getAvatarUri(userId: string): string | null {
  try {
    const f = fileFor(userId);
    return f.exists ? `${f.uri}?t=${f.modificationTime ?? Date.now()}` : null;
  } catch {
    return null;
  }
}

export async function saveAvatar(userId: string, sourceUri: string): Promise<string | null> {
  try {
    const small = await manipulateAsync(sourceUri, [{ resize: { width: 320 } }], { compress: 0.7, format: SaveFormat.JPEG });
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    const dest = fileFor(userId);
    new File(small.uri).copy(dest, { overwrite: true });
    return getAvatarUri(userId);
  } catch {
    return null;
  }
}

export function removeAvatar(userId: string): void {
  try {
    const f = fileFor(userId);
    if (f.exists) f.delete();
  } catch {
    // ignora
  }
}
