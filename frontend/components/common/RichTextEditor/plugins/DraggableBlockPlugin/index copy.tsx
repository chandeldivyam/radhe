// src/components/RichTextEditor/plugins/DraggableBlockPlugin/index.tsx
'use client';

import { useRef } from 'react';
import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import './styles.css';
import type { JSX } from 'react';
const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
	return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export default function DraggableBlockPlugin({
	anchorElem = document.body,
}: {
	anchorElem?: HTMLElement;
}): JSX.Element {
	const menuRef = useRef<HTMLDivElement>(null);
	const targetLineRef = useRef<HTMLDivElement>(null);

	return (
		<DraggableBlockPlugin_EXPERIMENTAL
			anchorElem={anchorElem}
      // @ts-ignore
			menuRef={menuRef}
      // @ts-ignore
			targetLineRef={targetLineRef}
			menuComponent={
				<div ref={menuRef} className={DRAGGABLE_BLOCK_MENU_CLASSNAME}>
					<div className="icon" />
				</div>
			}
			targetLineComponent={
				<div
					ref={targetLineRef}
					className="draggable-block-target-line"
				>
        </div>
			}
			isOnMenu={isOnMenu}
		/>
	);
}
