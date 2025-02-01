import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
	title: string;
	children: React.ReactNode;
}

export function AuthCard({
	title,
	children,
	className,
	...props
}: AuthCardProps) {
	return (
		<Card className={cn('w-full max-w-md mx-auto', className)} {...props}>
			<CardHeader>
				<CardTitle className="text-2xl text-center">{title}</CardTitle>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
