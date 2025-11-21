import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Upload, FileCode, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const uploadSchema = z.object({
  title: z.string().min(1, "Game title is required").max(100, "Title is too long"),
  htmlFile: z.instanceof(File).refine(
    (file) => file.type === "text/html" || file.name.endsWith(".html"),
    "File must be an HTML file"
  ),
  thumbnail: z.instanceof(File).refine(
    (file) => file.type.startsWith("image/"),
    "File must be an image"
  ),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadGameFormProps {
  onSuccess?: () => void;
}

export function UploadGameForm({ onSuccess }: UploadGameFormProps) {
  const [htmlFileName, setHtmlFileName] = useState<string>("");
  const [thumbnailFileName, setThumbnailFileName] = useState<string>("");
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      title: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadFormData) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("htmlFile", data.htmlFile);
      formData.append("thumbnail", data.thumbnail);

      const response = await fetch("/api/games", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload game");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Success!",
        description: "Your game has been uploaded successfully.",
      });
      form.reset();
      setHtmlFileName("");
      setThumbnailFileName("");
      setThumbnailPreview("");
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

  const onSubmit = (data: UploadFormData) => {
    uploadMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Alert className="border-yellow-500/50 bg-yellow-500/10" data-testid="alert-security-warning">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-sm text-foreground ml-2">
            <strong>Security Notice:</strong> Only upload games you created or trust completely. 
            Uploaded HTML files will execute with your browser's privileges.
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Game Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter game name..." 
                  {...field} 
                  className="h-11 text-base"
                  data-testid="input-game-title"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="htmlFile"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">HTML Game File</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".html,text/html"
                    className="hidden"
                    id="html-file-input"
                    data-testid="input-html-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        setHtmlFileName(file.name);
                      }
                    }}
                    {...field}
                  />
                  <Label
                    htmlFor="html-file-input"
                    className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover-elevate active-elevate-2 transition-all"
                    data-testid="label-html-upload"
                  >
                    <FileCode className="w-8 h-8 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium text-foreground" data-testid="text-html-filename">
                        {htmlFileName || "Click to upload HTML file"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your game's main HTML file
                      </p>
                    </div>
                  </Label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="thumbnail"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Thumbnail Image</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="thumbnail-input"
                    data-testid="input-thumbnail"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        setThumbnailFileName(file.name);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setThumbnailPreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    {...field}
                  />
                  <Label
                    htmlFor="thumbnail-input"
                    className="flex items-center justify-center gap-3 p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover-elevate active-elevate-2 transition-all"
                    data-testid="label-thumbnail-upload"
                  >
                    {thumbnailPreview ? (
                      <div className="w-full">
                        <img 
                          src={thumbnailPreview} 
                          alt="Thumbnail preview" 
                          className="w-full h-48 object-cover rounded-md mb-3"
                          data-testid="img-thumbnail-preview"
                        />
                        <p className="font-medium text-foreground text-center" data-testid="text-thumbnail-filename">
                          {thumbnailFileName}
                        </p>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          Click to change
                        </p>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        <div className="text-center">
                          <p className="font-medium text-foreground">
                            Click to upload thumbnail
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            16:9 aspect ratio recommended
                          </p>
                        </div>
                      </>
                    )}
                  </Label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 h-11 text-base"
            disabled={uploadMutation.isPending}
            data-testid="button-submit-upload"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Game
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
