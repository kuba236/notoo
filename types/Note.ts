export type NoteType = 'text' | 'image' | 'mixed' | 'vocab_list'; 

export interface Anchor {
    emoji: string;
    color: string;
    name: string;
}

export interface Note {
    id: string;
    content: string; 
    textContent?: string; 
    createdAt: number;
    updatedAt: number;
    folder: string;
    type: NoteType;
    anchor: Anchor;
    targetLanguageCode?: string; 
}