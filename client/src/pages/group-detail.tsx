import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Send, Upload, MessageSquare, Gamepad2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Group, Message, GroupGame, User, UserCosmetic, CosmeticTrade } from "@shared/schema";

export default function GroupDetail() {
  const [, params] = useRoute("/groups/:groupId");
  const [, setLocation] = useLocation();
  const groupId = params?.groupId || "";
  const [messageText, setMessageText] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("");
  const [senderCosmetics, setSenderCosmetics] = useState<string[]>([]);
  const [receiverCosmetics, setReceiverCosmetics] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const username = localStorage.getItem("username") || "";

  // Queries
  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: [`/api/groups/${groupId}`],
    enabled: !!groupId,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Array<Message & { user: { id: string; username: string } }>>({
    queryKey: [`/api/groups/${groupId}/messages`],
    refetchInterval: 2000,
    enabled: !!groupId,
  });

  const { data: games = [], isLoading: gamesLoading } = useQuery<GroupGame[]>({
    queryKey: [`/api/groups/${groupId}/games`],
    enabled: !!groupId,
  });

  const { data: groupMembers = [] } = useQuery<(User & { cosmetics: UserCosmetic[] })[]>({
    queryKey: [`/api/groups/${groupId}/members`],
    enabled: !!groupId,
  });

  const { data: myCosmetics = [] } = useQuery<UserCosmetic[]>({
    queryKey: [`/api/users/${username}/cosmetics`],
    enabled: !!username,
  });

  const { data: myTrades = [] } = useQuery<CosmeticTrade[]>({
    queryKey: [`/api/user/${username}/trades`],
    enabled: !!username,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!username) {
        toast({ title: "Error", description: "Please set a username first" });
        return;
      }
      return await apiRequest("POST", `/api/groups/${groupId}/messages`, {
        content: messageText,
        username,
      });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/messages`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message" });
    },
  });

  const proposeTradeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecipient || senderCosmetics.length === 0 || receiverCosmetics.length === 0) {
        toast({ title: "Error", description: "Select recipient and cosmetics" });
        return;
      }
      return await apiRequest("POST", "/api/trades/propose", {
        username,
        receiverId: selectedRecipient,
        groupId,
        senderCosmeticIds: senderCosmetics,
        receiverCosmeticIds: receiverCosmetics,
      });
    },
    onSuccess: () => {
      toast({ title: "Trade proposed!", description: "Waiting for recipient to respond" });
      setSenderCosmetics([]);
      setReceiverCosmetics([]);
      setSelectedRecipient("");
      queryClient.invalidateQueries({ queryKey: [`/api/user/${username}/trades`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to propose trade", variant: "destructive" });
    },
  });

  const acceptTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      return await apiRequest("POST", `/api/trades/${tradeId}/accept`, { username });
    },
    onSuccess: () => {
      toast({ title: "Trade accepted!", description: "Cosmetics have been exchanged" });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${username}/trades`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${username}/cosmetics`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept trade", variant: "destructive" });
    },
  });

  const rejectTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      return await apiRequest("POST", `/api/trades/${tradeId}/reject`, { username });
    },
    onSuccess: () => {
      toast({ title: "Trade rejected" });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${username}/trades`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject trade", variant: "destructive" });
    },
  });

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading group...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Group not found</div>
        <Button onClick={() => setLocation("/groups")}>Back to Groups</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/groups")}
            data-testid="button-back-to-groups"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate" data-testid="heading-group-name">
              {group.name}
            </h1>
            {group.description && (
              <p className="text-sm text-muted-foreground truncate" data-testid="text-group-description">
                {group.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Tabs defaultValue="chat" className="w-full" data-testid="tabs-group-content">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" data-testid="tab-chat">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="games" data-testid="tab-group-games">
                <Gamepad2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Games</span>
              </TabsTrigger>
              <TabsTrigger value="trading" data-testid="tab-trading">
                <Gift className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Trading</span>
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="h-[calc(100vh-300px)] flex flex-col gap-4">
              <div className="flex-1 overflow-y-auto border border-border rounded-lg bg-card p-4 space-y-4">
                {messagesLoading ? (
                  <div className="text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">No messages yet. Start the conversation!</div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.user?.id ? "justify-start" : "justify-end"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div className={`max-w-xs px-3 py-2 rounded-lg ${
                        msg.user?.username === username
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <p className="text-xs font-medium mb-1">{msg.user?.username || "Unknown"}</p>
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageMutation.mutate();
                    }
                  }}
                  data-testid="input-message"
                />
                <Button
                  size="icon"
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!messageText || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Games Tab */}
            <TabsContent value="games" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold" data-testid="heading-group-games">
                  Group Games ({games.length})
                </h2>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-upload-group-game">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Game
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-md" data-testid="dialog-upload-group-game">
                    <DialogHeader>
                      <DialogTitle>Upload Game to Group</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground">
                      Upload HTML and thumbnail files to add a game to this group
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {gamesLoading ? (
                <div className="text-muted-foreground">Loading games...</div>
              ) : games.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No games in this group yet
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {games.map((game) => (
                    <Card key={game.id} className="hover-elevate" data-testid={`card-game-${game.id}`}>
                      <CardContent className="p-3">
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full aspect-video object-cover rounded-md mb-2"
                        />
                        <p className="text-sm font-medium line-clamp-2" data-testid={`text-game-title-${game.id}`}>
                          {game.title}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Trading Tab */}
            <TabsContent value="trading" className="space-y-6">
              {/* Propose Trade */}
              <Card>
                <CardHeader>
                  <CardTitle>Propose Trade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Member</label>
                    <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
                      <SelectTrigger data-testid="select-trade-recipient">
                        <SelectValue placeholder="Choose a member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {groupMembers
                          .filter(m => m.username !== username)
                          .map(member => (
                            <SelectItem key={member.id} value={member.id} data-testid={`option-member-${member.id}`}>
                              {member.username}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedRecipient && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Cosmetics</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {myCosmetics.length === 0 ? (
                            <p className="text-xs text-muted-foreground col-span-2">No cosmetics to trade</p>
                          ) : (
                            myCosmetics.map(cosmetic => (
                              <Button
                                key={cosmetic.id}
                                variant={senderCosmetics.includes(cosmetic.id) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSenderCosmetics(prev =>
                                    prev.includes(cosmetic.id)
                                      ? prev.filter(id => id !== cosmetic.id)
                                      : [...prev, cosmetic.id]
                                  );
                                }}
                                data-testid={`button-select-sender-cosmetic-${cosmetic.id}`}
                                className="h-auto py-2"
                              >
                                <span className="text-xs">{cosmetic.cosmeticId.slice(0, 8)}...</span>
                              </Button>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Request Their Cosmetics</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                          {groupMembers.find(m => m.id === selectedRecipient)?.cosmetics?.length === 0 ? (
                            <p className="text-xs text-muted-foreground col-span-2">No cosmetics available</p>
                          ) : (
                            groupMembers
                              .find(m => m.id === selectedRecipient)
                              ?.cosmetics?.map(cosmetic => (
                                <Button
                                  key={cosmetic.id}
                                  variant={receiverCosmetics.includes(cosmetic.id) ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    setReceiverCosmetics(prev =>
                                      prev.includes(cosmetic.id)
                                        ? prev.filter(id => id !== cosmetic.id)
                                        : [...prev, cosmetic.id]
                                    );
                                  }}
                                  data-testid={`button-select-receiver-cosmetic-${cosmetic.id}`}
                                  className="h-auto py-2"
                                >
                                  <span className="text-xs">{cosmetic.cosmeticId.slice(0, 8)}...</span>
                                </Button>
                              ))
                          )}
                        </div>
                      </div>

                      <Button
                        onClick={() => proposeTradeMutation.mutate()}
                        disabled={proposeTradeMutation.isPending || senderCosmetics.length === 0 || receiverCosmetics.length === 0}
                        data-testid="button-propose-trade"
                      >
                        Propose Trade
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Incoming Trades */}
              <Card>
                <CardHeader>
                  <CardTitle>Trade Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {myTrades.filter(t => t.status === "pending").length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending trade requests</p>
                  ) : (
                    <div className="space-y-3">
                      {myTrades
                        .filter(t => t.status === "pending")
                        .map(trade => {
                          const sender = groupMembers.find(m => m.id === trade.senderId);
                          return (
                            <div key={trade.id} className="border rounded-lg p-3 space-y-2" data-testid={`trade-request-${trade.id}`}>
                              <p className="text-sm font-medium">{sender?.username} wants to trade</p>
                              <p className="text-xs text-muted-foreground">
                                Offering {JSON.parse(trade.senderCosmeticIds).length} items • Requesting {JSON.parse(trade.receiverCosmeticIds).length} items
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => acceptTradeMutation.mutate(trade.id)}
                                  disabled={acceptTradeMutation.isPending}
                                  data-testid={`button-accept-trade-${trade.id}`}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectTradeMutation.mutate(trade.id)}
                                  disabled={rejectTradeMutation.isPending}
                                  data-testid={`button-reject-trade-${trade.id}`}
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
