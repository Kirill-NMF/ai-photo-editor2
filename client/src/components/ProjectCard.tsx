import { useState } from "react";
import { Link } from "wouter";
import { ArrowUpRight, FolderOpen, Image as ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Image, Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project & { originalImage?: Image };
  onOpenProject: () => void;
  isAboveFold?: boolean;
}

export default function ProjectCard({ project, onOpenProject, isAboveFold = false }: ProjectCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbnailUrl = project.originalImage?.thumbnailUrl || project.originalImage?.currentUrl || "";
  const projectName = project.name || "Project #" + project.id;

  return (
    <Card
      className="group overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
      data-testid={"card-project-" + project.id}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {thumbnailUrl ? (
          <div className={"relative h-full w-full " + (!isLoaded ? "animate-pulse bg-muted" : "")}>
            <img
              src={thumbnailUrl}
              alt={projectName}
              className={"h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.02] " + (
                isLoaded ? "opacity-100" : "opacity-0"
              )}
              loading={isAboveFold ? "eager" : "lazy"}
              onLoad={() => setIsLoaded(true)}
              data-testid={"img-project-" + project.id}
            />
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.09),transparent_60%)]">
            <ImageIcon className="h-10 w-10 text-muted-foreground/45" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 gap-1.5 border border-white/15 bg-black/60 text-white backdrop-blur">
          <FolderOpen className="h-3 w-3" />
          Project
        </Badge>
      </div>

      <CardContent className="space-y-4 p-4">
        <div>
          <h2 className="line-clamp-1 text-base font-semibold tracking-tight" data-testid={"text-project-name-" + project.id}>
            {projectName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">Original plus saved edit versions</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenProject}
            className="flex-1"
            data-testid={"button-open-project-" + project.id}
          >
            <FolderOpen />
            Open
          </Button>
          {project.originalImage && (
            <Button asChild size="sm" className="flex-1">
              <Link
                href={"/editor/" + project.originalImage.id}
                data-testid={"button-open-editor-" + project.id}
              >
                Editor
                <ArrowUpRight />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
