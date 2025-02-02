import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettings } from './general-settings';
import { MembersSettings } from './members-settings';

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <GeneralSettings />
      </TabsContent>
      <TabsContent value="members" className="space-y-4">
        <MembersSettings />
      </TabsContent>
    </Tabs>
  );
} 