'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import {WebsocketProvider} from 'y-websocket';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback } from "react";
interface RichTextEditorProps {
  noteId: string;
}
import {Provider} from '@lexical/yjs';


function getDocFromMap(id: string, yjsDocMap: Map<string, Y.Doc>): Y.Doc {
    let doc = yjsDocMap.get(id);
  
    if (doc === undefined) {
      doc = new Y.Doc();
      yjsDocMap.set(id, doc);
    } else {
      doc.load();
    }
  
    return doc;
  }

export function RichTextEditor({ noteId }: RichTextEditorProps) {

    const providerFactory = useCallback(
        (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
          const doc = getDocFromMap(id, yjsDocMap);
          const wsUrl = process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || 'ws://localhost:1616';
          const provider = new WebsocketProvider(wsUrl, id, doc);
          
          provider.on('status', (event: { status: string }) => {
            console.log('connection status:', event.status);
          });
          
          provider.on('connection-error', (event: Event, provider: WebsocketProvider) => {
            console.log('websocket error:', event);
          });
    
          return provider as unknown as Provider;
        }, [],
    );
    
  return (
    <LexicalComposer
      initialConfig={{
        namespace: `notes`,
        editorState: null,
        nodes: [],
        theme: {
            root: 'p-4 border rounded-md min-h-[200px] focus:outline-none',
        },
        onError: (error: Error) => {
          console.error(error);
        },
      }}
    >
        <PlainTextPlugin
            contentEditable={<ContentEditable />}
            placeholder={<div>Enter some text...</div>}
            ErrorBoundary={LexicalErrorBoundary}
        />
        <CollaborationPlugin
            id={`${noteId}`}
            providerFactory={providerFactory}
            shouldBootstrap={true}
        />
    </LexicalComposer>
  );
}
