import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { DRAG_DROP_PASTE } from '@lexical/rich-text';
import { isMimeType, mediaFileReader } from '@lexical/utils';
import { COMMAND_PRIORITY_LOW } from 'lexical';
import { useEffect } from 'react';
import { INSERT_IMAGE_COMMAND } from '../ImagePlugin';

const ACCEPTABLE_IMAGE_TYPES = [
	'image/',
	'image/heic',
	'image/heif',
	'image/gif',
	'image/webp',
	'image/jpeg',
	'image/png',
];

export default function DragDropPlugin(): null {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			DRAG_DROP_PASTE,
			(files) => {
				(async () => {
					const filesResult = await mediaFileReader(
						files,
						[ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
					);

					for (const { file } of filesResult) {
						if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
							// Use your existing INSERT_IMAGE_COMMAND with the file
							editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
								file,
							});
						}
					}
				})();
				return true;
			},
			COMMAND_PRIORITY_LOW
		);
	}, [editor]);

	return null;
}
