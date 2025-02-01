'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { useTheme } from 'next-themes';

export default function Home() {
	return (
		<main className="min-h-screen p-8">
			<div className="absolute top-4 right-4">
				<ModeToggle />
			</div>
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>API Connection Test</CardTitle>
				</CardHeader>
				<CardContent>
					<TestComponent />
				</CardContent>
			</Card>
		</main>
	);
}

function ModeToggle() {
	const { setTheme } = useTheme();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme('light')}>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('dark')}>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme('system')}>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TestComponent() {
	const [response, setResponse] = useState<string>('');
	const [loading, setLoading] = useState(false);

	const testConnection = async () => {
		setLoading(true);
		try {
			// Log the API URL for debugging
			console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);

			// Ensure we have a base URL, fallback to empty string if undefined
			const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
			const url = `${baseUrl}/api/v1/organizations/test`;

			console.log('Making request to:', url);
			const res = await fetch(url);
			const data = await res.json();
			setResponse(JSON.stringify(data, null, 2));
		} catch (error) {
			console.error('API Error:', error);
			setResponse('Error connecting to API');
		}
		setLoading(false);
	};

	return (
		<div className="space-y-4">
			<Button onClick={testConnection} disabled={loading}>
				{loading ? 'Testing...' : 'Test API Connection'}
			</Button>

			{response && (
				<pre className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto">
					{response}
				</pre>
			)}
		</div>
	);
}
