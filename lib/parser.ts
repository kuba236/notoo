export type ParsedContentType = 
  | { type: 'flashcard', term: string, definition: string }
  | { type: 'quote', text: string }
  | { type: 'list', items: string[] }
  | { type: 'text', content: string };

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

    const flashcardMatch = blockText.match(/^([^:\n]+)[\:\-]\s*([^\n]+)$/); 
    if (flashcardMatch && currentBlock.length === 1) { 
      results.push({
        type: 'flashcard',
        term: flashcardMatch[1].trim(),
        definition: flashcardMatch[2].trim()
      });
      currentBlock = [];
      return;
    }

    const listPattern = /^[\*\-•\d\.]+\s/;
    const isList = currentBlock.every(line => line.match(listPattern)) && currentBlock.length > 1;

    if (isList) {
        const listItems = currentBlock.map(line => line.replace(listPattern, '').trim());
        results.push({
            type: 'list',
            items: listItems
        });
        currentBlock = [];
        return;
    }
    
    const quoteMatch = blockText.match(/^["„']([^"„'\\n]+)["”']$/);
    if (quoteMatch && currentBlock.length === 1) {
        results.push({
            type: 'quote',
            text: quoteMatch[1].trim()
        });
        currentBlock = [];
        return;
    }
    
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
  
  flushBlock();
  
  return results;
}