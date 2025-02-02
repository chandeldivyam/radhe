'use client';

import { useAuth } from '@/lib/auth/authContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export function GeneralSettings() {
  const { user } = useAuth();

  return (
    <Card>
        <CardHeader>
          <CardTitle>Organization Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Organization ID</Label>
            <p className="text-sm text-muted-foreground">{user?.organization_id}</p>
          </div>
          <div className="space-y-1">
            <Label>Your Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>
  );
} 