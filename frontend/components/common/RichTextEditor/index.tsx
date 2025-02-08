'use client';

import './editor.css';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CollaborationPlugin } from "@lexical/react/LexicalCollaborationPlugin";
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import { editorConfig } from './config';
import * as Y from "yjs";
import { type Provider } from "@lexical/yjs";
import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { useEffect, useRef, useState } from "react";
interface RichTextEditorProps {
  noteId: string;
  username?: string;
  editable?: boolean;
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

export function RichTextEditor({ noteId, username, editable = true }: RichTextEditorProps) {
  const providerRef = useRef<Provider | null>(null);
  const websocketProviderRef = useRef<HocuspocusProviderWebsocket | null>(null);
  const cursorsContainerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  
  useEffect(() => {
		if (editorContainerRef.current) {
			setIsEditorReady(true);
		}
	}, []);


  return (
    <div className="relative">
      <div ref={cursorsContainerRef} className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none" />
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          editable: editable,
        }}
      >
        <div className="editor-container" ref={editorContainerRef} style={{position: 'relative'}}>
              <RichTextPlugin
                contentEditable={<ContentEditable style={{position: 'relative', marginLeft: '35px'}}/>}
                ErrorBoundary={LexicalErrorBoundary}
              />
              <HistoryPlugin />
              <AutoFocusPlugin />
              <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
              <ListPlugin />
              <TabIndentationPlugin />
              <EmojiPickerPlugin />
              {isEditorReady && editorContainerRef.current && (
                <DraggableBlockPlugin anchorElem={editorContainerRef.current} />
              )}
              <AutoLinkPlugin />
              <LinkPlugin />
              <ClickableLinkPlugin disabled={false}/>
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
        </div>
      </LexicalComposer>
    </div>
  );
}
