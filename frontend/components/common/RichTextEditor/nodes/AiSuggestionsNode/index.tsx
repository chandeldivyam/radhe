import {
    DecoratorNode,
    LexicalNode,
    NodeKey,
    SerializedLexicalNode,
    Spread,
  } from 'lexical';
  import { ReactNode } from 'react';
  import { AiSuggestionComponent } from './AiSuggestionComponent';
  
  export type SuggestionType = 'add' | 'delete' | 'modify';

  export type SerializedAiSuggestionsNode = Spread<
    {
      type: 'ai-suggestion';
      suggestionType: SuggestionType;
      markdown?: string; // For 'add'
      targetNodeKey?: string; // For 'delete' or 'modify'
      modifiedMarkdown?: string; // For 'modify'
    },
    SerializedLexicalNode
  >;
  
  export class AiSuggestionsNode extends DecoratorNode<ReactNode> {
    __suggestionType: SuggestionType;
    __markdown?: string;
    __targetNodeKey?: string | undefined;
    __modifiedMarkdown?: string;

    constructor(suggestionType: SuggestionType, markdown?: string, targetNodeKey?: string, modifiedMarkdown?: string, key?: NodeKey) {
      super(key);
      this.__suggestionType = suggestionType;
      this.__markdown = markdown;
      this.__targetNodeKey = targetNodeKey;
      this.__modifiedMarkdown = modifiedMarkdown;
    }
  
    static getType(): string {
      return 'ai-suggestion';
    }
  
    static clone(node: AiSuggestionsNode): AiSuggestionsNode {
      return new AiSuggestionsNode(
        node.__suggestionType,
        node.__markdown,
        node.__targetNodeKey,
        node.__modifiedMarkdown,
        node.__key
      );
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
      return <AiSuggestionComponent  
        suggestionType={this.__suggestionType}
        markdown={this.__markdown}
        targetNodeKey={this.__targetNodeKey}
        modifiedMarkdown={this.__modifiedMarkdown}
        nodeKey={this.getKey()}
      />;
    }
  
    exportJSON(): SerializedAiSuggestionsNode {
      return {
        type: 'ai-suggestion',
        suggestionType: this.__suggestionType,
        markdown: this.__markdown,
        targetNodeKey: this.__targetNodeKey,
        modifiedMarkdown: this.__modifiedMarkdown,
        version: 1,
      };
    }
  
    static importJSON(json: SerializedAiSuggestionsNode): AiSuggestionsNode {
      return new AiSuggestionsNode(
        json.suggestionType,
        json.markdown,
        json.targetNodeKey,
        json.modifiedMarkdown
      );
    }
  }
  
  export function $createAiSuggestionsNode(
    suggestionType: SuggestionType,
    markdown?: string,
    targetNodeKey?: string,
    modifiedMarkdown?: string
  ): AiSuggestionsNode {
    return new AiSuggestionsNode(suggestionType, markdown, targetNodeKey, modifiedMarkdown);
  }
  
  export function $isAiSuggestionsNode(
    node: LexicalNode | null | undefined
  ): node is AiSuggestionsNode {
    return node instanceof AiSuggestionsNode;
  }