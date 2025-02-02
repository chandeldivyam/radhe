'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { AddMemberDialog } from '@/components/features/settings/add-member-dialog';
import { useMembers } from '@/lib/hooks/useMembers';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { DeleteMemberDialog } from '@/components/features/settings/delete-member-dialog';
import type { Member } from '@/types/member';
export function MembersSettings() {
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const { user } = useAuth();
	const { members, isLoading, deleteMember, addMember } = useMembers();
	const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Organization Members</h3>
				<Button onClick={() => setIsAddDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Member
				</Button>
			</div>

			<div className="border rounded-lg">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Joined</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={3}
									className="text-center h-24"
								>
									Loading...
								</TableCell>
							</TableRow>
						) : (
							members?.map((member) => (
								<TableRow key={member.id}>
									<TableCell>{member.email}</TableCell>
									<TableCell>
										{member.created_at &&
											format(
												new Date(member.created_at),
												'MMM d, yyyy'
											)}
									</TableCell>
									<TableCell>
										{member.id !== user?.id && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													setMemberToDelete(member)
												}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			<DeleteMemberDialog
				open={!!memberToDelete}
				onOpenChange={(open) => !open && setMemberToDelete(null)}
				onConfirm={() => {
					if (memberToDelete) {
						deleteMember(memberToDelete.id);
						setMemberToDelete(null);
					}
				}}
				memberEmail={memberToDelete?.email || ''}
			/>

			<AddMemberDialog
				open={isAddDialogOpen}
				onOpenChange={setIsAddDialogOpen}
				onAdd={addMember}
			/>
		</div>
	);
} 