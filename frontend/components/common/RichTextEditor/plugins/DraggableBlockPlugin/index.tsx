/**
  TODO - Edge case where I select a block, then shift select a block above it and then move. It changes the internal order.
  TODO - When I have something selected and I move some unselected block, the image which we generate is not correct.
 */
import './styles.css';
import { Point, Rectangle, isHTMLElement, calculateZoomLevel } from "./utils";
import type { JSX } from "react";
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {eventFiles} from '@lexical/rich-text';
import { mergeRegister } from '@lexical/utils';
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalEditor,
  LexicalNode,
} from 'lexical';
import {
  DragEvent as ReactDragEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import {createPortal} from 'react-dom';


const SPACE = 4;
const TARGET_LINE_HALF_HEIGHT = 2;
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';
const TEXT_BOX_HORIZONTAL_PADDING = 28;

const Downward = 1;
const Upward = -1;
const Indeterminate = 0;

let prevIndex = Infinity;

function getCurrentIndex(keysLength: number): number {
  if (keysLength === 0) {
    return Infinity;
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex;
  }

  return Math.floor(keysLength / 2);
}

function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}

function getCollapsedMargins(elem: HTMLElement): {
  marginTop: number;
  marginBottom: number;
} {
  const getMargin = (
    element: Element | null,
    margin: 'marginTop' | 'marginBottom',
  ): number =>
    element ? parseFloat(window.getComputedStyle(element)[margin]) : 0;

  const {marginTop, marginBottom} = window.getComputedStyle(elem);
  const prevElemSiblingMarginBottom = getMargin(
    elem.previousElementSibling,
    'marginBottom',
  );
  const nextElemSiblingMarginTop = getMargin(
    elem.nextElementSibling,
    'marginTop',
  );
  const collapsedTopMargin = Math.max(
    parseFloat(marginTop),
    prevElemSiblingMarginBottom,
  );
  const collapsedBottomMargin = Math.max(
    parseFloat(marginBottom),
    nextElemSiblingMarginTop,
  );

  return {marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin};
}

function getBlockElement(
  anchorElem: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false,
): HTMLElement | null {
  const anchorElementRect = anchorElem.getBoundingClientRect();
  const topLevelNodeKeys = getTopLevelNodeKeys(editor);

  let blockElem: HTMLElement | null = null;

  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0]),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1]),
      ];

      const [firstNodeRect, lastNodeRect] = [
        firstNode != null ? firstNode.getBoundingClientRect() : undefined,
        lastNode != null ? lastNode.getBoundingClientRect() : undefined,
      ];

      if (firstNodeRect && lastNodeRect) {
        const firstNodeZoom = calculateZoomLevel(firstNode);
        const lastNodeZoom = calculateZoomLevel(lastNode);
        if (event.y / firstNodeZoom < firstNodeRect.top) {
          blockElem = firstNode;
        } else if (event.y / lastNodeZoom > lastNodeRect.bottom) {
          blockElem = lastNode;
        }

        if (blockElem) {
          return;
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length);
    let direction = Indeterminate;

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index];
      const elem = editor.getElementByKey(key);
      if (elem === null) {
        break;
      }
      const zoom = calculateZoomLevel(elem);
      const point = new Point(event.x / zoom, event.y / zoom);
      const domRect = Rectangle.fromDOM(elem);
      const {marginTop, marginBottom} = getCollapsedMargins(elem);
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop,
      });

      const {
        result,
        reason: {isOnTopSide, isOnBottomSide},
      } = rect.contains(point);

      if (result) {
        blockElem = elem;
        prevIndex = index;
        break;
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward;
        } else if (isOnBottomSide) {
          direction = Downward;
        } else {
          // stop search block element
          direction = Infinity;
        }
      }

      index += direction;
    }
  });

  return blockElem;
}

function setMenuPosition(
  targetElem: HTMLElement | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
) {
  if (!targetElem) {
    floatingElem.style.opacity = '0';
    floatingElem.style.transform = 'translate(-10000px, -10000px)';
    return;
  }

  const targetRect = targetElem.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElem);
  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();

  // top left
  let targetCalculateHeight: number = parseInt(targetStyle.lineHeight, 10);
  if (isNaN(targetCalculateHeight)) {
    // middle
    targetCalculateHeight = targetRect.bottom - targetRect.top;
  }
  const top =
    targetRect.top +
    (targetCalculateHeight - floatingElemRect.height) / 2 -
    anchorElementRect.top;

  const left = SPACE;

  floatingElem.style.opacity = '1';
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

// Helper function to create drag image for multiple blocks
function createDragImage(
  editor: LexicalEditor,
  blockElem: HTMLElement,
  selectedBlocks: SelectedBlocks
): HTMLElement {
  // Create container for drag image
  const dragImageContainer = document.createElement('div');
  dragImageContainer.style.position = 'absolute';
  dragImageContainer.style.left = '-9999px';
  dragImageContainer.style.width = `${blockElem.offsetWidth}px`;
  
  console.log('Creating drag image for blocks:', Array.from(selectedBlocks));

  editor.update(() => {
    // If no multiple selection, just clone the dragged element
    if (selectedBlocks.size <= 1) {
      console.log('Single block drag image');
      const clone = blockElem.cloneNode(true) as HTMLElement;
      clone.style.transform = 'translateZ(0)';
      dragImageContainer.appendChild(clone);
      return;
    }

    // For multiple blocks, create a composite drag image
    Array.from(selectedBlocks).forEach((key, index) => {
      const element = editor.getElementByKey(key);
      if (element) {
        console.log('Adding block to drag image:', key);
        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.transform = 'translateZ(0)';
        // Add some styling to show stacked effect
        clone.style.position = 'relative';
        clone.style.top = `${index * 2}px`;
        clone.style.left = `${index * 2}px`;
        clone.style.border = '1px solid hsl(var(--border))';
        clone.style.backgroundColor = 'hsl(var(--background))';
        dragImageContainer.appendChild(clone);
      }
    });
  });

  // Add container to document temporarily
  document.body.appendChild(dragImageContainer);
  return dragImageContainer;
}

// Modify the existing setDragImage function
function setDragImage(
  dataTransfer: DataTransfer,
  draggableBlockElem: HTMLElement,
  editor: LexicalEditor,
  selectedBlocks: SelectedBlocks
) {
  console.log('Setting drag image');
  
  // Create custom drag image
  const dragImageContainer = createDragImage(editor, draggableBlockElem, selectedBlocks);
  
  // Set as drag image
  dataTransfer.setDragImage(
    dragImageContainer,
    0,
    0
  );

  // Clean up the temporary element after a short delay
  setTimeout(() => {
    document.body.removeChild(dragImageContainer);
  });
}

function setTargetLine(
  targetLineElem: HTMLElement,
  targetBlockElem: HTMLElement,
  mouseY: number,
  anchorElem: HTMLElement,
) {
  const {top: targetBlockElemTop, height: targetBlockElemHeight} =
    targetBlockElem.getBoundingClientRect();
  const {top: anchorTop, width: anchorWidth} =
    anchorElem.getBoundingClientRect();
  const {marginTop, marginBottom} = getCollapsedMargins(targetBlockElem);
  let lineTop = targetBlockElemTop;
  if (mouseY >= targetBlockElemTop) {
    lineTop += targetBlockElemHeight + marginBottom / 2;
  } else {
    lineTop -= marginTop / 2;
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT;
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE;

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`;
  targetLineElem.style.width = `${
    anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2
  }px`;
  targetLineElem.style.opacity = '.4';
}

function hideTargetLine(targetLineElem: HTMLElement | null) {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0';
    targetLineElem.style.transform = 'translate(-10000px, -10000px)';
  }
}

// Add a new type for selected blocks
type SelectedBlocks = Set<string>;

// First, let's create a type for our drag data
type DragData = {
  sourceKeys: string[];  // Array of block keys being dragged
  primaryKey: string;    // The block that was directly dragged
};

function validateDropData(data: unknown): DragData | null {
  console.log('Validating drop data:', data);
  
  try {
    // First parse if it's a string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Type guard checks
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.sourceKeys) ||
      typeof parsed.primaryKey !== 'string' ||
      parsed.sourceKeys.length === 0 ||
      !parsed.sourceKeys.includes(parsed.primaryKey)
    ) {
      console.log('Drop data validation failed');
      return null;
    }

    // Verify all keys are strings
    if (!parsed.sourceKeys.every((key: unknown) => typeof key === 'string')) {
      console.log('Invalid key type in sourceKeys');
      return null;
    }

    console.log('Drop data validated successfully:', parsed);
    return parsed as DragData;
  } catch (error) {
    console.error('Error parsing drop data:', error);
    return null;
  }
}

// Add new types for drop position
type DropPosition = {
  targetNode: LexicalNode;
  isBeforeTarget: boolean;  // true if dropping above, false if dropping below
  isValidDrop: boolean;
};

function moveBlocks(
  sourceKeys: string[],
  dropPosition: DropPosition,
  editor: LexicalEditor
): void {
  editor.update(() => {
    const targetNode = dropPosition.targetNode;

    // The way we have strcutred the code, we will always have isBeforeTarget as false
    // Get all source nodes and sort them by position (top to bottom)
    const nodesToMove = sourceKeys
      .map(key => $getNodeByKey(key))
      .filter((node): node is LexicalNode => node !== null);

    if (nodesToMove.length === 0) return;

    // We need to reverse the nodesToMove array because we are always dropping after the target node and the list is ordered top to bottom
    const reversedNodesToMove = nodesToMove.reverse();

    reversedNodesToMove.forEach(sourceNode => {
      targetNode.insertAfter(sourceNode);
    });
  });
}

function calculateDropPosition(
  event: DragEvent,
  targetBlockElem: HTMLElement,
  targetNode: LexicalNode,
  dragData: DragData
): DropPosition {
  const targetRect = targetBlockElem.getBoundingClientRect();
  const mouseY = event.clientY;
  
  // Determine if we're dropping before or after the target
  const isBeforeTarget = mouseY < (targetRect.top + targetRect.height / 2);

  // Check if the target is one of the nodes being dragged
  const isValidDrop = !dragData.sourceKeys.includes(targetNode.getKey());

  return {
    targetNode,
    isBeforeTarget,
    isValidDrop
  };
}

function useDraggableBlockMenu(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  menuRef: React.RefObject<HTMLElement>,
  targetLineRef: React.RefObject<HTMLElement>,
  isEditable: boolean,
  menuComponent: ReactNode,
  targetLineComponent: ReactNode,
  isOnMenu: (element: HTMLElement) => boolean,
  selectedBlocks: SelectedBlocks,
  onBlockSelection: (event: MouseEvent, nodeKey: string) => void,
  onClearSelection: () => void,
): JSX.Element {
  const scrollerElem = anchorElem.parentElement;
  const isDraggingBlockRef = useRef<boolean>(false);
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null);

  // Modify the click handler
  useEffect(() => {
    function onContainerClick(event: MouseEvent) {
      // If not clicking on the menu icon, clear selection
      if (!isOnMenu(event.target as HTMLElement)) {
        onClearSelection();
        return;
      }
      
      // Only handle selection if clicking on menu icon and using modifier keys
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        const blockElem = getBlockElement(anchorElem, editor, event);
        
        if (blockElem) {
          event.preventDefault();
          editor.update(() => {
            const node = $getNearestNodeFromDOMNode(blockElem);
            if (node) {
              onBlockSelection(event, node.getKey());
            }
          });
        }
      }
    }

    scrollerElem?.addEventListener('click', onContainerClick);
    return () => {
      scrollerElem?.removeEventListener('click', onContainerClick);
    };
  }, [editor, anchorElem, onBlockSelection, onClearSelection, scrollerElem, isOnMenu]);

  // Modified mousemove effect - removed click listener
  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      const target = event.target;
      if (!isHTMLElement(target)) {
        setDraggableBlockElem(null);
        return;
      }

      if (isOnMenu(target as HTMLElement)) {
        return;
      }

      const _draggableBlockElem = getBlockElement(anchorElem, editor, event);
      setDraggableBlockElem(_draggableBlockElem);
    }

    function onMouseLeave() {
      setDraggableBlockElem(null);
    }

    if (scrollerElem != null) {
      scrollerElem.addEventListener('mousemove', onMouseMove);
      scrollerElem.addEventListener('mouseleave', onMouseLeave);
    }

    return () => {
      if (scrollerElem != null) {
        scrollerElem.removeEventListener('mousemove', onMouseMove);
        scrollerElem.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, [scrollerElem, anchorElem, editor, isOnMenu]);

  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem);
    }
  }, [anchorElem, draggableBlockElem, menuRef]);

  useEffect(() => {
    function onDragover(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        return false;
      }
      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        return false;
      }
      const {pageY, target} = event;
      if (!isHTMLElement(target)) {
        return false;
      }
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      const targetLineElem = targetLineRef.current;
      if (targetBlockElem === null || targetLineElem === null) {
        return false;
      }
      setTargetLine(
        targetLineElem,
        targetBlockElem,
        pageY / calculateZoomLevel(target),
        anchorElem,
      );
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault();
      return true;
    }

    function $onDrop(event: DragEvent): boolean {
      if (!isDraggingBlockRef.current) {
        console.log('Not in dragging state');
        return false;
      }

      const [isFileTransfer] = eventFiles(event);
      if (isFileTransfer) {
        console.log('File transfer detected, ignoring');
        return false;
      }

      const { target, dataTransfer } = event;
      if (!dataTransfer || !isHTMLElement(target)) {
        console.log('Invalid drop event');
        return false;
      }

      // Get and validate the drag data
      const rawDragData = dataTransfer.getData(DRAG_DATA_FORMAT);
      const dragData = validateDropData(rawDragData);
      
      if (!dragData) {
        console.log('Invalid drag data');
        return false;
      }

      // Get the target block element
      const targetBlockElem = getBlockElement(anchorElem, editor, event, true);
      if (!targetBlockElem) {
        console.log('No valid target block element');
        return false;
      }

      // Get the target node
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem);
      if (!targetNode) {
        console.log('No valid target node');
        return false;
      }

      // Calculate drop position
      const dropPosition = calculateDropPosition(
        event,
        targetBlockElem,
        targetNode,
        dragData
      );

      if (!dropPosition.isValidDrop) {
        console.log('Drop position invalid');
        return false;
      }

      // Move the blocks
      moveBlocks(dragData.sourceKeys, dropPosition, editor);
      
      // Prevent default to avoid any unwanted browser handling
      event.preventDefault();
      
      return true;
    }

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event);
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return $onDrop(event);
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [anchorElem, editor, targetLineRef]);

  // Add effect to update visual selection
  useEffect(() => {
    editor.update(() => {
      const blocks = getTopLevelNodeKeys(editor);
      blocks.forEach(key => {
        const element = editor.getElementByKey(key);
        if (element) {
          if (selectedBlocks.has(key)) {
            element.classList.add('selected-block');
          } else {
            element.classList.remove('selected-block');
          }
        }
      });
    });
  }, [selectedBlocks, editor]);

  function onDragStart(event: ReactDragEvent<HTMLDivElement>): void {
    const dataTransfer = event.dataTransfer;
    if (!dataTransfer || !draggableBlockElem) {
      console.log('Drag start failed: No dataTransfer or draggableBlockElem');
      return;
    }

    // Use updated setDragImage with multiple blocks
    setDragImage(dataTransfer, draggableBlockElem, editor, selectedBlocks);

    // Prepare drag data
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem);
      if (!node) {
        console.log('No node found for draggable element');
        return;
      }

      const primaryKey = node.getKey();
      console.log('Starting drag operation:', {
        draggedNodeKey: primaryKey,
        draggedNodeType: node.getType(),
        selectedBlocksCount: selectedBlocks.size
      });

      // If we have selected blocks, use them; otherwise, just use the dragged block
      const sourceKeys = selectedBlocks.size > 0 && selectedBlocks.has(primaryKey)
        ? Array.from(selectedBlocks)
        : [primaryKey];

      const dragData: DragData = {
        sourceKeys,
        primaryKey
      };

      console.log('Setting drag data:', dragData);

      dataTransfer.setData(
        DRAG_DATA_FORMAT, 
        JSON.stringify(dragData)
      );

      isDraggingBlockRef.current = true;
    });
  }

  function onDragEnd(): void {
    console.log('Drag ended');
    isDraggingBlockRef.current = false;
    hideTargetLine(targetLineRef.current);
  }
  return createPortal(
    <>
      <div draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {isEditable && menuComponent}
      </div>
      {targetLineComponent}
    </>,
    anchorElem,
  );
}

export function DraggableBlockPlugin_EXPERIMENTAL({
  anchorElem = document.body,
  menuRef,
  targetLineRef,
  menuComponent,
  targetLineComponent,
  isOnMenu,
  selectedBlocks,
  onBlockSelection,
  onClearSelection,
}: {
  anchorElem?: HTMLElement;
  menuRef: React.RefObject<HTMLElement>;
  targetLineRef: React.RefObject<HTMLElement>;
  menuComponent: ReactNode;
  targetLineComponent: ReactNode;
  isOnMenu: (element: HTMLElement) => boolean;
  selectedBlocks: SelectedBlocks;
  onBlockSelection: (event: MouseEvent, nodeKey: string) => void;
  onClearSelection: () => void;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  return useDraggableBlockMenu(
    editor,
    anchorElem,
    menuRef,
    targetLineRef,
    editor._editable,
    menuComponent,
    targetLineComponent,
    isOnMenu,
    selectedBlocks,
    onBlockSelection,
    onClearSelection
  );
}

function isOnMenu(element: HTMLElement): boolean {
	return !!element.closest('.draggable-block-menu');
}

function DraggableBlockPlugin({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [editor] = useLexicalComposerContext();
  const [selectedBlocks, setSelectedBlocks] = useState<SelectedBlocks>(new Set());
  const [lastSelectedBlock, setLastSelectedBlock] = useState<string | null>(null);

  const handleClearSelection = useCallback(() => {
    setSelectedBlocks(new Set());
    setLastSelectedBlock(null);
  }, []);

  const handleBlockSelection = useCallback((event: MouseEvent, nodeKey: string) => {
    if (event.shiftKey) {
      if (selectedBlocks.size === 0 || !lastSelectedBlock) {
        setSelectedBlocks(new Set([nodeKey]));
        setLastSelectedBlock(nodeKey);
        return;
      }

      event.preventDefault();
      
      const orderedKeys = getTopLevelNodeKeys(editor);
      const startIdx = orderedKeys.indexOf(lastSelectedBlock);
      const endIdx = orderedKeys.indexOf(nodeKey);
      
      if (startIdx === -1 || endIdx === -1) return;
      
      const [rangeStart, rangeEnd] = startIdx < endIdx 
        ? [startIdx, endIdx] 
        : [endIdx, startIdx];
      
      setSelectedBlocks(prev => {
        const newSelection = new Set(prev);
        for (let i = rangeStart; i <= rangeEnd; i++) {
          newSelection.add(orderedKeys[i]);
        }
        return newSelection;
      });
      
    } else if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      setSelectedBlocks(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(nodeKey)) {
          newSelection.delete(nodeKey);
        } else {
          newSelection.add(nodeKey);
        }
        return newSelection;
      });
      setLastSelectedBlock(nodeKey);
    } else {
      setSelectedBlocks(new Set([nodeKey]));
      setLastSelectedBlock(nodeKey);
    }
  }, [editor, lastSelectedBlock, selectedBlocks]);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      // @ts-ignore
      menuRef={menuRef}
      // @ts-ignore
      targetLineRef={targetLineRef}
      selectedBlocks={selectedBlocks}
      onBlockSelection={handleBlockSelection}
      onClearSelection={handleClearSelection}
      menuComponent={
        <div ref={menuRef} className="draggable-block-menu">
          <div className="icon" />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
}

export default DraggableBlockPlugin;
