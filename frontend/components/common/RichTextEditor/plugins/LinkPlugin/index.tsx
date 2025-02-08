'use client';

import React from 'react';
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { validateUrl } from './utils';
import { type JSX } from 'react';

export default function LinkPlugin(): JSX.Element {
	return (
		<LexicalLinkPlugin
			validateUrl={validateUrl}
			// this is the critical part for opening a new tab
			// and preventing security issues
			attributes={{
				target: '_blank',
				rel: 'noopener noreferrer',
			}}
		/>
	);
}
