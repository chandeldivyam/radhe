import {
	useFloating,
	offset,
	flip,
	shift,
	autoUpdate,
} from '@floating-ui/react';
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { SuggestionNode } from '../../nodes/SuggestionNode';
import { $getNodeByKey } from 'lexical';

interface SuggestionButtonsProps {
	nodeKey: string;
}

export function SuggestionButtons({ nodeKey }: SuggestionButtonsProps) {
	const [editor] = useLexicalComposerContext();
	const [referenceElement, setReferenceElement] =
		useState<HTMLElement | null>(null);

	// Get the DOM element for the suggestion node and its type
	useEffect(() => {
		const updateReference = () => {
			const element = editor.getElementByKey(nodeKey);
			if (element) {
				setReferenceElement(element);
			}
		};

		updateReference();
		// Register update listener to keep reference in sync
		const unregister = editor.registerUpdateListener(updateReference);

		return () => unregister();
	}, [editor, nodeKey]);

	// Configure floating UI positioning with autoUpdate for dynamic positioning
	const { refs, floatingStyles } = useFloating({
		elements: {
			reference: referenceElement,
		},
		middleware: [offset(5), flip(), shift()],
		placement: 'top-end',
		whileElementsMounted: autoUpdate, // This ensures the position updates when content moves
	});

	const handleAccept = () => {
		editor.update(() => {
			const suggestionNode = $getNodeByKey(nodeKey);
			if (!suggestionNode || !(suggestionNode instanceof SuggestionNode))
				return;

			switch (suggestionNode.__suggestionType) {
				case 'add':
					// Get the children of the suggestion node (the suggested content)
					const children = suggestionNode.getChildren();

					// Add the children after the suggestion node
					children.reverse().forEach((node) => {
						suggestionNode.insertAfter(node);
					});

					suggestionNode.remove();
					break;
				case 'delete':
					suggestionNode.remove();
					break;
			}
		});
	};

	const handleReject = () => {
		editor.update(() => {
			const suggestionNode = $getNodeByKey(nodeKey);
			if (!suggestionNode || !(suggestionNode instanceof SuggestionNode))
				return;
			switch (suggestionNode.__suggestionType) {
				case 'add':
					suggestionNode.remove();
					break;
				case 'delete':
					const children = suggestionNode.getChildren();
					children.reverse().forEach((node) => {
						suggestionNode.insertAfter(node);
					});
					suggestionNode.remove();
					break;
			}
		});
	};

	// Don't render if there's no associated DOM element
	if (!referenceElement) return null;

	return (
		<div
			ref={refs.setFloating}
			style={{
				...floatingStyles,
				pointerEvents: 'auto',
				zIndex: 100,
				display: 'flex',
				gap: '4px',
				background: 'var(--popover)',
				padding: '4px',
				borderRadius: '4px',
				boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
			}}
		>
			<button
				onClick={handleAccept}
				className="suggestion-accept-btn"
				style={{
					backgroundColor: 'hsl(var(--success))',
					color: 'hsl(var(--success-foreground))',
					border: 'none',
					padding: '4px 8px',
					borderRadius: '4px',
					cursor: 'pointer',
					fontWeight: 500,
					fontSize: '12px',
				}}
			>
				Accept
			</button>
			<button
				onClick={handleReject}
				className="suggestion-reject-btn"
				style={{
					backgroundColor: 'hsl(var(--destructive))',
					color: 'hsl(var(--destructive-foreground))',
					border: 'none',
					padding: '4px 8px',
					borderRadius: '4px',
					cursor: 'pointer',
					fontWeight: 500,
					fontSize: '12px',
				}}
			>
				Reject
			</button>
		</div>
	);
}
