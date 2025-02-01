export interface User {
	id: string;
	email: string;
	organization_id: string;
}

export interface AuthTokens {
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface CreateOrganizationData {
	name: string;
	admin_email: string;
	admin_password: string;
}

export interface AuthState {
	user: UserResponse | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export interface Organization {
	id: string;
	name: string;
	created_at?: string;
	updated_at?: string;
	is_active: boolean;
}

export interface CreateOrganizationResponse extends Organization {
	id: string;
	access_token: string;
	refresh_token: string;
	token_type: string;
}

export interface UserResponse {
	id: string;
	email: string;
	organization_id: string;
	created_at?: string;
	updated_at?: string;
}
