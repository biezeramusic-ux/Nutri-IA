import { Directory, File, Paths } from 'expo-file-system';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { downloadCloudImage, removeCloudImage, uploadCloudImage } from './cloudImages';

/** Foto de perfil: reduzida para 320 px, guardada no telemóvel e (a ~50 KB) na conta. */
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
    // Cópia na nuvem (~50 KB), para a foto sobreviver a um telemóvel novo.
    void uploadCloudImage('avatar.jpg', small.uri);
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
  void removeCloudImage('avatar.jpg');
}

/** Telemóvel novo: se não há foto local mas há uma na nuvem, descarrega-a. */
export async function restoreAvatar(userId: string): Promise<string | null> {
  try {
    if (getAvatarUri(userId)) return getAvatarUri(userId);
    const d = dir();
    if (!d.exists) d.create({ intermediates: true, idempotent: true });
    return (await downloadCloudImage('avatar.jpg', fileFor(userId))) ? getAvatarUri(userId) : null;
  } catch {
    return null;
  }
}
