import { Dimensions, Platform, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

// --- DEFINICJE STYLÓW ---
export const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    imageBackground: { position: 'absolute', top: 0, width: width, height: width * 1.2 },
    navbar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 60, paddingBottom: 10, paddingHorizontal: 20, zIndex: 10
    },
    navBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
    },
    navActions: { flexDirection: 'row' },
    saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    saveText: { color: '#FFF', fontWeight: '600' },
    content: { paddingHorizontal: 24, paddingBottom: 50, minHeight: '100%' },
    textWrapper: { marginTop: 20 },
    meta: { color: COLORS.textSec, fontSize: 12, marginBottom: 16, textTransform: 'uppercase', opacity: 0.7 },
    bodyText: { color: COLORS.text, fontSize: 18, lineHeight: 28, fontFamily: 'System' },
    input: { color: COLORS.text, fontSize: 18, lineHeight: 28, minHeight: 200, textAlignVertical: 'top' },

    // STUDY MODE STYLES
    studyContainer: { flex: 1, backgroundColor: '#000' },
    studyHeader: { paddingTop: 60, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { padding: 8 },
    progressText: { color: COLORS.text, fontSize: 16, fontWeight: '600', fontFamily: 'Geo' },
    
    // NOWE STYLE DLA PRZEŁĄCZNIKA GŁOSOWEGO
    voiceToggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        gap: 5,
    },
    voiceToggleActive: {
        backgroundColor: COLORS.primary,
    },

    cardArea: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20, 
        perspective: 1000 
    }, 
    cardWrapper: { 
        width: width - 60, 
        height: 400, 
    },
    flashcard: {
        width: '100%', height: '100%', position: 'absolute',
        borderRadius: 24, overflow: 'hidden',
        backfaceVisibility: Platform.OS === 'ios' ? 'hidden' : 'visible',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)'
    },
    flashcardBack: {
        // nothing specific here
    },
    cardGradient: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' },
    cardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 'bold', letterSpacing: 2, marginBottom: 20 },
    cardText: { color: '#FFF', fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 30 },
    tapHint: { position: 'absolute', bottom: 30, color: 'rgba(255,255,255,0.3)', fontSize: 12 },

    studyControls: { flexDirection: 'row', paddingBottom: 60, paddingHorizontal: 40, justifyContent: 'space-between', gap: 20 },
    controlBtn: { flex: 1, height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    btnForgot: { backgroundColor: '#FF453A' },
    btnKnown: { backgroundColor: '#32D74B' },
    controlText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    // STYLE DLA TRYBU GŁOSOWEGO
    voiceSection: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 60,
    },
    voiceBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    voiceBtnListening: {
        backgroundColor: '#FF453A',
        transform: [{ scale: 1.1 }],
    },
    voiceText: {
        color: COLORS.textSec,
        fontSize: 16,
        textAlign: 'center',
        minHeight: 40,
    },

    // STYLES DLA MODALI
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalBlurBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    modalCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalContentWrapper: {
        width: '100%',
        alignItems: 'center',
    },
    modalIcon: {
        marginBottom: 16,
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalBody: {
        color: COLORS.textSec,
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalActionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancel: {
        backgroundColor: '#333333',
    },
    modalDelete: {
        backgroundColor: '#FF453A',
    },
    modalCancelText: {
        color: COLORS.text,
        fontWeight: '600',
    },
    modalConfirm: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#FFF',
        fontWeight: '600',
    },
});