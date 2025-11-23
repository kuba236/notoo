import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as Storage from '../lib/storage';
import { Note } from '../types/Note';
// --- INTERFEJS KONTEKSTU ---
interface NotesContextType {
    notes: Note[];
    folders: string[];
    refresh: () => Promise<void>;
    addNewNote: (note: Note) => Promise<void>;
    removeNote: (id: string) => Promise<void>;
    updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
    addFolder: (name: string) => Promise<boolean>;
    deleteFolder: (name: string) => Promise<boolean>;
}

// Używamy domyślnej wartości null, ponieważ kontekst jest inicjalizowany asynchronicznie
const NotesContext = createContext<NotesContextType | undefined>(undefined);

// --- PROVIDER KONTEKSTU ---
export const NotesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Domyślny folder, do którego przenoszone są notatki z usuwanych folderów
    const DEFAULT_FOLDER = 'Study'; 

    // --- ŁADOWANIE DANYCH ---
    const loadData = async () => {
        setIsLoading(true);
        try {
            const loadedNotes = await Storage.getNotes();
            const loadedFolders = await Storage.getFolders();
            
            // Sortowanie notatek: najnowsze na górze
            loadedNotes.sort((a, b) => b.createdAt - a.createdAt);
            
            setNotes(loadedNotes);
            setFolders(loadedFolders);
        } catch (error) {
            console.error("Failed to load notes or folders:", error);
            // W przypadku błędu ładowania, ustawiamy domyślne foldery, aby aplikacja działała
            const defaultFolders = ['Niemiecki', 'Angielski', DEFAULT_FOLDER];
            setFolders(defaultFolders);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- FUNKCJE ZARZĄDZANIA NOTATKAMI ---

    const refresh = async () => {
        await loadData();
    };

    const addNewNote = async (newNote: Note) => {
        const updatedNotes = [newNote, ...notes].sort((a, b) => b.createdAt - a.createdAt);
        await Storage.saveNotes(updatedNotes);
        setNotes(updatedNotes);
        
        // Zaktualizuj listę folderów, jeśli dodano nowy
        if (newNote.folder && !folders.includes(newNote.folder.trim())) {
            await addFolder(newNote.folder.trim());
        }
    };

    const removeNote = async (id: string) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        await Storage.saveNotes(updatedNotes);
        setNotes(updatedNotes);
    };

    const updateNote = async (id: string, updates: Partial<Note>) => {
        const updatedNotes = notes.map(n => {
            if (n.id === id) {
                // Upewniamy się, że zaktualizowany czas jest zawsze ustawiony
                return { ...n, ...updates, updatedAt: Date.now() };
            }
            return n;
        });
        
        await Storage.saveNotes(updatedNotes);
        setNotes(updatedNotes);
        
        // Jeśli zaktualizowano folder, upewnij się, że nowy folder jest na liście
        if (updates.folder && !folders.includes(updates.folder.trim())) {
            await addFolder(updates.folder.trim());
        }
    };
    
    // --- FUNKCJE ZARZĄDZANIA FOLDERAMI ---

    const addFolder = async (name: string): Promise<boolean> => {
        const trimmedName = name.trim();
        if (!trimmedName || folders.includes(trimmedName)) {
            return false; // Nazwa pusta lub folder już istnieje
        }

        const newFolders = [...folders, trimmedName].sort((a, b) => a.localeCompare(b));
        
        await Storage.saveFolders(newFolders);
        setFolders(newFolders);
        return true;
    };

    const deleteFolder = async (name: string): Promise<boolean> => {
        // Nie usuwamy domyślnych/chronionych folderów
        const protectedFolders = ['Niemiecki', 'Angielski', DEFAULT_FOLDER];
        if (protectedFolders.includes(name)) {
             Alert.alert("Protected Folder", `Folder "${name}" cannot be deleted.`);
             return false;
        }

        // 1. Usuń folder z listy
        const updatedFolders = folders.filter(f => f !== name);
        await Storage.saveFolders(updatedFolders);
        setFolders(updatedFolders);
        
        // 2. Przenieś notatki z usuwanego folderu do DEFAULT_FOLDER
        const notesToUpdate = notes.map(n => {
            if (n.folder === name) {
                return { ...n, folder: DEFAULT_FOLDER, updatedAt: Date.now() };
            }
            return n;
        });

        await Storage.saveNotes(notesToUpdate);
        setNotes(notesToUpdate); // Aktualizujemy stan notatek po przeniesieniu
        
        return true;
    };


    // --- WARTOŚCI KONTEKSTU ---
    const contextValue: NotesContextType = {
        notes,
        folders,
        refresh,
        addNewNote,
        removeNote,
        updateNote,
        addFolder,
        deleteFolder,
    };

    // Opcjonalnie: Możesz użyć 'isLoading', aby zablokować aplikację przed załadowaniem danych
    if (isLoading) {
         return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E' }}>
                <Text style={{ color: '#fff' }}>Synapse Loading...</Text>
            </View>
        );
    }


    return (
        <NotesContext.Provider value={contextValue}>
            {children}
        </NotesContext.Provider>
    );
};

// --- CUSTOM HOOK ---
export const useNotes = () => {
    const context = useContext(NotesContext);
    if (!context) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
};