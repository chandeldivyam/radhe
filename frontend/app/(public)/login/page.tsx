'use client';

import { useState } from 'react';
import { AuthCard } from '@/components/features/auth/authCard';
import { LoginForm } from '@/components/features/auth/loginForm';
import { CreateOrgForm } from '@/components/features/auth/createOrgForm';
import { Button } from '@/components/ui/button';

export default function Login() {
	const [isLogin, setIsLogin] = useState(true);

	return (
		<main className="min-h-screen flex flex-col items-center justify-center p-4 relative">
			<div className="w-full max-w-md space-y-6">
				<AuthCard title={isLogin ? 'Sign In' : 'Create Organization'}>
					{isLogin ? <LoginForm /> : <CreateOrgForm />}
				</AuthCard>

				<div className="text-center">
					<Button
						variant="link"
						onClick={() => setIsLogin(!isLogin)}
						className="text-muted-foreground hover:text-primary"
					>
						{isLogin
							? "Don't have an organization? Create one"
							: 'Already have an account? Sign in'}
					</Button>
				</div>
			</div>
		</main>
	);
}
