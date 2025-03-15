import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import axios from 'axios';
import { createUnauthorizedResponse } from '@/lib/auth/handleUnauthorized';

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const userId = formData.get('userId') as string;
		const organizationId = formData.get('organizationId') as string;

		if (!file || !userId || !organizationId) {
			return NextResponse.json(
				{ error: 'File, userId and organizationId are required' },
				{ status: 400 }
			);
		}

		// Get access token
		const cookieStore = await cookies();
		const accessToken = cookieStore.get('access_token');

		if (!accessToken) {
			return createUnauthorizedResponse();
		}

		// Generate a unique file key
		const uniqueId = crypto.randomUUID();
		const fileKey = `${organizationId}/${userId}/${uniqueId}`;

		// Get presigned URL from backend
		const presignedResponse = await fetch(
			`${process.env.API_URL}/api/v1/files/presigned-url?file_key=${encodeURIComponent(fileKey)}&content_type=${encodeURIComponent(file.type)}`,
			{
				headers: {
					Authorization: `Bearer ${accessToken.value}`,
				},
			}
		);

		if (!presignedResponse.ok) {
			if (presignedResponse.status === 401) {
				return createUnauthorizedResponse();
			}
			const error = await presignedResponse.json();
			return NextResponse.json(
				{ error: error.detail || 'Failed to get presigned URL' },
				{ status: presignedResponse.status }
			);
		}

		const presignedData = await presignedResponse.json();
		const { presigned_url, public_url } = presignedData;
		let public_url_updated = public_url;

		// In dev environment, we need to modify the public_url as the http://minio:9000 is not accessible from the frontend
		if (process.env.NODE_ENV === 'development') {
			public_url_updated = public_url.replace(
				'http://minio:9000',
				'http://localhost:9000'
			);
		}

		// Read file data
		const buffer = await file.arrayBuffer();

		// Upload file to presigned URL
		await axios.put(presigned_url, buffer, {
			headers: {
				'Content-Type': file.type,
			},
		});

		// Return success with public URL
		return NextResponse.json({
			success: true,
			public_url: public_url_updated,
			file_key: fileKey,
			file_name: file.name,
			file_size: file.size,
			file_type: file.type,
		});
	} catch (error) {
		console.error('Error in server-side file upload:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// Increase payload size limit for file uploads
export const config = {
	api: {
		bodyParser: false,
		responseLimit: '50mb',
	},
};
