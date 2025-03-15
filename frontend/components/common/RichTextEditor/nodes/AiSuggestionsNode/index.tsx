import {
    DecoratorNode,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
  } from 'lexical';
  import { ReactNode } from 'react';
  import { AiSuggestionComponent } from './AiSuggestionComponent';
  
  export type SerializedAiSuggestionsNode = Spread<
    {
      type: 'ai-suggestion';
      markdown: string;
    },
    SerializedLexicalNode
  >;
  
  export class AiSuggestionsNode extends DecoratorNode<ReactNode> {
    __markdown: string;
  
    constructor(markdown: string, key?: NodeKey) {
      super(key);
      this.__markdown = markdown;
    }
  
    static getType(): string {
      return 'ai-suggestion';
    }
  
    static clone(node: AiSuggestionsNode): AiSuggestionsNode {
      return new AiSuggestionsNode(node.__markdown, node.__key);
    }
  
    createDOM(): HTMLElement {
      const dom = document.createElement('div');
      dom.classList.add('ai-suggestion-wrapper');
      return dom;
    }
  
    updateDOM(): boolean {
      return false;
    }
  
    decorate(): ReactNode {
      return <AiSuggestionComponent markdown={this.__markdown} nodeKey={this.getKey()} />;
    }
  
    exportJSON(): SerializedAiSuggestionsNode {
      return {
        type: 'ai-suggestion',
        markdown: this.__markdown,
        version: 1,
      };
    }
  
    static importJSON(json: SerializedAiSuggestionsNode): AiSuggestionsNode {
      return new AiSuggestionsNode(json.markdown);
    }
  }
  
  export function $createAiSuggestionsNode(markdown: string): AiSuggestionsNode {
    return new AiSuggestionsNode(markdown);
  }
  
  export function $isAiSuggestionsNode(
    node: LexicalNode | null | undefined
  ): node is AiSuggestionsNode {
    return node instanceof AiSuggestionsNode;
  }