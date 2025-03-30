// ./frontend/app/(dashboard)/tasks/layout.tsx
import { ReactNode } from 'react';

export default function TasksLayout({ children }: { children: ReactNode }) {
	return <div className="h-full">{children}</div>;
}
