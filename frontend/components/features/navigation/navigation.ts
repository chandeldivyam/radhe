import { Home, Settings, FileText, Activity } from 'lucide-react';

export interface NavItem {
	title: string;
	href: string;
	icon: typeof Home;
	disabled?: boolean;
}

export const navigationConfig: NavItem[] = [
	{
		title: 'Home',
		href: '/home',
		icon: Home,
	},
	{
		title: 'Notes',
		href: '/notes',
		icon: FileText,
	},
	{
		title: 'Tasks',
		href: '/tasks',
		icon: Activity,
	},
	{
		title: 'Settings',
		href: '/settings',
		icon: Settings,
	},
];
