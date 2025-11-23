// lib/file.ts
import * as FileSystem from 'expo-file-system';

// Bezpieczne pobranie katalogu z obejściem problemów z typami
const getStorageDirectory = (): string => {
  const fileSystemAny = FileSystem as any;
  
  // Spróbuj najpierw documentDirectory
  let dir = fileSystemAny.documentDirectory;
  
  // Jeśli documentDirectory jest null, użyj cacheDirectory
  if (!dir) {
    dir = fileSystemAny.cacheDirectory;
  }
  
  // Jeśli oba są null, użyj fallback
  if (!dir) {
    console.warn('Both documentDirectory and cacheDirectory are null, using fallback');
    return 'file:///tmp/notoo_media/';
  }
  
  console.log('📁 Using storage directory:', dir);
  return dir + 'notoo_media/';
};

const DIR = getStorageDirectory();

export async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
      console.log('✅ Directory created:', DIR);
    } else {
      console.log('✅ Directory already exists:', DIR);
    }
  } catch (e) {
    console.warn('❌ ensureDir error', e);
    throw e;
  }
}

export async function saveFileFromUri(uri: string, ext = 'jpg'): Promise<string> {
  try {
    console.log('🔄 Starting saveFileFromUri...');
    console.log('📁 Source URI:', uri);
    
    await ensureDir();
    
    // Sprawdź czy plik źródłowy istnieje
    const sourceInfo = await FileSystem.getInfoAsync(uri);
    console.log('✅ Source file exists:', sourceInfo.exists);
    
    if (!sourceInfo.exists) {
      throw new Error(`Source file does not exist: ${uri}`);
    }
    
    const name = `image_${Date.now()}.${ext}`;
    const dest = `${DIR}${name}`;
    console.log('🎯 Destination path:', dest);
    
    // Użyj copyAsync
    await FileSystem.copyAsync({
      from: uri,
      to: dest
    });
    
    console.log('✅ File copied successfully');
    
    // Zweryfikuj że plik został utworzony
    const destInfo = await FileSystem.getInfoAsync(dest);
    if (!destInfo.exists) {
      throw new Error('File was not copied successfully');
    }
    
    console.log('✅ File verified, returning:', dest);
    return dest;
    
  } catch (e) {
    console.error('❌ saveFileFromUri error:', e);
    throw new Error(`Failed to save file`);
  }
}

export async function deleteFile(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri);
      console.log('🗑️ File deleted:', uri);
    }
  } catch (e) {
    console.warn('deleteFile error', e);
  }
}

// Funkcja pomocnicza do debugowania
export async function debugStorage() {
  try {
    console.log('📊 === DEBUG STORAGE ===');
    const fileSystemAny = FileSystem as any;
    console.log('📁 Document Directory:', fileSystemAny.documentDirectory);
    console.log('📁 Cache Directory:', fileSystemAny.cacheDirectory);
    console.log('📁 Final DIR:', DIR);
    
    const dirInfo = await FileSystem.getInfoAsync(DIR);
    console.log('📁 Media Directory exists:', dirInfo.exists);
    
    if (dirInfo.exists) {
      try {
        const files = await FileSystem.readDirectoryAsync(DIR);
        console.log('📁 Files in directory:', files.length, 'files');
        files.forEach((file, index) => {
          console.log(`  ${index + 1}. ${file}`);
        });
      } catch (readError) {
        console.log('📁 Cannot read directory (might be empty):', readError);
      }
    }
    console.log('📊 === END DEBUG ===');
  } catch (e) {
    console.warn('Debug storage error:', e);
  }
}