import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Image,
    Keyboard,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

// --- ZAŁOŻENIE: STYLE SĄ W ZEWNĘTRZNYM PLIKU ---
// Zakładam istnienie pliku ./NoteDetailStyles i konieczne jest dodanie editStyles na końcu tego pliku
import { styles } from './NoteDetailStyles';

import GlassCard from '../../components/ui/GlassCard';
import { COLORS } from '../../constants/colors';
import { useNotes } from '../../context/NotesContext';
import { Anchor, Note } from '../../types/Note';

const { width } = Dimensions.get('window');

// --- STAŁE KODY JĘZYKOWE ---
const POLISH_CODE = 'pl';
const DEUTSCH_CODE = 'de-DE';
const ENGLISH_CODE = 'en-US';

// --- TYPY DLA FISZEK ---
type Flashcard = {
    front: string; // Słówko Obce
    back: string;  // Tłumaczenie Polskie
    anchor: Anchor;
};

// --- TYP KIERUNKU NAUKI ---
type StudyDirection = 'foreignToPolish' | 'polishToForeign';

// --- SYNAPSE ENGINE (Logika Parsowania) ---
// --- SYNAPSE ENGINE (Logika Parsowania) ---
// Pełna lista separatorów, w tym myślniki ze spacjami i bez, oraz dwukropek.
const SEPARATORS = [':', ' - ', '—', '–', '-', ' : ']; // Dodano: '-', ' : '

const generateCardsFromNote = (note: Note): Flashcard[] => {
    // Określenie treści do parsowania
    const content = note.type === 'mixed' 
        ? (note.textContent || '') 
        : (note.type === 'vocab_list' ? note.textContent || note.content : note.content);
        
    if (!content) return [];

    const generated: Flashcard[] = [];
    // Dzielenie na linie, pomijanie pustych
    const lines = content.split('\n').filter((l: string) => l.trim().length > 0); 

    let lastHeader = 'Recall Concept';
    const isVocabList = note.type === 'vocab_list';

    lines.forEach((line: string) => {
        const trimmedLine = line.trim();

        // 1. Logika Nagłówka/Sekcji (bez zmian)
        if (!isVocabList && trimmedLine.length > 3 && trimmedLine.endsWith(':')) {
            lastHeader = trimmedLine.replace(':', '').trim();
            return;
        }

        // 2. Wyszukiwanie elastycznego separatora
        let separatorChar: string | null = null;
        let separatorIndex = -1;
        
        // Znajdź pierwszy separator z rozszerzonej listy
        for (const candidate of SEPARATORS) {
            const index = trimmedLine.indexOf(candidate);
            // Upewniamy się, że separator nie jest na początku (index > 0)
            if (index > 0) { 
                 if (separatorIndex === -1 || index < separatorIndex) {
                    separatorChar = candidate;
                    separatorIndex = index;
                }
            }
        }
        
        // 3. Parsowanie fiszki na podstawie separatora
        if (separatorChar && separatorIndex !== -1) {
            // Część 1: Przed separatorem
            const part1 = trimmedLine.substring(0, separatorIndex).trim();
            // Część 2: Po separatorze
            const part2 = trimmedLine.substring(separatorIndex + separatorChar.length).trim(); 
             
             if (part1 && part2) {
                 generated.push({
                     front: part1, 
                     back: part2, 
                     anchor: note.anchor
                 });
                 return;
             }
        }

        // 4. Obsługa punktów listy (dla fiszek kontekstowych) - jako fallback, jeśli nie znaleziono separatora
        if (!isVocabList && (trimmedLine.startsWith('*') || trimmedLine.startsWith('•') || trimmedLine.startsWith('-'))) {
             // Jeśli linia zaczyna się od punktora, ale nie jest to format fiszki (np. " - " jest już sprawdzone jako separator)
             const cleanedLine = trimmedLine.startsWith('-') ? trimmedLine.substring(1).trim() : trimmedLine.substring(1).trim();
            
             // Dodajemy tylko jeśli linia faktycznie zawiera treść po punktorze
             if (cleanedLine) {
                 generated.push({
                     front: `Wymień z kategorii: ${lastHeader}`,
                     back: cleanedLine,
                     anchor: note.anchor
                 });
             }
            return;
        }
    });

    // Obsługa notatek obrazkowych (bez zmian)
    if (note.type === 'image' || note.type === 'mixed') {
        generated.unshift({
            front: `${note.anchor.emoji} Visual Recall: ${note.folder}`,
            back: `Image Context: ${note.textContent || 'No text context provided.'}`,
            anchor: note.anchor
        });
    }

    return generated;
};

// --- KOMPONENTY MODALNE (Bez zmian) ---
const EngineFailedModal: React.FC<{ visible: boolean, onClose: () => void }> = ({ visible, onClose }) => (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <BlurView tint="dark" intensity={90} style={styles.modalBlurBackground} />
            <GlassCard style={styles.modalCard}>
                <View style={styles.modalContentWrapper}>
                    <Ionicons name="alert-circle-outline" size={48} color={COLORS.secondary} style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>Synapse Engine Failed</Text>
                    <Text style={styles.modalBody}>
                        <Text>Not enough structure found. Try using </Text>
                        <Text style={{ fontWeight: '700', color: COLORS.text }}>"Słówko - Tłumaczenie"</Text>
                        <Text> to create flashcards, especially for vocab lists.</Text>
                    </Text>
                    <TouchableOpacity onPress={onClose} style={styles.modalConfirm}>
                        <Text style={styles.modalConfirmText}>Got it</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>
        </View>
    </Modal>
);

const DeleteModal: React.FC<{ visible: boolean, onCancel: () => void, onConfirm: () => void }> = ({ visible, onCancel, onConfirm }) => (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onCancel}>
        <View style={styles.modalOverlay}>
            <BlurView tint="dark" intensity={90} style={styles.modalBlurBackground} />
            <GlassCard style={styles.modalCard}>
                <View style={styles.modalContentWrapper}>
                    <Ionicons name="trash-outline" size={48} color="#FF453A" style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>Delete Neural Link?</Text>
                    <Text style={styles.modalBody}>This memory will be lost forever. Are you sure you want to proceed?</Text>
                    <View style={styles.modalActions}>
                        <TouchableOpacity onPress={onCancel} style={[styles.modalActionBtn, styles.modalCancel]}>
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onConfirm} style={[styles.modalActionBtn, styles.modalDelete]}>
                            <Text style={styles.modalConfirmText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </GlassCard>
        </View>
    </Modal>
);

const SessionCompleteModal: React.FC<{ visible: boolean, onClose: () => void }> = ({ visible, onClose }) => (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
            <BlurView tint="dark" intensity={90} style={styles.modalBlurBackground} />
            <GlassCard style={styles.modalCard}>
                <View style={styles.modalContentWrapper}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={COLORS.primary} style={styles.modalIcon} />
                    <Text style={styles.modalTitle}>Session Complete</Text>
                    <Text style={styles.modalBody}>Neural pathways reinforced. Review complete. Good work!</Text>
                    <TouchableOpacity onPress={onClose} style={styles.modalConfirm}>
                        <Text style={styles.modalConfirmText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>
        </View>
    </Modal>
);

// --- KOMPONENT: Wybór Folderu w Edycji (Bez zmian) ---
const FolderPicker: React.FC<{ 
    currentFolder: string; 
    setFolder: (f: string) => void; 
    allFolders: string[];
}> = ({ currentFolder, setFolder, allFolders }) => {
    
    const foldersToDisplay = Array.from(new Set(allFolders))
                                 .filter(f => f.trim())
                                 .sort((a, b) => a.localeCompare(b));
    
    return (
        <View style={editStyles.folderPickerContainer}>
            <Text style={editStyles.folderPickerLabel}>Change Folder:</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={editStyles.folderScroll}
            >
                <View style={editStyles.folderInputWrapper}>
                    <TextInput
                        style={editStyles.folderInput}
                        placeholder="New Folder Name"
                        placeholderTextColor={COLORS.textSec}
                        value={currentFolder}
                        onChangeText={setFolder}
                    />
                </View>

                {foldersToDisplay.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            editStyles.folderOption, 
                            f === currentFolder && editStyles.folderOptionSelected
                        ]}
                        onPress={() => {
                            Haptics.selectionAsync();
                            setFolder(f);
                            Keyboard.dismiss();
                        }}
                    >
                        <Text style={[editStyles.folderOptionText, f === currentFolder && { color: COLORS.bg }]}>{f}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};
// --- KONIEC KOMPONENTU WYBORU FOLDERU ---


// --- GŁÓWNY KOMPONENT ---
export default function NoteDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { notes, removeNote, updateNote, folders } = useNotes(); 

    const note = notes.find(n => n.id === id);

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState('');
    const [editFolder, setEditFolder] = useState(''); 

    const [studyMode, setStudyMode] = useState(false);
    const [cards, setCards] = useState<Flashcard[]>([]);
    const [currentCardIdx, setCurrentCardIdx] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [isListening, setIsListening] = useState(false); 
    const [voiceResponse, setVoiceResponse] = useState(''); 
    const [speechRecognitionStatus, setSpeechRecognitionStatus] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [isVoiceModeActive, setIsVoiceModeActive] = useState(false); 
    
    const [studyDirection, setStudyDirection] = useState<StudyDirection>('foreignToPolish');
    const [expectedResponseLanguage, setExpectedResponseLanguage] = useState(POLISH_CODE); 
    const [noteLanguageCode, setNoteLanguageCode] = useState(POLISH_CODE); 

    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isSessionCompleteModalVisible, setIsSessionCompleteModalVisible] = useState(false);
    const [isEngineFailedModalVisible, setIsEngineFailedModalVisible] = useState(false);

    const rotate = useSharedValue(0);

    // --- FUNKCJE OBSŁUGI FISZEK (DEFINICJE PRZENIESIONE DO GŁÓWNEGO KOMPONENTU) ---

    // 1. Zabezpieczona funkcja zwracająca Pytanie (Front) i Język
    const getCurrentFront = (card: Flashcard, direction: StudyDirection): { text: string, lang: string } => {
        if (!card) return { text: '', lang: POLISH_CODE };

        const text = direction === 'foreignToPolish' ? card.front : card.back;
        const lang = direction === 'foreignToPolish' ? noteLanguageCode : POLISH_CODE;

        return { 
            text: text || '', 
            lang: lang || POLISH_CODE 
        };
    };

    // 2. Funkcja zwracająca Odpowiedź (Back)
    const getCurrentBack = (card: Flashcard, direction: StudyDirection): string => {
        if (!card) return '';
        
        return direction === 'foreignToPolish' ? card.back : card.front;
    };
    
    // 3. Obsługa mowy (tekst na mowę)
    const speakQuestion = (text: string, langCode: string) => {
        if (isListening) return; 
        const lang = langCode.includes('-') ? langCode.split('-')[0] : langCode;
        // Wymagane, aby langCode było zgodne z wymaganiami Speech.speak (np. 'de' zamiast 'de-DE')
        Speech.speak(text, { language: lang.toLowerCase(), pitch: 1.0, rate: 0.95 });
    };

    // 4. Przełączanie kierunku nauki
    const toggleDirection = () => {
        const newDirection: StudyDirection = studyDirection === 'foreignToPolish' ? 'polishToForeign' : 'foreignToPolish';
        setStudyDirection(newDirection);
        setExpectedResponseLanguage(newDirection === 'foreignToPolish' ? POLISH_CODE : noteLanguageCode);
        
        setIsFlipped(false);
        rotate.value = withTiming(0, { duration: 100 });
        
        if (isVoiceModeActive && cards.length > 0) {
            const currentCard = cards[currentCardIdx];
            // Używamy bezpiecznej funkcji, która zawsze zwraca obiekt
            const { text, lang } = getCurrentFront(currentCard, newDirection); 
            speakQuestion(text, lang);
        }
    };
    
    // 5. Przełączanie trybu głosowego
    const toggleVoiceMode = () => {
        const newState = !isVoiceModeActive;
        setIsVoiceModeActive(newState);
        Speech.stop(); 
        setIsListening(false); 
        setVoiceResponse('');

        if (newState && cards.length > 0) {
            const currentCard = cards[currentCardIdx];
            const cardDetails = getCurrentFront(currentCard, studyDirection); 
            speakQuestion(cardDetails.text, cardDetails.lang);
        }
    };
    
    // 6. Symulacja obsługi odpowiedzi głosowej
    const handleVoiceResponse = async () => {
        if (isListening) {
            setIsListening(false);
            setSpeechRecognitionStatus('idle');
            return;
        }

        setIsListening(true);
        setSpeechRecognitionStatus('listening');
        setVoiceResponse('');

        try {
            // Symulacja: Słuchanie (3s) -> Przetwarzanie (2s) -> Odpowiedź (Auto Flip)
            setTimeout(() => {
                setSpeechRecognitionStatus('processing');
            }, 3000); 

            setTimeout(() => {
                const dummyResponse = "Simulated answer: [Accepted]"; 
                setVoiceResponse(dummyResponse);
                setSpeechRecognitionStatus('idle');
                setIsListening(false);
                handleFlip(); 
            }, 5000); 
            
        } catch (error) {
            console.error('Speech recognition error:', error);
            setVoiceResponse('Error: Could not process voice input.');
            setSpeechRecognitionStatus('idle');
            setIsListening(false);
        }
    };
    
    // --- KONIEC FUNKCJI OBSŁUGI FISZEK ---
    
    
    // --- ANIMATED STYLES (Bez zmian) ---
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotate.value, [0, 180], [0, 180]);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            opacity: rotate.value < 90 ? 1 : 0,
            zIndex: rotate.value < 90 ? 1 : 0
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const rotateValue = interpolate(rotate.value, [0, 180], [180, 360]);
        return {
            transform: [{ rotateY: `${rotateValue}deg` }],
            opacity: rotate.value < 90 ? 0 : 1,
            zIndex: rotate.value < 90 ? 0 : 1
        };
    });

    // --- LOGIKA USTAWIENIA STANU POCZĄTKOWEGO (Bez zmian) ---
    useEffect(() => {
    const found = notes.find(n => n.id === id);
    if (found) {

        // NIE MA setNote(found); ← USUNIĘTE

        const contentForEdit =
            found.type === 'image'
                ? (found.textContent || '')
                : (found.type === 'vocab_list'
                    ? found.textContent || found.content
                    : found.content);

        setEditText(contentForEdit);
        setEditFolder(found.folder || 'Uncategorized');

        let detectedLanguage = POLISH_CODE;

        if (found.folder === 'Niemiecki' || (found.targetLanguageCode && found.targetLanguageCode.startsWith('de'))) {
            detectedLanguage = DEUTSCH_CODE;
        } else if (found.folder === 'Angielski' || (found.targetLanguageCode && found.targetLanguageCode.startsWith('en'))) {
            detectedLanguage = ENGLISH_CODE;
        } else {
            detectedLanguage = found.targetLanguageCode || POLISH_CODE;
        }

        setNoteLanguageCode(detectedLanguage);
        setExpectedResponseLanguage(POLISH_CODE);
    }
}, [id, notes]);

    
    
    // --- OBSŁUGA FISZEK ---
    const startStudy = () => {
        if (!note) return;
        const generated = generateCardsFromNote(note as Note);
        if (generated.length === 0) {
            setIsEngineFailedModalVisible(true);
            return;
        }
        setCards(generated);
        setCurrentCardIdx(0);
        setIsFlipped(false);
        setStudyMode(true);
        setIsVoiceModeActive(false); 
        rotate.value = withTiming(0, { duration: 100 }); 
        setStudyDirection('foreignToPolish'); 
        setExpectedResponseLanguage(POLISH_CODE); 
    };
    
    const handleFlip = () => {
        if (isListening) return; 
        Haptics.selectionAsync();
        setIsFlipped(!isFlipped);
        rotate.value = withSpring(isFlipped ? 0 : 180);
    };

    const handleNextCard = (known: boolean) => {
        Haptics.impactAsync(known ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
        
        if (isVoiceModeActive) {
            Speech.stop(); 
            setIsListening(false);
            setVoiceResponse('');
            setSpeechRecognitionStatus('idle');
        }
        
        setIsFlipped(false);
        rotate.value = withTiming(0, { duration: 200 }); 

        setTimeout(() => {
            if (currentCardIdx < cards.length - 1) {
                setCurrentCardIdx(prev => {
                    const nextIdx = prev + 1;
                    
                    if (isVoiceModeActive) {
                        const nextCard = cards[nextIdx];
                        if (nextCard) {
                            // POPRAWKA: Zabezpieczony dostęp
                            const cardDetails = getCurrentFront(nextCard, studyDirection); 
                            speakQuestion(cardDetails.text, cardDetails.lang); 
                        }
                    }
                    return nextIdx;
                });
            } else {
                setIsSessionCompleteModalVisible(true);
                setStudyMode(false);
                setCurrentCardIdx(0);
                setIsVoiceModeActive(false); 
            }
        }, 200);
    };

    // --- FUNKCJA ZAPISU (Bez zmian) ---
    const handleSave = async () => {
    if (!note || !id) return;
    
    Keyboard.dismiss();

    const updatedContent = editText;
    const finalFolder = editFolder.trim() || 'Uncategorized';
    
    const updates: Partial<Note> = {};
    let shouldUpdate = false;
    
    // 1. Sprawdzenie zmiany folderu
    if (finalFolder !== note.folder) {
        updates.folder = finalFolder;
        shouldUpdate = true;
        
        // Auto język
        if (finalFolder === 'Niemiecki') {
            updates.targetLanguageCode = DEUTSCH_CODE;
        } else if (finalFolder === 'Angielski') {
            updates.targetLanguageCode = ENGLISH_CODE;
        } else {
            updates.targetLanguageCode = note.targetLanguageCode;
        }
    } else {
        updates.targetLanguageCode = note.targetLanguageCode;
    }

    // 3. Sprawdzenie zmiany treści
    const contentField =
        (note.type === 'mixed' || note.type === 'vocab_list')
            ? 'textContent'
            : 'content';

    const currentContent = note[contentField] || '';

    if (updatedContent !== currentContent) {
        updates[contentField] = updatedContent;
        shouldUpdate = true;
    }
    
    // 4. Aktualizacja
    if (shouldUpdate) {
        await updateNote(id as string, updates); 

        // ❗❗ TO BYŁO = DO KOSZA
        // setNote(prev => prev ? { ...prev, ...updates } : null);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setIsEditing(false);
};


    const handleDelete = () => {
        setIsDeleteModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleteModalVisible(false);
        if (note) {
            await removeNote(note.id); 
        }
        router.back();
    }

    if (!note) return <View style={styles.container} />;
    const hasImage = note.type === 'image' || note.type === 'mixed';
    const currentCard = cards[currentCardIdx];
    const isLanguageFolder = note.folder === 'Niemiecki' || note.folder === 'Angielski';

    // --- STUDY MODE VIEW ---
    if (studyMode && cards.length > 0) {
        
        const anchorColor = currentCard.anchor.color;
        const anchorEmoji = currentCard.anchor.emoji;
        
        // Zabezpieczone pobieranie content i lang
        const cardDetails = currentCard ? getCurrentFront(currentCard, studyDirection) : undefined;
        const frontContent = cardDetails?.text || '';
        const frontLangLabel = cardDetails?.lang?.toUpperCase() || '';
        
        const backContent = currentCard ? getCurrentBack(currentCard, studyDirection) : '';
        
        const directionLabel = studyDirection === 'foreignToPolish' ? 'Obcy → PL' : 'PL → Obcy';
        
        return (
            <View style={styles.studyContainer}>
                <LinearGradient colors={['#000', anchorColor + '10']} style={StyleSheet.absoluteFill} />

                {/* Header */}
                <View style={styles.studyHeader}>
                    <TouchableOpacity onPress={() => { Speech.stop(); setStudyMode(false); setIsVoiceModeActive(false); }} style={styles.closeBtn}>
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                    
                    {isLanguageFolder && (
                        <>
                            <TouchableOpacity 
                                onPress={toggleVoiceMode} 
                                style={[styles.voiceToggleBtn, isVoiceModeActive && styles.voiceToggleActive, { marginRight: 10 }]}
                            >
                                 <Ionicons 
                                     name={isVoiceModeActive ? "volume-high" : "volume-mute"} 
                                     size={20} 
                                     color={isVoiceModeActive ? COLORS.bg : COLORS.textSec} 
                                 />
                                 <Text style={isVoiceModeActive ? { color: COLORS.bg, fontSize: 12 } : { color: COLORS.textSec, fontSize: 12 }}>
                                     Voice {isVoiceModeActive ? 'ON' : 'OFF'}
                                 </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                onPress={toggleDirection} 
                                style={[styles.voiceToggleBtn]}
                            >
                                 <Ionicons 
                                     name={"swap-horizontal"} 
                                     size={20} 
                                     color={COLORS.textSec} 
                                 />
                                 <Text style={{ color: COLORS.textSec, fontSize: 12 }}>
                                     {directionLabel}
                                 </Text>
                            </TouchableOpacity>
                        </>
                    )}


                    <Text style={styles.progressText}>
                        {anchorEmoji} {currentCardIdx + 1} / {cards.length}
                    </Text>
                </View>

                {/* 3D Card Area */}
                <View style={styles.cardArea}>
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={isListening ? () => {} : handleFlip}
                        style={styles.cardWrapper}
                    >
                        {/* FRONT (Pytanie) */}
                        <Animated.View style={[styles.flashcard, frontAnimatedStyle]}>
                            <LinearGradient
                                colors={['#2C2C2E', '#1C1C1E']}
                                style={styles.cardGradient}
                            >
                                <Text style={styles.cardLabel}>LANG: {frontLangLabel} • {anchorEmoji}</Text>
                                <Text style={styles.cardText}>{frontContent}</Text>
                                {!isListening && <Text style={styles.tapHint}>Tap to recall, or use Voice Mode</Text>}
                            </LinearGradient>
                        </Animated.View>

                        {/* BACK (Odpowiedź) */}
                        <Animated.View style={[styles.flashcard, styles.flashcardBack, backAnimatedStyle]}>
                            <LinearGradient colors={[anchorColor, anchorColor + 'CC']} style={styles.cardGradient}>
                                <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.7)' }]}>SYNAPSE ACTIVATED</Text>
                                <ScrollView contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 5 }}>
                                    <Text style={styles.cardText}>{backContent}</Text>
                                </ScrollView>
                            </LinearGradient>
                        </Animated.View>
                    </TouchableOpacity>
                </View>

                {/* SEKCJA: VOICE RESPONSE */}
                {isLanguageFolder && isVoiceModeActive && !isFlipped && (
                    <View style={styles.voiceSection}>
                        <TouchableOpacity
                            style={[styles.voiceBtn, isListening && styles.voiceBtnListening]}
                            onPress={handleVoiceResponse}
                            disabled={isListening}
                        >
                            <Ionicons
                                name={isListening ? "pulse" : "mic-outline"}
                                size={28}
                                color={isListening ? COLORS.secondary : '#FFF'}
                            />
                        </TouchableOpacity>
                        <Text style={styles.voiceText}>
                            {isListening ? 
                                (speechRecognitionStatus === 'listening' ? `Mów teraz w języku ${expectedResponseLanguage.toUpperCase()}...` : 'Analizowanie odpowiedzi...') 
                                : (voiceResponse || `Czekam na Twoją odpowiedź w języku ${expectedResponseLanguage.toUpperCase()}. Mów, gdy będziesz gotów.`)}
                        </Text>
                    </View>
                )}

                {/* Controls - widoczne tylko po odwróceniu */}
                {isFlipped && (
                    <View style={styles.studyControls}>
                        <TouchableOpacity style={[styles.controlBtn, styles.btnForgot]} onPress={() => handleNextCard(false)}>
                            <Ionicons name="close" size={28} color="#FFF" />
                            <Text style={styles.controlText}>Forgot</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.controlBtn, styles.btnKnown]} onPress={() => handleNextCard(true)}>
                            <Ionicons name="checkmark" size={28} color="#FFF" />
                            <Text style={styles.controlText}>Knew it</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }


    // --- NORMAL VIEW ---
    return (
        <View style={styles.container}>
            {hasImage && (
                <View style={styles.imageBackground}>
                    <Image source={{ uri: note.content }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <LinearGradient colors={['rgba(0,0,0,0.3)', COLORS.bg]} style={StyleSheet.absoluteFill} />
                </View>
            )}

            <BlurView intensity={50} tint="dark" style={styles.navbar}>
                <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <View style={styles.navActions}>
                    {/* Study Button */}
                    {!isEditing && (
                        <TouchableOpacity onPress={startStudy} style={[styles.navBtn, { marginRight: 8, backgroundColor: note.anchor.color + '30', borderColor: note.anchor.color, borderWidth: 1 }]}>
                            <Ionicons name="flash" size={20} color={note.anchor.color} />
                        </TouchableOpacity>
                    )}

                    {isEditing ? (
                        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Done</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.navBtn}>
                                <Ionicons name="create-outline" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, { marginLeft: 8 }]}>
                                <Ionicons name="trash-outline" size={24} color="#FF453A" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </BlurView>

            <ScrollView 
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {!hasImage && <View style={{ height: 80 }} />}
                <View style={styles.textWrapper}>
                    <Text style={styles.meta}>
                        {note.anchor.emoji} 
                        {note.updatedAt ? new Date(note.updatedAt).toLocaleDateString() : new Date(note.createdAt).toLocaleDateString()} • 
                        {note.folder || 'No Folder'} • 
                        LANG: {noteLanguageCode.toUpperCase()}
                    </Text>
                    {isEditing ? (
                        <>
                            {/* 1. Wybór Folderu w Trybie Edycji */}
                            <FolderPicker 
                                currentFolder={editFolder}
                                setFolder={setEditFolder}
                                allFolders={folders} 
                            />
                            
                            {/* 2. Pole Tekstowe do Edycji Treści */}
                            <TextInput
                                value={editText}
                                onChangeText={setEditText}
                                multiline
                                style={[styles.input, editStyles.editInput]}
                                placeholder="Wpisz słówka w formacie: Słówko Obce - Tłumaczenie"
                                placeholderTextColor={COLORS.textSec}
                                autoFocus
                            />
                        </>
                    ) : (
                        <Text style={styles.bodyText}>
                            {note.type === 'text'
                                ? note.content
                                : note.textContent}
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* KOMPONENTY MODALNE */}
            <DeleteModal
                visible={isDeleteModalVisible}
                onCancel={() => setIsDeleteModalVisible(false)}
                onConfirm={handleConfirmDelete}
            />
            <SessionCompleteModal
                visible={isSessionCompleteModalVisible}
                onClose={() => setIsSessionCompleteModalVisible(false)}
            />
            <EngineFailedModal
                visible={isEngineFailedModalVisible}
                onClose={() => setIsEngineFailedModalVisible(false)}
            />
        </View>
    );
}

// --- NOWE/DODATKOWE STYLE DLA TRYBU EDYCJI ---
// Te style powinny być w NoteDetailStyles, ale dla kompletności są tutaj
const editStyles = StyleSheet.create({
    editInput: {
        minHeight: 150,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        color: COLORS.text,
        fontSize: 16,
        lineHeight: 24,
        textAlignVertical: 'top',
        marginTop: 15,
    },
    folderPickerContainer: {
        marginTop: 15,
        paddingHorizontal: 5,
    },
    folderPickerLabel: {
        color: COLORS.textSec,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    folderScroll: {
        gap: 8,
        paddingRight: 20,
        alignItems: 'center',
    },
    folderInputWrapper: {
        minWidth: 120,
        marginRight: 5,
    },
    folderInput: {
        borderWidth: 1,
        borderColor: COLORS.textSec + '50',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        color: COLORS.text,
        height: 40,
        fontSize: 16,
    },
    folderOption: {
        backgroundColor: '#2A2A2A',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        height: 40, 
        justifyContent: 'center', 
    },
    folderOptionSelected: {
        backgroundColor: COLORS.primary,
    },
    folderOptionText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '500',
    },
});