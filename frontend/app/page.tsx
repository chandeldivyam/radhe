'use client';
// ./frontend/app/page.tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useState } from 'react';

export default function Home() {
	return (
		<main className="min-h-screen p-8">
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
				<pre className="p-4 bg-slate-100 rounded-lg overflow-auto">
					{response}
				</pre>
			)}
		</div>
	);
}
