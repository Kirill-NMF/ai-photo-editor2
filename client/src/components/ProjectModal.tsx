import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Download, FolderOpen, Image as ImageIcon, Layers3, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, Image, Edit } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectModal({ projectId, isOpen, onClose }: ProjectModalProps) {
  const { toast } = useToast();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editToDelete, setEditToDelete] = useState<number | null>(null);

  // Fetch project details with images and edits
  const { data: project, isLoading } = useQuery<Project & { originalImage?: Image; images?: Image[]; edits?: Edit[] }>({
    queryKey: ['/api/projects', projectId],
    enabled: isOpen && !!projectId,
  });

  // Download handler function
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'downloaded-image';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete edit mutation
  const deleteEditMutation = useMutation({
    mutationFn: async (editId: number) => {
      await apiRequest("DELETE", `/api/edits/${editId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "Edit deleted",
        description: "The edit has been removed",
      });
      setEditToDelete(null);
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete edit. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Project deleted",
        description: "The project and all its versions have been removed",
      });
      setDeleteConfirmOpen(false);
      onClose();
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !project) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto p-0" data-testid="dialog-project-modal">
          <div className="flex min-h-64 items-center justify-center bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.09),transparent_48%)]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const edits = project.edits || [];
  const images = project.images || [];
  
  // Saved versions are non-original images
  const savedVersions = images.filter(img => img.isOriginal === 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[90vh] max-w-5xl gap-0 overflow-y-auto p-0" data-testid="dialog-project-modal">
          <DialogHeader className="border-b bg-muted/20 px-5 py-5 pr-14 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary shadow-2xs">
                  <FolderOpen className="h-4 w-4" />
                </span>
                <div>
                  <DialogTitle className="text-xl sm:text-2xl">
                    {project.name || `Project #${project.id}`}
                  </DialogTitle>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Review the original, saved versions, and every generated edit.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{savedVersions.length} saved</Badge>
                <Badge variant="secondary">{edits.length} edits</Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-8 p-5 sm:p-7">
            {/* Original Image */}
            {project.originalImage && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Original Image</h3>
                  <Badge variant="outline" className="ml-auto">Source</Badge>
                </div>
                <Card className="overflow-hidden bg-muted/10" data-testid="card-original-image">
                  <div className="relative aspect-video overflow-hidden bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06),transparent_70%)] p-2 sm:p-4">
                    <img
                      src={project.originalImage.thumbnailUrl || project.originalImage.currentUrl}
                      alt="Original"
                      className="h-full w-full rounded-md object-contain"
                      loading="lazy"
                      data-testid="img-original"
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t bg-background p-3 sm:flex-row sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(project.originalImage!.currentUrl, `original-${project.originalImage!.fileName}`)}
                      className="gap-2 sm:w-auto"
                      data-testid="button-download-original"
                    >
                      <Download className="h-4 w-4" />
                      Download Original
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="gap-2 sm:w-auto"
                      data-testid="button-delete-project"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Project
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Saved Versions */}
            {savedVersions.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Saved Versions</h3>
                  <Badge variant="secondary" className="ml-auto">{savedVersions.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {savedVersions.map((image) => (
                    <Card
                      key={image.id}
                      className="group overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                      data-testid={`card-saved-${image.id}`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-muted/30 p-2">
                        <img
                          src={image.thumbnailUrl || image.currentUrl}
                          alt={image.fileName}
                          className="h-full w-full rounded-md object-contain"
                          loading="lazy"
                          data-testid={`img-saved-${image.id}`}
                        />
                      </div>
                      <div className="space-y-3 border-t p-3">
                        <p className="truncate text-xs text-muted-foreground" title={image.fileName} data-testid={`text-filename-${image.id}`}>
                          {image.fileName}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(image.currentUrl, image.fileName)}
                          className="w-full gap-2"
                          data-testid={`button-download-saved-${image.id}`}
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Edits */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">All Edits</h3>
                <Badge variant="secondary" className="ml-auto">{edits.length}</Badge>
              </div>
              {edits.length === 0 ? (
                <div className="rounded-lg border border-dashed bg-muted/20 px-5 py-10 text-center">
                  <Layers3 className="mx-auto h-7 w-7 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">No edits yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">Open this project in the editor to create versions.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {edits.map((edit) => (
                    <Card
                      key={edit.id}
                      className="group overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
                      data-testid={`card-edit-${edit.id}`}
                    >
                      <div className="relative aspect-video overflow-hidden bg-muted/30 p-2">
                        <img
                          src={edit.thumbnailUrl || edit.resultUrl}
                          alt={edit.prompt}
                          className="h-full w-full rounded-md object-contain"
                          loading="lazy"
                          data-testid={`img-edit-${edit.id}`}
                        />
                      </div>
                      <div className="space-y-3 border-t p-3">
                        <p className="line-clamp-2 min-h-10 text-sm leading-5" data-testid={`text-prompt-${edit.id}`}>
                          {edit.prompt}
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(edit.resultUrl, `edit-${edit.id}.png`)}
                            className="flex-1 gap-2"
                            data-testid={`button-download-edit-${edit.id}`}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEditToDelete(edit.id)}
                            className="flex-1 gap-2"
                            data-testid={`button-delete-edit-${edit.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Edit Confirmation */}
      <AlertDialog open={editToDelete !== null} onOpenChange={() => setEditToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Edit?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this edit version. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-edit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editToDelete && deleteEditMutation.mutate(editToDelete)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-edit"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Entire Project?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the project, its original image, and all {edits.length} edit version{edits.length !== 1 ? 's' : ''}. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-project">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-project"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
