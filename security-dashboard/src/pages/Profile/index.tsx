import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Activity, LogIn, RefreshCw } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Lock, 
  Shield, 
  Camera, 
  Key, 
  BadgeCheck, 
  CircleDollarSign,
  HardDrive,
  Mail
} from 'lucide-react';
import pb from '../../services/Pb-getFlowService';
import { RecordModel } from 'pocketbase';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  name: string;
  description: string;
  avatar: string | null;
  custom_collections_count: number;
  emailVisibility: boolean;
}

const mapRecordToProfile = (record: RecordModel): UserProfile => ({
  id: record.id || '',
  username: record.username || '',
  email: record.email || '',
  name: record.name || '',
  description: record.description || '',
  avatar: record.avatar || null,
  custom_collections_count: Number(record.custom_collections_count || 0),
  emailVisibility: Boolean(record.emailVisibility),
});

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const currentUser = pb.authStore.model;
        if (currentUser) {
          const userData = await pb.collection('users').getOne(currentUser.id);
          setProfile(mapRecordToProfile(userData));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      
      const updateData = {
        username: profile.username,
        email: profile.email,
        name: profile.name,
        description: profile.description,
        emailVisibility: profile.emailVisibility,
        custom_collections_count: profile.custom_collections_count,
      };

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      await pb.collection('users').update(profile.id, formData);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: "Error",
        description: "User profile not found",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await pb.collection('users').update(profile.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      });

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile || !e.target.files || !e.target.files[0]) return;

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('avatar', e.target.files[0]);

      await pb.collection('users').update(profile.id, formData);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });

      // Refresh profile to get new avatar
      const userData = await pb.collection('users').getOne(profile.id);
      setProfile(mapRecordToProfile(userData));
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast({
        title: "Error",
        description: "Failed to update avatar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load profile data. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const memberSince = new Date().getFullYear(); // Bu gerçek üyelik tarihiyle değiştirilmeli

  return (
    <div className="flex justify-center py-6">
    <div className="container max-w-5xl border border-gray-200 shadow-lg rounded-lg p-6 space-y-8 bg-white">
      {/* Hero Section */}
      <Card className="border-none bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="flex items-center space-x-8">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage 
                src={profile.avatar ? `http://127.0.0.1:8090/api/files/users/${profile.id}/${profile.avatar}` : undefined} 
                alt={profile.name || 'User Avatar'} 
              />
              <AvatarFallback className="text-4xl">
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <Label htmlFor="avatar" className="cursor-pointer">
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute bottom-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </Label>
            <Input 
              id="avatar" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground flex items-center">
              <User className="w-4 h-4 mr-2" />
              {profile.username}
            </p>
            <p className="text-muted-foreground flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              {profile.email}
            </p>
            <p className="text-muted-foreground flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Member since {memberSince}
            </p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start border-b pb-px mb-4">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="license" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            License & Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile information here.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={profile.description}
                      onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Change Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="license">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BadgeCheck className="w-5 h-5 mr-2 text-primary" />
                  License Status
                </CardTitle>
                <CardDescription>Your current license information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Plan</span>
                  <span className="text-primary font-semibold">Professional</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status</span>
                  <span className="text-green-500 flex items-center">
                    <BadgeCheck className="w-4 h-4 mr-1" />
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valid Until</span>
                  <span>Dec 31, 2024</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HardDrive className="w-5 h-5 mr-2 text-primary" />
                  Usage Limits
                </CardTitle>
                <CardDescription>Your current usage statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projects</span>
                    <span className="text-muted-foreground">8 / 10</span>
                  </div>
                  <Progress value={80} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Calls</span>
                    <span className="text-muted-foreground">8,546 / 10,000</span>
                  </div>
                  <Progress value={85.46} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Team Members</span>
                    <span className="text-muted-foreground">3 / 5</span>
                  </div>
                  <Progress value={60} />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                  <CircleDollarSign className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Contact support for custom enterprise plans
                </p>
              </CardFooter>
            </Card>

            {/* Activity Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your account activity and usage history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-2 rounded-full",
                          activity.type === 'login' && "bg-blue-100 text-blue-600",
                          activity.type === 'update' && "bg-green-100 text-green-600",
                          activity.type === 'api' && "bg-purple-100 text-purple-600"
                        )}>
                          {activity.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
};

// Recent activity data
const recentActivity = [
  {
    type: 'login',
    description: 'Successful login from macOS device',
    time: '2 minutes ago',
    icon: <LogIn className="w-4 h-4" />,
  },
  {
    type: 'update',
    description: 'Profile information updated',
    time: '1 hour ago',
    icon: <RefreshCw className="w-4 h-4" />,
  },
  {
    type: 'api',
    description: 'API key generated for project "Security Dashboard"',
    time: '3 hours ago',
    icon: <Key className="w-4 h-4" />,
  },
  {
    type: 'update',
    description: 'Password changed successfully',
    time: '1 day ago',
    icon: <Lock className="w-4 h-4" />,
  },
];

export default ProfilePage;