import * as z from 'zod';

export const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createOrgSchema = z.object({
	name: z.string().min(2, 'Organization name must be at least 2 characters'),
	admin_email: z.string().email('Invalid email address'),
	admin_password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
			'Password must contain at least one uppercase letter, one lowercase letter, and one number'
		),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateOrgFormData = z.infer<typeof createOrgSchema>;
