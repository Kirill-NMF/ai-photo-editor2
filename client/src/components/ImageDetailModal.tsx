import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X } from "lucide-react";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { PremiumDownloadButton } from "@/components/PremiumDownloadButton";

interface ImageDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalUrl: string;
  editedUrl: string;
  prompt: string;
  createdAt: string;
}

export default function ImageDetailModal({
  isOpen,
  onClose,
  originalUrl,
  editedUrl,
  prompt,
  createdAt
}: ImageDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl gap-0 overflow-y-auto p-0 [&>button]:hidden" data-testid="modal-image-detail">
        <DialogHeader className="border-b bg-muted/20 p-5 pr-14 sm:p-6 sm:pr-16">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <DialogTitle className="text-xl font-semibold sm:text-2xl">Image Details</DialogTitle>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{prompt}</p>
              <Badge variant="secondary" className="text-xs font-normal">
                {createdAt}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              aria-label="Close image details"
              data-testid="button-close-modal"
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-5 p-4 sm:p-6">
          <div className="overflow-hidden rounded-lg border bg-muted/20 p-2 shadow-xs sm:p-3">
            <BeforeAfterSlider beforeImage={originalUrl} afterImage={editedUrl} />
          </div>
          
          <div className="flex justify-end border-t pt-5">
            <PremiumDownloadButton label="Download Image" data-testid="button-download" className="w-full sm:w-auto" wrapperClassName="w-full sm:w-auto" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
