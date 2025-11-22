import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Upload, FileCode, Image as ImageIcon, Loader2, AlertTriangle, Disc3, Code } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const uploadSchema = z.object({
  title: z.string().min(1, "Game title is required").max(100, "Title is too long"),
});

type TitleFormData = z.infer<typeof uploadSchema>;

interface UploadGameFormProps {
  onSuccess?: () => void;
}

export function UploadGameForm({ onSuccess }: UploadGameFormProps) {
  const [uploadMode, setUploadMode] = useState<"file" | "code">("file");
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [gameFileName, setGameFileName] = useState<string>("");
  const [htmlCode, setHtmlCode] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailFileName, setThumbnailFileName] = useState<string>("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [fileErrors, setFileErrors] = useState<{ game?: string; thumbnail?: string }>({});
  const { toast } = useToast();

  const form = useForm<TitleFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: TitleFormData) => {
      const username = localStorage.getItem("username") || "";

      if (uploadMode === "code") {
        if (!htmlCode) throw new Error("HTML code is required");
        if (!thumbnailFile) throw new Error("Thumbnail is required");

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("htmlCode", htmlCode);
        formData.append("thumbnail", thumbnailFile);
        formData.append("username", username);

        const response = await fetch("/api/games/paste-code", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create game");
        }

        return response.json();
      } else {
        if (!gameFile) throw new Error("Game file is required");
        if (!thumbnailFile) throw new Error("Thumbnail is required");

        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("gameFile", gameFile);
        formData.append("thumbnail", thumbnailFile);
        formData.append("username", username);

        const response = await fetch("/api/games", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to upload game");
        }

        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Success!",
        description: "Your game has been created successfully.",
      });
      form.reset();
      setGameFile(null);
      setGameFileName("");
      setHtmlCode("");
      setThumbnailFile(null);
      setThumbnailFileName("");
      setThumbnailPreview("");
      setFileErrors({});
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TitleFormData) => {
    const errors: { game?: string; thumbnail?: string } = {};
    
    if (uploadMode === "code") {
      if (!htmlCode) {
        errors.game = "HTML code is required";
      }
    } else {
      if (!gameFile) {
        errors.game = "Game file is required";
      } else if (!gameFile.name.endsWith(".html") && !gameFile.name.endsWith(".swf")) {
        errors.game = "File must be HTML or SWF";
      }
    }
    
    if (!thumbnailFile) {
      errors.thumbnail = "Thumbnail is required";
    } else if (!thumbnailFile.type.startsWith("image/")) {
      errors.thumbnail = "File must be an image";
    }
    
    if (Object.keys(errors).length > 0) {
      setFileErrors(errors);
      return;
    }

    setFileErrors({});
    uploadMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <Alert className="border-yellow-500/50 bg-yellow-500/10 text-sm sm:text-base" data-testid="alert-security-warning">
          <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          <AlertDescription className="text-xs sm:text-sm text-foreground ml-2">
            <strong>Security Notice:</strong> Only upload games you trust. HTML files execute with browser privileges.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Game Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter game name..." 
                  {...field} 
                  className="h-9 sm:h-11 text-sm sm:text-base"
                  data-testid="input-game-title"
                />
              </FormControl>
              <FormMessage className="text-xs sm:text-sm" />
            </FormItem>
          )}
        />

        <div>
          <Label className="text-sm sm:text-base font-semibold block mb-3">Game Source</Label>
          <Tabs value={uploadMode} onValueChange={(val) => setUploadMode(val as "file" | "code")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="file" data-testid="tab-upload-file">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="code" data-testid="tab-paste-code">
                <Code className="w-4 h-4 mr-2" />
                Paste Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-0">
              <label
                htmlFor="game-file-input"
                className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover-elevate active-elevate-2 transition-all block"
                data-testid="label-game-upload"
              >
                <input
                  type="file"
                  accept=".html,.swf,text/html,text/plain,application/x-shockwave-flash"
                  id="game-file-input"
                  data-testid="input-game-file"
                  style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
                  onChange={(e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      setGameFile(file);
                      setGameFileName(file.name);
                      setFileErrors(prev => ({ ...prev, game: undefined }));
                    }
                  }}
                />
                {gameFileName.endsWith(".swf") ? (
                  <Disc3 className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground flex-shrink-0" />
                ) : (
                  <FileCode className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground flex-shrink-0" />
                )}
                <div className="text-center">
                  <p className="font-medium text-foreground text-xs sm:text-sm line-clamp-1" data-testid="text-game-filename">
                    {gameFileName || "Click to upload game file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    HTML or SWF game file
                  </p>
                </div>
              </label>
              {fileErrors.game && <p className="text-xs sm:text-sm text-destructive mt-2">{fileErrors.game}</p>}
            </TabsContent>

            <TabsContent value="code" className="space-y-0">
              <Textarea
                placeholder="Paste your HTML game code here..."
                value={htmlCode}
                onChange={(e) => {
                  setHtmlCode(e.target.value);
                  setFileErrors(prev => ({ ...prev, game: undefined }));
                }}
                className="resize-none h-48 text-sm font-mono"
                data-testid="textarea-html-code"
              />
              {fileErrors.game && <p className="text-xs sm:text-sm text-destructive mt-2">{fileErrors.game}</p>}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Label className="text-sm sm:text-base font-semibold block mb-2">Thumbnail Image</Label>
          <label
            htmlFor="thumbnail-input"
            className="flex items-center justify-center gap-2 sm:gap-3 p-4 sm:p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover-elevate active-elevate-2 transition-all block"
            data-testid="label-thumbnail-upload"
          >
            <input
              type="file"
              accept="image/*"
              id="thumbnail-input"
              data-testid="input-thumbnail"
              style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
              onChange={(e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  setThumbnailFile(file);
                  setThumbnailFileName(file.name);
                  setFileErrors(prev => ({ ...prev, thumbnail: undefined }));
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setThumbnailPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {thumbnailPreview ? (
              <div className="w-full">
                <img 
                  src={thumbnailPreview} 
                  alt="Thumbnail preview" 
                  className="w-full h-24 sm:h-48 object-cover rounded-md mb-2 sm:mb-3"
                  data-testid="img-thumbnail-preview"
                />
                <p className="font-medium text-foreground text-center text-xs sm:text-sm line-clamp-1" data-testid="text-thumbnail-filename">
                  {thumbnailFileName}
                </p>
                <p className="text-xs text-muted-foreground text-center mt-0.5 sm:mt-1">
                  Click to change
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-6 sm:w-8 h-6 sm:h-8 text-muted-foreground flex-shrink-0" />
                <div className="text-center">
                  <p className="font-medium text-foreground text-xs sm:text-sm">
                    Upload thumbnail
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                    Image file
                  </p>
                </div>
              </>
            )}
          </label>
          {fileErrors.thumbnail && <p className="text-xs sm:text-sm text-destructive mt-2">{fileErrors.thumbnail}</p>}
        </div>

        <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
          <Button 
            type="submit" 
            className="flex-1 h-9 sm:h-11 text-sm sm:text-base"
            disabled={uploadMutation.isPending}
            data-testid="button-submit-upload"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                <span className="hidden sm:inline">Uploading...</span>
                <span className="inline sm:hidden">Upload...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                Upload
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
