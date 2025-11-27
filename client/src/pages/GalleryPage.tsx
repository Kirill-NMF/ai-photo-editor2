import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ProjectCard from "@/components/ProjectCard";
import ProjectModal from "@/components/ProjectModal";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import type { Project, Image } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GalleryPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  // Fetch user's projects from the database
  const { data: projects = [], isLoading } = useQuery<(Project & { originalImage?: Image })[]>({
    queryKey: ['/api/projects'],
  });

  // Pagination
  const itemsPerPage = 9;
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  // TEMPORARY: Migration mutation to create projects for existing images
  const migrateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/migrate-data");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Migration successful!",
        description: `Created ${data.projectsCreated} projects and linked ${data.imagesLinked} images.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Migration failed",
        description: error instanceof Error ? error.message : "Failed to migrate data",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">My Projects</h1>
            <p className="text-base text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your collection
            </p>
          </div>
          <Link href="/editor">
            <Button size="lg" data-testid="button-new-project" className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-32">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Plus className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">No projects yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start by uploading and editing your first image to create a project
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/editor">
                <Button size="lg" data-testid="button-start-editing" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start Editing
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => migrateMutation.mutate()}
                disabled={migrateMutation.isPending}
                data-testid="button-migrate-data" 
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${migrateMutation.isPending ? 'animate-spin' : ''}`} />
                {migrateMutation.isPending ? 'Migrating...' : 'Restore Old Images'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-2 gap-4 mb-8">
              {currentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={() => setSelectedProjectId(project.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                {/* Previous Button */}
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="px-4"
                  data-testid="button-pagination-prev"
                >
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1;
                    
                    const showEllipsis = 
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2);

                    if (showEllipsis) {
                      return <span key={page} className="px-2 text-muted-foreground">...</span>;
                    }

                    if (!showPage) return null;

                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        className="px-4"
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="px-4"
                  data-testid="button-pagination-next"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {selectedProjectId && (
        <ProjectModal
          projectId={selectedProjectId}
          isOpen={selectedProjectId !== null}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
