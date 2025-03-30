'use client';

import './editor.css';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import EmojiPickerPlugin from './plugins/EmojiPickerPlugin';
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin';
import AutoLinkPlugin from './plugins/AutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin';
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin';
import LinkPlugin from './plugins/LinkPlugin';
import { editorConfig } from './config';
import * as Y from 'yjs';
import { type Provider } from '@lexical/yjs';
import {
	HocuspocusProvider,
	HocuspocusProviderWebsocket,
} from '@hocuspocus/provider';
import { useEffect, useRef, useState } from 'react';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { ImagePlugin } from './plugins/ImagePlugin';
import DragDropPastePlugin from './plugins/DragDropPastePlugin';
// import { MarkdownCopyPlugin } from './plugins/MarkdownCopyPlugin';
import { SuggestionPlugin } from './plugins/SuggestionPlugin';
import { SuggestionUIPlugin } from './plugins/SuggestionUIPlugin';
import { MarkdownToNotePlugin } from './plugins/MarkdownToNote';
import { EditorContentSaverPlugin } from './plugins/EditorContentSaver';
import { InitialMarkdownLoaderPlugin } from './plugins/InitialMarkdownLoaderPlugin';

interface RichTextEditorProps {
	noteId: string;
	username?: string;
	editable?: boolean;
	markdown?: string;
}

// Define extended provider interface with our custom properties
interface EnhancedProvider extends Provider {
	_syncTimeout?: NodeJS.Timeout;
	_retryCount?: number;
	_isInitialSync?: boolean;
	_resolveInitialSync?: () => void; // Callback to resolve promise
}

// Update the websocket configuration
const websocket = new HocuspocusProviderWebsocket({
	url:
		process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_URL ||
		'ws://localhost:1616',
	connect: false,
	delay: 1000,
});

// Create a provider factory with proper typing
function createWebsocketProvider({
	id,
	yjsDocMap,
}: {
	id: string;
	yjsDocMap: Map<string, Y.Doc>;
}): {
	provider: Provider;
	websocketProvider: HocuspocusProviderWebsocket;
	initialSyncPromise: Promise<void>;
} {
	let doc = yjsDocMap.get(id);

	if (!doc) {
		doc = new Y.Doc();
		yjsDocMap.set(id, doc);
	}

	// Create a promise that will resolve upon initial sync
	let resolveInitialSync!: () => void;
	const initialSyncPromise = new Promise<void>((resolve) => {
		resolveInitialSync = resolve;
	});

	// First create the provider with minimal configuration
	const hocusProvider = new HocuspocusProvider({
		websocketProvider: websocket,
		name: id,
		document: doc,
	});

	// Store reference as enhanced provider
	const enhancedProvider = hocusProvider as unknown as EnhancedProvider;

	// Add a flag to track initial connection state
	enhancedProvider._isInitialSync = true;
	enhancedProvider._resolveInitialSync = resolveInitialSync; // Store resolver

	// Then set up the callbacks separately
	hocusProvider.on('synced', ({ state }: { state: boolean }) => {
		if (state) {
			console.log(`Document ${id} synced`);

			// Clear any pending timeouts
			if (enhancedProvider._syncTimeout) {
				clearTimeout(enhancedProvider._syncTimeout);
				enhancedProvider._syncTimeout = undefined;
			}

			// Resolve the promise only on the first successful sync
			if (enhancedProvider._isInitialSync) {
				enhancedProvider._isInitialSync = false;
				console.log(`Document ${id} initial sync complete.`);
				if (enhancedProvider._resolveInitialSync) {
					enhancedProvider._resolveInitialSync();
				}
			}
		}
	});

	hocusProvider.on('status', ({ status }: { status: string }) => {
		console.log(`Connection status for ${id}: ${status}`);

		if (status === 'connected') {
			// Set a timeout for sync completion
			if (!enhancedProvider._syncTimeout) {
				// Use shorter timeout for initial connection, longer for subsequent ones
				const timeoutDuration = enhancedProvider._isInitialSync
					? 400
					: 5000;

				enhancedProvider._syncTimeout = setTimeout(() => {
					console.warn(
						`Document ${id} sync timed out after ${timeoutDuration}ms - forcing UI ready state`
					);

					// Only force reconnection on initial sync issues
					if (enhancedProvider._isInitialSync) {
						hocusProvider.disconnect();
						setTimeout(() => {
							console.log(
								`Attempting reconnection for ${id} after timeout`
							);
							hocusProvider.connect();
						}, 200); // Shorter reconnection delay for initial sync

						// Resolve the promise even on timeout to avoid blocking forever
						if (enhancedProvider._resolveInitialSync) {
							enhancedProvider._resolveInitialSync(); // Potentially unblock with potentially incorrect state initially
						}
					}

					// Mark that we've passed initial sync phase regardless
					enhancedProvider._isInitialSync = false;
				}, timeoutDuration);
			}
		} else if (status === 'disconnected' || status === 'connecting') {
			// Clear timeout if disconnected or still trying to connect
			if (enhancedProvider._syncTimeout) {
				clearTimeout(enhancedProvider._syncTimeout);
				enhancedProvider._syncTimeout = undefined;
			}
		}
	});

	hocusProvider.on('disconnect', () => {
		console.log('Disconnected from collaboration server');
	});

	hocusProvider.on('close', ({ event }: { event: CloseEvent }) => {
		console.warn(
			'WebSocket connection closed:',
			event?.code,
			event?.reason
		);
	});

	return {
		provider: enhancedProvider as unknown as Provider,
		websocketProvider: websocket,
		initialSyncPromise, // Return the promise
	};
}

export function RichTextEditor({
	noteId,
	username,
	editable = true,
	markdown,
}: RichTextEditorProps) {
	// Use state to hold the promise, ensuring it's stable across re-renders
	const [initialSyncPromise, setInitialSyncPromise] =
		useState<Promise<void> | null>(null);
	const providerRef = useRef<EnhancedProvider | null>(null);
	const websocketProviderRef = useRef<HocuspocusProviderWebsocket | null>(
		null
	);
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
			<div
				ref={cursorsContainerRef}
				className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
			/>
			<LexicalComposer
				initialConfig={{
					...editorConfig,
					editable: editable,
					// Remove editorState initialization - will be handled after sync
				}}
			>
				<div
					className="editor-container"
					ref={editorContainerRef}
					style={{ position: 'relative' }}
				>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								style={{
									position: 'relative',
									marginLeft: '35px',
								}}
							/>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<AutoFocusPlugin />
					<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
					<ListPlugin />
					<TabIndentationPlugin />
					<EmojiPickerPlugin />
					{isEditorReady && editorContainerRef.current && (
						<DraggableBlockPlugin
							anchorElem={editorContainerRef.current}
						/>
					)}
					<AutoLinkPlugin />
					<LinkPlugin />
					<ClickableLinkPlugin disabled={false} />
					<CodeHighlightPlugin />
					<SlashCommandPlugin />
					<HorizontalRulePlugin />
					<ImagePlugin />
					<DragDropPastePlugin />
					<SuggestionPlugin />
					<SuggestionUIPlugin />
					<MarkdownToNotePlugin />
					<EditorContentSaverPlugin noteId={noteId} />
					<CollaborationPlugin
						key={noteId}
						id={noteId}
						providerFactory={(id, yjsDocMap) => {
							if (!providerRef.current) {
								console.log(`Creating provider for ${id}`);
								const {
									provider,
									websocketProvider,
									initialSyncPromise: syncPromise,
								} = createWebsocketProvider({ id, yjsDocMap });
								providerRef.current =
									provider as EnhancedProvider;
								websocketProviderRef.current =
									websocketProvider;
								setInitialSyncPromise(syncPromise); // Store the promise in state
								return providerRef.current as Provider;
							}
							console.log(`Reusing provider for ${id}`);
							return providerRef.current as Provider;
						}}
						shouldBootstrap={true}
						username={username}
						cursorsContainerRef={cursorsContainerRef}
					/>

					{/* Add the Initial Markdown Loader Plugin */}
					<InitialMarkdownLoaderPlugin
						initialSyncPromise={initialSyncPromise}
						markdown={markdown}
					/>
				</div>
			</LexicalComposer>
		</div>
	);
}
