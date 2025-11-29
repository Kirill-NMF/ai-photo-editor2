import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, ExternalLink, AlertTriangle, Download } from "lucide-react";
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-project-modal">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-project-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{project.name || `Project #${project.id}`}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-2"
                data-testid="button-delete-project"
              >
                <Trash2 className="h-4 w-4" />
                Delete Project
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Original Image */}
            {project.originalImage && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Original Image</h3>
                <Card className="overflow-hidden" data-testid="card-original-image">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={project.originalImage.currentUrl}
                      alt="Original"
                      className="w-full h-full object-contain"
                      loading="lazy"
                      data-testid="img-original"
                    />
                  </div>
                  <div className="p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(project.originalImage!.currentUrl, `original-${project.originalImage!.fileName}`)}
                      className="gap-2 w-full"
                      data-testid="button-download-original"
                    >
                      <Download className="h-4 w-4" />
                      Download Original
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Saved Versions */}
            {savedVersions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">
                  Saved Versions ({savedVersions.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedVersions.map((image) => (
                    <Card
                      key={image.id}
                      className="overflow-hidden group hover-elevate"
                      data-testid={`card-saved-${image.id}`}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                          src={image.currentUrl}
                          alt={image.fileName}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          data-testid={`img-saved-${image.id}`}
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-muted-foreground" data-testid={`text-filename-${image.id}`}>
                          {image.fileName}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(image.currentUrl, image.fileName)}
                          className="gap-2 w-full"
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
              <h3 className="text-sm font-semibold mb-3">
                All Edits ({edits.length})
              </h3>
              {edits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No edits yet. Open this project in the editor to create versions.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {edits.map((edit) => (
                    <Card
                      key={edit.id}
                      className="overflow-hidden group hover-elevate"
                      data-testid={`card-edit-${edit.id}`}
                    >
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                          src={edit.resultUrl}
                          alt={edit.prompt}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          data-testid={`img-edit-${edit.id}`}
                        />
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-sm line-clamp-2" data-testid={`text-prompt-${edit.id}`}>
                          {edit.prompt}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(edit.resultUrl, `edit-${edit.id}.png`)}
                            className="gap-2 flex-1"
                            data-testid={`button-download-edit-${edit.id}`}
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setEditToDelete(edit.id)}
                            className="gap-2 flex-1"
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
