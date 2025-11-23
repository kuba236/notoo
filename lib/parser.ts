// lib/parser.ts

export type ParsedContentType = 
  | { type: 'flashcard', term: string, definition: string }
  | { type: 'quote', text: string }
  | { type: 'list', items: string[] }
  | { type: 'text', content: string };

/**
 * Parsuje wejściowy tekst, aby zidentyfikować "smart content" (fiszki, cytaty, listy).
 */
export function parseSmartContent(text: string): ParsedContentType[] {
  const lines = text.trim().split('\n').filter(line => line.trim() !== '');
  const results: ParsedContentType[] = [];
  let currentBlock: string[] = [];

  const flushBlock = () => {
    if (currentBlock.length === 0) return;

    const blockText = currentBlock.join('\n').trim();
    if (blockText === '') {
        currentBlock = [];
        return;
    }

    // 1. Sprawdzenie Fiszki (Termin: Definicja)
    // Akceptuje Termin: Definicja lub Termin - Definicja
    const flashcardMatch = blockText.match(/^([^:\n]+)[\:\-]\s*([^\n]+)$/); 
    if (flashcardMatch && currentBlock.length === 1) { // Tylko jedna linia dla atomowej fiszki
      results.push({
        type: 'flashcard',
        term: flashcardMatch[1].trim(),
        definition: flashcardMatch[2].trim()
      });
      currentBlock = [];
      return;
    }

    // 2. Sprawdzenie Listy (Zacznij od *, -, lub cyfry.)
    // Wymaga przynajmniej dwóch linii, żeby to była lista, a nie pojedynczy myślnik
    const listPattern = /^[\*\-•\d\.]+\s/;
    const isList = currentBlock.every(line => line.match(listPattern)) && currentBlock.length > 1;

    if (isList) {
        // Usuń znaczniki listy i białe spacje
        const listItems = currentBlock.map(line => line.replace(listPattern, '').trim());
        results.push({
            type: 'list',
            items: listItems
        });
        currentBlock = [];
        return;
    }
    
    // 3. Sprawdzenie Cytatu
    const quoteMatch = blockText.match(/^["„']([^"„'\\n]+)["”']$/);
    if (quoteMatch && currentBlock.length === 1) {
        results.push({
            type: 'quote',
            text: quoteMatch[1].trim()
        });
        currentBlock = [];
        return;
    }
    
    // 4. Domyślnie - Zwykły Tekst
    results.push({ type: 'text', content: blockText });
    currentBlock = [];
  };

  for (const line of lines) {
    if (line.trim() === '' && currentBlock.length > 0) {
      flushBlock();
    } else {
      currentBlock.push(line);
    }
  }
  
  flushBlock(); // Przetwarzanie ostatniego bloku
  
  return results;
}