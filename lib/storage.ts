import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '../types/Note';

const NOTES_KEY = '@notoo_notes_v3'; 
const FOLDERS_KEY = '@notoo_folders_v3';

export const getNotes = async (): Promise<Note[]> => {
  try {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const saveNotes = async (notes: Note[]) => {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
};

export const addNote = async (note: Note) => {
  const notes = await getNotes();
  const newNotes = [note, ...notes];
  await saveNotes(newNotes);
};

export const updateNote = async (id: string, updates: Partial<Note>) => {
  const notes = await getNotes();
  const updated = notes.map(n => n.id === id ? { ...n, ...updates } : n);
  await saveNotes(updated);
};

export const deleteNote = async (id: string) => {
  const notes = await getNotes();
  const filtered = notes.filter(n => n.id !== id);
  await saveNotes(filtered);
};

// lib/storage.ts

export const getFolders = async (): Promise<string[]> => {
  try {
    const json = await AsyncStorage.getItem(FOLDERS_KEY);
    // Zmieniamy domyślne na żądane: Niemiecki i Angielski (plus 'Study' dla ogólnych)
    // Zmieniam 'Ideas', 'Journal', 'Study' na Twoje wymagania
    return json ? JSON.parse(json) : ['Niemiecki', 'Angielski', 'Study']; 
  } catch (e) {
    return ['Niemiecki', 'Angielski', 'Study'];
  }
};

export const saveFolders = async (folders: string[]) => {
  await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
};