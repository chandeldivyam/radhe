'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import * as Y from "yjs";
import { type Provider } from "@lexical/yjs";
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useRef } from "react";

interface RichTextEditorProps {
  noteId: string;
  username?: string;
}

// Create a shared websocket instance
const websocket = new HocuspocusProviderWebsocket({
  url: process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL || 'ws://localhost:1616',
  connect: false,
});


function createWebsocketProvider({ 
  id, 
  yjsDocMap 
}: { 
  id: string; 
  yjsDocMap: Map<string, Y.Doc>; 
}) {
  let doc = yjsDocMap.get(id);
  
  if (!doc) {
    doc = new Y.Doc();
    yjsDocMap.set(id, doc);
  }

  const provider = new HocuspocusProvider({
    websocketProvider: websocket,
    name: id,
    document: doc,
    onSynced: () => {
      console.log(`Document ${id} synced`);
    },
    onStatus: ({ status }) => {
      console.log(`Connection status: ${status}`);
    },
    onDisconnect: () => {
      console.log('Disconnected from collaboration server');
    },
  });

  return {
    provider: provider as unknown as Provider,
    websocketProvider: websocket
  };
}

export function RichTextEditor({ noteId, username }: RichTextEditorProps) {
  const providerRef = useRef<Provider | null>(null);
  const websocketProviderRef = useRef<HocuspocusProviderWebsocket | null>(null);
  const cursorsContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative">
      <div ref={cursorsContainerRef} className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none" />
      <LexicalComposer
        initialConfig={{
          namespace: `notes`,
          editorState: null,
          nodes: [],
          theme: {
            root: 'p-4 min-h-[200px]',
          },
          onError: (error: Error) => {
            console.error(error);
          },
        }}
      >
        <PlainTextPlugin
          contentEditable={<ContentEditable />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <AutoFocusPlugin />
        <CollaborationPlugin
          key={noteId}
          id={noteId}
          providerFactory={(id, yjsDocMap) => {
            if (!providerRef.current) {
              const { provider, websocketProvider } = createWebsocketProvider({ id, yjsDocMap });
              providerRef.current = provider;
              websocketProviderRef.current = websocketProvider;
              return providerRef.current;
            }
            return providerRef.current;
          }}
          shouldBootstrap={true}
          username={username}
          cursorsContainerRef={cursorsContainerRef}
        />
      </LexicalComposer>
    </div>
  );
}
