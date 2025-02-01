import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DialogDescription, DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { navigationConfig } from '../navigation/navigation';
import './command.css';

export function Command({
	children,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive className="command-wrapper" {...props}>
			{children}
		</CommandPrimitive>
	);
}

interface CommandDialogProps extends DialogProps {
	onClose?: () => void;
}

export function CommandDialog({ ...props }: CommandDialogProps) {
	const router = useRouter();
	const [open, setOpen] = React.useState(false);
	const [loading] = React.useState(false);

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
	}, []);

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false);
		command();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen} {...props}>
			<DialogContent className="p-0">
				<div className="relative">
					{/* Using the new gradient-border utility class */}
					<div className="gradient-border" />

					{/* Main content */}
					<div className="relative rounded-lg bg-background">
						<DialogTitle className="sr-only">
							Command Menu
						</DialogTitle>
						<DialogDescription className="sr-only">
							Global command menu for navigation and search
						</DialogDescription>
						<Command label="Global Command Menu">
							<div className="command-input-wrapper">
								<Search className="h-4 w-4 shrink-0 opacity-50" />
								<CommandPrimitive.Input
									className="command-input"
									placeholder="Type a command or search..."
								/>
							</div>
							<CommandPrimitive.List className="command-list">
								{loading && (
									<CommandPrimitive.Loading className="command-loading">
										Loading...
									</CommandPrimitive.Loading>
								)}
								<CommandPrimitive.Empty className="command-empty">
									No results found.
								</CommandPrimitive.Empty>
								<CommandPrimitive.Group
									heading="Navigation"
									className="command-group"
								>
									{navigationConfig.map((item) => {
										const Icon = item.icon;
										return (
											<CommandPrimitive.Item
												key={item.href}
												onSelect={() =>
													runCommand(() =>
														router.push(item.href)
													)
												}
												className="command-item"
												value={item.title}
												keywords={[
													item.title.toLowerCase(),
													item.href,
												]}
											>
												<Icon className="h-4 w-4" />
												<span>{item.title}</span>
											</CommandPrimitive.Item>
										);
									})}
								</CommandPrimitive.Group>
							</CommandPrimitive.List>
						</Command>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
