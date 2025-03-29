'use client';

import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isParagraphNode } from 'lexical';
import { $convertFromMarkdownString } from '@lexical/markdown';
import { TRANSFORMERS as CUSTOM_TRANSFORMERS } from '../MarkdownTransformers';

interface InitialMarkdownLoaderProps {
  initialSyncPromise: Promise<void> | null;
  markdown?: string;
}

export function InitialMarkdownLoaderPlugin({ initialSyncPromise, markdown }: InitialMarkdownLoaderProps) {
  const [editor] = useLexicalComposerContext();
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState(false);
  const [hasAppliedMarkdown, setHasAppliedMarkdown] = useState(false);

  useEffect(() => {
    if (initialSyncPromise && !isInitialSyncComplete) {
      initialSyncPromise.then(() => {
        console.log("Initial sync promise resolved.");
        setIsInitialSyncComplete(true);
      }).catch((error) => {
        console.error("Initial sync promise failed:", error);
        // Handle potential errors or timeouts if needed, maybe still mark as complete
        setIsInitialSyncComplete(true);
      });
    }
  }, [initialSyncPromise, isInitialSyncComplete]);

  useEffect(() => {
    // Run this effect only when initial sync is complete, markdown is provided,
    // and we haven't applied it yet.
    if (isInitialSyncComplete && markdown && !hasAppliedMarkdown && editor) {
      editor.update(() => {
        const root = $getRoot();
        // Check if the editor is effectively empty.
        // A common initial state is a single empty paragraph.
        const children = root.getChildren();
        const isEmpty = children.length === 0 ||
          (children.length === 1 && $isParagraphNode(children[0]) && children[0].getTextContentSize() === 0);

        if (isEmpty) {
          console.log("Editor is empty after initial sync, applying suggestion markdown.");
          // Clear existing empty content before applying markdown
          root.clear();
          $convertFromMarkdownString(markdown, CUSTOM_TRANSFORMERS);
          setHasAppliedMarkdown(true); // Mark as applied
        } else {
          console.log("Editor is not empty after initial sync, skipping initial markdown application.");
          // Mark as applied even if skipped, to prevent future attempts
          setHasAppliedMarkdown(true);
        }
      });
    }
  }, [isInitialSyncComplete, markdown, editor, hasAppliedMarkdown]);

  // This component doesn't render anything itself
  return null;
}