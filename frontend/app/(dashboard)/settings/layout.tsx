import { Card } from '@/components/ui/card';
import { SettingsTabs } from '@/components/features/settings/tabs';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-6">
      <SettingsTabs />
    </div>
  );
} 