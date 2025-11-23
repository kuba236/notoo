// types/Note.ts

export type NoteType = 'text' | 'image' | 'mixed' | 'vocab_list'; // NOWY TYP: vocab_list

export interface Anchor {
    emoji: string;
    color: string;
    name: string;
}

export interface Note {
    id: string;
    content: string; // Zawartość główna (np. URI obrazu, lub pełny tekst)
    textContent?: string; // Zawartość tekstowa (dla notatek obrazkowych lub list słówek)
    createdAt: number;
    updatedAt: number;
    folder: string;
    type: NoteType;
    anchor: Anchor;
    
    // NOWE POLE: Wskazuje język obcy dla list słówek
    targetLanguageCode?: string; 
}