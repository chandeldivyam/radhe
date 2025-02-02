'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { GeneralSettings } from '@/components/features/settings/general-settings';
import { MembersSettings } from '@/components/features/settings/members-settings';

export default function SettingsPage() {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="general" className="space-y-4">
				<TabsList>
					<TabsTrigger value="general">General</TabsTrigger>
					<TabsTrigger value="members">Members</TabsTrigger>
				</TabsList>
				<TabsContent value="general">
					<Card className="p-6">
						<GeneralSettings />
					</Card>
				</TabsContent>
				<TabsContent value="members">
					<Card className="p-6">
						<MembersSettings />
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
