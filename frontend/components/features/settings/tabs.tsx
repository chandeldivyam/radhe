import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from './general-settings';
import { MembersSettings } from './members-settings';
import { SETTINGS_TABS } from '@/lib/constants/settings';

export function SettingsTabs() {
  return (
    <Tabs defaultValue={SETTINGS_TABS.GENERAL} className="space-y-4">
      <TabsList>
        <TabsTrigger value={SETTINGS_TABS.GENERAL}>General</TabsTrigger>
        <TabsTrigger value={SETTINGS_TABS.MEMBERS}>Members</TabsTrigger>
      </TabsList>
      <TabsContent value={SETTINGS_TABS.GENERAL} className="space-y-4">
        <GeneralSettings />
      </TabsContent>
      <TabsContent value={SETTINGS_TABS.MEMBERS} className="space-y-4">
        <MembersSettings />
      </TabsContent>
    </Tabs>
  );
} 