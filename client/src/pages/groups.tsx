import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Group } from "@shared/schema";

export default function Groups() {
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const { toast } = useToast();
  
  const username = localStorage.getItem("username") || "";

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (!username) {
        toast({ title: "Error", description: "Please set a username first" });
        return;
      }
      return await apiRequest("POST", "/api/groups", {
        name: groupName,
        description: groupDescription,
        username,
      });
    },
    onSuccess: () => {
      setGroupName("");
      setGroupDescription("");
      setCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Success", description: "Group created!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create group" });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      if (!username) {
        toast({ title: "Error", description: "Please set a username first" });
        return;
      }
      return await apiRequest("POST", `/api/groups/${groupId}/join`, { username });
    },
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setLocation(`/groups/${groupId}`);
      toast({ title: "Success", description: "Joined group!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to join group" });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-8 gap-4 flex-col sm:flex-row">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2" data-testid="heading-groups">
              Gaming Groups
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-groups-description">
              Create or join groups to play games together and chat with friends
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" size="lg" data-testid="button-create-group">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md" data-testid="dialog-create-group">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="label-group-name">
                    Group Name
                  </label>
                  <Input
                    placeholder="My Gaming Group"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    data-testid="input-group-name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" data-testid="label-group-description">
                    Description (optional)
                  </label>
                  <Textarea
                    placeholder="What's this group about?"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="resize-none"
                    data-testid="input-group-description"
                  />
                </div>
                <Button
                  onClick={() => createGroupMutation.mutate()}
                  disabled={!groupName || createGroupMutation.isPending}
                  className="w-full"
                  data-testid="button-create-group-submit"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="hover-elevate flex flex-col" data-testid={`card-group-${group.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-2" data-testid={`text-group-name-${group.id}`}>
                        {group.name}
                      </CardTitle>
                      {group.description && (
                        <CardDescription className="line-clamp-2 mt-1" data-testid={`text-group-description-${group.id}`}>
                          {group.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>Created at {new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation(`/groups/${group.id}`)}
                      className="flex-1"
                      data-testid={`button-view-group-${group.id}`}
                    >
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => joinGroupMutation.mutate(group.id)}
                      disabled={joinGroupMutation.isPending}
                      className="flex-1"
                      data-testid={`button-join-group-${group.id}`}
                    >
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">No groups yet. Create one to get started!</p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" data-testid="button-create-group-empty">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Group Name</label>
                    <Input
                      placeholder="My Gaming Group"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <Textarea
                      placeholder="What's this group about?"
                      value={groupDescription}
                      onChange={(e) => setGroupDescription(e.target.value)}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    onClick={() => createGroupMutation.mutate()}
                    disabled={!groupName || createGroupMutation.isPending}
                    className="w-full"
                  >
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
