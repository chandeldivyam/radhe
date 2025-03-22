'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

// Sample message data
const sampleMessages = [
	{
		id: 1,
		sender: 'Radhe',
		content: 'Hello! How can I help you today?',
		timestamp: '10:30 AM',
		isUser: false,
	},
	{
		id: 2,
		sender: 'You',
		content: 'I need help with my project.',
		timestamp: '10:31 AM',
		isUser: true,
	},
	{
		id: 3,
		sender: 'Radhe',
		content:
			"Sure, I'd be happy to help. What kind of project are you working on?",
		timestamp: '10:32 AM',
		isUser: false,
	},
];

export function ChatPanel() {
	return (
		<div className="border-l bg-background flex flex-col h-full transition-all duration-300 ease-in-out">
			{/* Chat Messages */}
			<div className="flex-1 overflow-auto p-4 space-y-4">
				{sampleMessages.map((message) => (
					<div
						key={message.id}
						className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'}`}
					>
						<div className="flex items-center gap-2 mb-1">
							<span className="text-xs font-medium">
								{message.sender}
							</span>
							<span className="text-xs text-muted-foreground">
								{message.timestamp}
							</span>
						</div>
						<div
							className={`max-w-[80%] rounded-lg p-3 ${
								message.isUser
									? 'bg-primary text-primary-foreground'
									: 'bg-muted'
							}`}
						>
							{message.content}
						</div>
					</div>
				))}
			</div>

			{/* Disabled Chat Input */}
			<div className="border-t p-4">
				<div className="flex gap-2">
					<Input placeholder="Message" disabled className="flex-1" />
					<Button
						size="icon"
						disabled
						title="Send message (disabled)"
					>
						<Send />
					</Button>
				</div>
				<p className="text-xs text-muted-foreground mt-2 text-center">
					Chat functionality is currently disabled
				</p>
			</div>
		</div>
	);
}
