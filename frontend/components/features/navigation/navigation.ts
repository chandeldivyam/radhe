import { Home, Settings, LayoutDashboard, FileText } from 'lucide-react';

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
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];