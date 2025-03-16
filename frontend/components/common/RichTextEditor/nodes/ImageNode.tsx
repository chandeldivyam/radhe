import type {
	DOMConversionMap,
	DOMExportOutput,
	LexicalNode,
	NodeKey,
	SerializedLexicalNode,
	Spread,
} from 'lexical';
import { $applyNodeReplacement, DecoratorNode, $getNodeByKey } from 'lexical';
import * as React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Loader2, ImageIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { JSX } from 'react';
import { useAuth } from '@/lib/auth/authContext';

// Define the image payload type
export interface ImagePayload {
	src: string;
	altText: string;
	key?: NodeKey;
	isLoading?: boolean;
	uploadProgress?: number;
}

// Define the serialized node type for persistence
export type SerializedImageNode = Spread<
	{
		src: string;
		altText: string;
		isLoading?: boolean;
		uploadProgress?: number;
	},
	SerializedLexicalNode
>;

// The actual ImageNode class that extends DecoratorNode
export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;
	__isLoading: boolean;
	__uploadProgress: number;

	static getType(): string {
		return 'image';
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(
			node.__src,
			node.__altText,
			node.__isLoading,
			node.__uploadProgress,
			node.__key
		);
	}

	constructor(
		src: string,
		altText: string,
		isLoading: boolean = false,
		uploadProgress: number = 0,
		key?: NodeKey
	) {
		super(key);
		this.__src = src;
		this.__altText = altText;
		this.__isLoading = isLoading;
		this.__uploadProgress = uploadProgress;
	}

	// DOM creation and update methods
	createDOM(): HTMLElement {
		const span = document.createElement('div');
		span.className = 'image-node-container';
		return span;
	}

	updateDOM(): boolean {
		return false;
	}

	// Setter methods for updating properties
	setLoading(isLoading: boolean): void {
		const self = this.getWritable();
		self.__isLoading = isLoading;
	}

	setUploadProgress(progress: number): void {
		const self = this.getWritable();
		self.__uploadProgress = progress;
	}

	setSrc(src: string): void {
		const self = this.getWritable();
		self.__src = src;
	}

	setAltText(altText: string): void {
		const self = this.getWritable();
		self.__altText = altText;
	}

	// Export methods for serialization
	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			type: 'image',
			src: this.__src,
			altText: this.__altText,
			isLoading: this.__isLoading,
			uploadProgress: this.__uploadProgress,
			version: 1,
		};
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const node = $createImageNode({
			src: serializedNode.src,
			altText: serializedNode.altText,
			isLoading: serializedNode.isLoading,
			uploadProgress: serializedNode.uploadProgress,
		});
		return node;
	}

	// DOM export for copying to clipboard, etc.
	exportDOM(): DOMExportOutput {
		const element = document.createElement('img');
		element.setAttribute('src', this.__src);
		element.setAttribute('alt', this.__altText);
		return { element };
	}

	// DOM import for pasting from clipboard
	static importDOM(): DOMConversionMap | null {
		return {
			img: () => ({
				conversion: convertImageElement,
				priority: 0,
			}),
		};
	}

	// Render method that returns the React component
	decorate(): JSX.Element {
		return (
			<ImageComponent
				src={this.__src}
				altText={this.__altText}
				isLoading={this.__isLoading}
				uploadProgress={this.__uploadProgress}
				nodeKey={this.getKey()}
			/>
		);
	}
}

// The React component that renders the image
function ImageComponent({
	src,
	altText,
	isLoading,
	uploadProgress = 0,
	nodeKey,
}: {
	src: string;
	altText: string;
	isLoading?: boolean;
	uploadProgress?: number;
	nodeKey: string;
}) {
	const [editor] = useLexicalComposerContext();
	const { user } = useAuth();
	const [showOptions, setShowOptions] = useState(true);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [linkUrl, setLinkUrl] = useState('');
	const optionsRef = useRef<HTMLDivElement>(null);

	// Close options when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				optionsRef.current &&
				!optionsRef.current.contains(event.target as Node)
			) {
				setShowOptions(false);
			}
		};

		if (showOptions) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showOptions]);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file && user?.id && user?.organization_id) {
				// Update the current node instead of creating a new one
				editor.update(() => {
					const node = $getNodeByKey(nodeKey);
					if ($isImageNode(node)) {
						node.setLoading(true);
						node.setUploadProgress(0);
						node.setAltText(file.name);
					}
				});

				// Create form data for file upload
				const formData = new FormData();
				formData.append('file', file);
				formData.append('userId', user.id);
				formData.append('organizationId', user.organization_id);

				// Create XMLHttpRequest for progress tracking
				const xhr = new XMLHttpRequest();

				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						const percentComplete = Math.round(
							(event.loaded / event.total) * 100
						);

						// Update the progress in the current node
						editor.update(() => {
							const node = $getNodeByKey(nodeKey);
							if ($isImageNode(node)) {
								node.setUploadProgress(percentComplete);
							}
						});
					}
				};

				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							const response = JSON.parse(xhr.responseText);
							const imageUrl = response.public_url;

							// Update the current node with the image URL
							editor.update(() => {
								const node = $getNodeByKey(nodeKey);
								if ($isImageNode(node)) {
									node.setLoading(false);
									node.setSrc(imageUrl);
								}
							});
						} catch (e) {
							console.error('Error parsing JSON response:', e);
							editor.update(() => {
								const node = $getNodeByKey(nodeKey);
								if ($isImageNode(node)) {
									node.setLoading(false);
								}
							});
						}
					} else {
						console.error('Upload failed with status', xhr.status);
						editor.update(() => {
							const node = $getNodeByKey(nodeKey);
							if ($isImageNode(node)) {
								node.setLoading(false);
							}
						});
					}
				};

				xhr.onerror = () => {
					console.error('Network error');
					editor.update(() => {
						const node = $getNodeByKey(nodeKey);
						if ($isImageNode(node)) {
							node.setLoading(false);
						}
					});
				};

				xhr.open('POST', '/api/file/upload');
				xhr.send(formData);

				e.target.value = '';
				setShowOptions(false);
			}
		},
		[editor, nodeKey, user]
	);

	const handleUploadClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleLinkSubmit = useCallback(() => {
		if (linkUrl.trim()) {
			// Update the current node instead of creating a new one
			editor.update(() => {
				const node = $getNodeByKey(nodeKey);
				if ($isImageNode(node)) {
					node.setSrc(linkUrl);
					node.setAltText('Linked image');
				}
			});
			setLinkUrl('');
			setShowOptions(false);
		}
	}, [editor, nodeKey, linkUrl]);

	// If loading, show progress
	if (isLoading) {
		return (
			<div className="w-full py-8 bg-gray-100 dark:bg-gray-800 rounded-md flex flex-col items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
				<div className="w-1/2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
					<div
						className="h-full bg-primary transition-all duration-300 ease-out"
						style={{ width: `${uploadProgress}%` }}
					/>
				</div>
				<p className="text-sm text-muted-foreground mt-2">
					{uploadProgress}% uploaded
				</p>
			</div>
		);
	}

	// Use src directly from props instead of currentSrc
	if (src) {
		return (
			<div className="image-wrapper my-4 w-full">
				<img
					src={src}
					alt={altText}
					className="max-w-full rounded-md"
					draggable="false"
				/>
			</div>
		);
	}

	// Notion-style placeholder with floating options
	return (
		<div className="relative">
			<div
				className="flex items-center gap-2 p-3 text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
				onClick={() => setShowOptions(true)}
			>
				<ImageIcon className="h-5 w-5" />
				<span>Add an image</span>
			</div>

			{/* Floating options that appear when clicked */}
			{showOptions && (
				<div
					ref={optionsRef}
					className="absolute top-full left-0 mt-1 z-10 bg-background border border-border rounded-md shadow-md w-72"
				>
					<Tabs defaultValue="upload" className="w-full">
						<TabsList className="w-full grid grid-cols-4">
							<TabsTrigger value="upload">Upload</TabsTrigger>
							<TabsTrigger value="embed">Embed</TabsTrigger>
						</TabsList>

						<TabsContent value="upload" className="p-3">
							<Button
								variant="secondary"
								className="w-full py-6"
								onClick={handleUploadClick}
							>
								Upload file
							</Button>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
							/>
						</TabsContent>

						<TabsContent value="embed" className="p-3">
							<div className="flex gap-2">
								<input
									type="text"
									placeholder="Paste image link..."
									className="flex-1 p-2 border border-input rounded-md"
									value={linkUrl}
									onChange={(e) => setLinkUrl(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											handleLinkSubmit();
										}
									}}
								/>
								<Button onClick={handleLinkSubmit}>
									<ExternalLink className="h-4 w-4" />
								</Button>
							</div>
						</TabsContent>
					</Tabs>
				</div>
			)}
		</div>
	);
}

// Utility function to convert DOM elements to ImageNodes
function convertImageElement(domNode: Node): null | { node: ImageNode } {
	if (!(domNode instanceof HTMLImageElement)) {
		return null;
	}
	const { src, alt: altText } = domNode;
	return { node: $createImageNode({ src, altText }) };
}

// Factory function to create ImageNodes
export function $createImageNode({
	src,
	altText,
	key,
	isLoading,
	uploadProgress = 0,
}: ImagePayload): ImageNode {
	return $applyNodeReplacement(
		new ImageNode(src, altText, isLoading, uploadProgress, key)
	);
}

// Type guard function
export function $isImageNode(
	node: LexicalNode | null | undefined
): node is ImageNode {
	return node instanceof ImageNode;
}
