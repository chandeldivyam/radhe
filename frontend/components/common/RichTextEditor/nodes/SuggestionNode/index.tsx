import {
	ElementNode,
	LexicalNode,
	NodeKey,
	SerializedElementNode,
	Spread,
	$applyNodeReplacement,
} from 'lexical';

// Define the suggestion type (for now, only "add")
export type SuggestionType = 'add' | 'delete'; // We'll expand this later for "delete" and "modify"

// Define the serialized format for persistence
export type SerializedSuggestionNode = Spread<
	{
		suggestionType: SuggestionType;
	},
	SerializedElementNode
>;

export class SuggestionNode extends ElementNode {
	__suggestionType: SuggestionType;

	constructor(suggestionType: SuggestionType, key?: NodeKey) {
		super(key);
		this.__suggestionType = suggestionType;
	}

	static getType(): string {
		return 'suggestion';
	}

	static clone(node: SuggestionNode): SuggestionNode {
		return new SuggestionNode(node.__suggestionType, node.__key);
	}

	createDOM(): HTMLElement {
		const dom = document.createElement('div');
		dom.classList.add('suggestion', `suggestion-${this.__suggestionType}`);

		// Add Git-diff-like styling
		dom.style.padding = '2px 4px';
		dom.style.borderRadius = '3px';
		dom.style.margin = '2px 0';

		// Different colors for add vs delete
		if (this.__suggestionType === 'add') {
			dom.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'; // Light green
			dom.style.borderLeft = '3px solid #22c55e';
			dom.style.paddingLeft = '10px';
		} else {
			dom.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; // Light red
			dom.style.borderLeft = '3px solid #ef4444';
			dom.style.paddingLeft = '10px';
		}

		return dom;
	}

	updateDOM(prevNode: SuggestionNode, dom: HTMLElement): boolean {
		// Only update if suggestionType changes
		if (prevNode.__suggestionType !== this.__suggestionType) {
			dom.classList.remove(`suggestion-${prevNode.__suggestionType}`);
			dom.classList.add(`suggestion-${this.__suggestionType}`);

			// Update styling based on new type
			if (this.__suggestionType === 'add') {
				dom.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
				dom.style.borderLeft = '3px solid #22c55e';
				dom.style.paddingLeft = '10px';
			} else {
				dom.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
				dom.style.borderLeft = '3px solid #ef4444';
				dom.style.paddingLeft = '10px';
			}

			return true;
		}
		return false;
	}

	exportJSON(): SerializedSuggestionNode {
		return {
			...super.exportJSON(),
			type: 'suggestion',
			suggestionType: this.__suggestionType,
		};
	}

	static importJSON(json: SerializedSuggestionNode): SuggestionNode {
		const node = $createSuggestionNode(json.suggestionType);
		return node;
	}

	isInline(): boolean {
		return false; // Suggestions are block-level for simplicity
	}
}

export function $createSuggestionNode(
	suggestionType: SuggestionType
): SuggestionNode {
	return $applyNodeReplacement(new SuggestionNode(suggestionType));
}

export function $isSuggestionNode(
	node: LexicalNode | null | undefined
): node is SuggestionNode {
	return node instanceof SuggestionNode;
}
