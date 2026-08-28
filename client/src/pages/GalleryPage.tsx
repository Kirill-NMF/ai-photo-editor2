import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FolderOpen, LayoutGrid, Plus, Sparkles } from "lucide-react";

import ProjectCard from "@/components/ProjectCard";
import ProjectModal from "@/components/ProjectModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Image, Project } from "@shared/schema";

export default function GalleryPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: projects = [], isLoading } = useQuery<(Project & { originalImage?: Image })[]>({
    queryKey: ["/api/projects"],
  });

  const itemsPerPage = 9;
  const totalPages = Math.ceil(projects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProjects = projects.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="site-container py-8 sm:py-10">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-10 w-56 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-11 w-36 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-[4/3] animate-pulse bg-muted" />
              <div className="space-y-3 p-4">
                <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
                <div className="h-9 animate-pulse rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
        <p className="sr-only" role="status">Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="site-container py-8 sm:py-10 lg:py-12">
        <div className="mb-9 flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-4 gap-2 bg-muted/30">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              Project library
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Projects</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {projects.length} {projects.length === 1 ? "project" : "projects"} in your collection
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto" data-testid="button-new-project">
            <Link href="/editor">
              <Plus />
              New Project
            </Link>
          </Button>
        </div>

        {projects.length === 0 ? (
          <Card className="relative overflow-hidden border-dashed px-6 py-20 text-center sm:py-28">
            <div className="orange-glow absolute inset-0 -z-10 opacity-70" />
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <FolderOpen className="h-6 w-6" />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">No projects yet</h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">
              Upload an image and create your first AI edit. The original and every saved version will appear here.
            </p>
            <Button asChild size="lg" className="mt-7" data-testid="button-start-editing">
              <Link href="/editor">
                <Sparkles />
                Start Editing
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {currentProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={() => setSelectedProjectId(project.id)}
                  isAboveFold={index < 3}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Gallery pages">
                <Button
                  onClick={() => setCurrentPage((previous) => Math.max(1, previous - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  data-testid="button-pagination-prev"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                    const showPage =
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1;
                    const showEllipsis =
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2);

                    if (showEllipsis) {
                      return <span key={page} className="px-2 text-muted-foreground">…</span>;
                    }

                    if (!showPage) return null;

                    return (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="icon"
                        aria-label={"Go to page " + page}
                        aria-current={currentPage === page ? "page" : undefined}
                        data-testid={"button-page-" + page}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setCurrentPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  data-testid="button-pagination-next"
                >
                  Next
                </Button>
              </nav>
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
