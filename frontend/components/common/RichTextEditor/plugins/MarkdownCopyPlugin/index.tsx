import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $convertToMarkdownString } from '@lexical/markdown';
import { $getSelection, $isRangeSelection } from 'lexical';
import { useEffect } from 'react';
import { TRANSFORMERS } from '../MarkdownTransformers';
import type { JSX } from 'react';

export function MarkdownCopyPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle copy event
    const copyListener = (event: ClipboardEvent) => {
      // Only handle copy events when the editor has focus
      if (!editor.isEditable() || !editor.getRootElement()?.contains(document.activeElement)) {
        return;
      }

      let markdownString = '';
      
      // Get the selection and convert to markdown
      editor.getEditorState().read(() => {
        // We have a valid selection - prevent default copy behavior
        event.preventDefault();
        
        // Get the markdown string - we'll need to capture it in a variable
        markdownString = $convertToMarkdownString(TRANSFORMERS);
        console.log(markdownString);
        
        // Set the clipboard data
        event.clipboardData?.setData('text/plain', markdownString);
      });
    };

    // Register the event listener for copy events
    document.addEventListener('copy', copyListener);
    
    return () => {
      // Clean up the event listener when the component unmounts
      document.removeEventListener('copy', copyListener);
    };
  }, [editor]);

  // This plugin doesn't render anything
  return null;
}