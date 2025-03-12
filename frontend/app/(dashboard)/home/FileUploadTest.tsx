'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';

export default function FileUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPublicUrl(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id || !user?.organization_id) {
      setError('Please select a file and ensure you are logged in');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('organizationId', user.organization_id);

      // Set up progress tracking with fetch
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percentComplete);
        }
      };
      
      // Use a Promise to handle the XHR request
      interface UploadResponse {
        public_url: string;
        [key: string]: unknown;
      }
      
      const uploadPromise = new Promise<UploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText) as UploadResponse;
              resolve(response);
            } catch (e) {
              console.log('Error parsing JSON response:', e);
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.onabort = () => reject(new Error('Upload aborted'));
      });

      // Start the request
      xhr.open('POST', '/api/file/presignedUrl');
      xhr.send(formData);
      
      // Wait for the response
      const response = await uploadPromise;
      
      // Set the public URL on success
      setPublicUrl(response.public_url);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPublicUrl(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = file?.type.startsWith('image/');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>File Upload Test</CardTitle>
        <CardDescription>Upload a file and get its public URL</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
          {file && (
            <p className="text-sm text-muted-foreground">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-center">{uploadProgress}% uploaded</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {error}
          </div>
        )}

        {publicUrl && (
          <div className="space-y-3">
            <div className="p-3 bg-primary/10 text-primary rounded-md break-all">
              <p className="text-sm font-medium">Public URL:</p>
              <a 
                href={publicUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm hover:underline"
              >
                {publicUrl}
              </a>
            </div>
            
            {isImage && (
              <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                <Image
                  src={publicUrl}
                  alt="Uploaded image"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={resetUpload}
          disabled={isUploading || (!file && !publicUrl)}
        >
          Reset
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : 'Upload File'}
        </Button>
      </CardFooter>
    </Card>
  );
} 