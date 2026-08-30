// Integration: Object Storage (blueprint:javascript_object_storage)
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import DashboardModal from "@uppy/react/dashboard-modal";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  getUploadFailureMessage,
} from "@/lib/uploadFeedback";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, ObjectUploadBody>
  ) => Promise<void> | void;
  buttonClassName?: string;
  children: ReactNode;
}

export interface ObjectUploadBody extends Record<string, unknown> {
  url: string;
}

export interface ObjectUploaderRef {
  uppy: Uppy<Record<string, unknown>, ObjectUploadBody>;
}

export const ObjectUploader = forwardRef<ObjectUploaderRef, ObjectUploaderProps>(({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onComplete,
  buttonClassName,
  children,
}, ref) => {
  const [showModal, setShowModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [uppy] = useState(() => {
    const instance = new Uppy<Record<string, unknown>, ObjectUploadBody>({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: [...ACCEPTED_UPLOAD_MIME_TYPES],
      },
      autoProceed: false,
    })
      .use(XHRUpload, {
        endpoint: "/api/objects/upload",
        method: "POST",
        formData: false,
        responseType: "text",
        getResponseData: (xhr: XMLHttpRequest) => {
          const response = JSON.parse(xhr.responseText) as { url?: string };
          if (!response.url) throw new Error("Upload response did not include a URL");
          return { url: response.url };
        },
      })
      .on("restriction-failed", (_file, error) => {
        const message = getUploadFailureMessage({
          phase: "selection",
          code: (error as Error & { code?: string }).code,
        });
        setUploadError(message);
      })
      .on("upload-stalled", () => {
        setUploadError(getUploadFailureMessage({ phase: "transfer" }));
      })
      .on("upload-error", (_file, _error, response) => {
        const body = response?.body as unknown as { error?: string } | undefined;
        setUploadError(getUploadFailureMessage({
          phase: "transfer",
          status: response?.status,
          serverError: body?.error,
        }));
      })
      .on("upload", () => {
        setUploadError(null);
      })
      .on("complete", (result) => {
        if (!result.successful?.length) return;
        setIsRegistering(true);
        void Promise.resolve()
          .then(() => onComplete?.(result))
          .then(() => {
            setShowModal(false);
            setUploadError(null);
            setIsRegistering(false);
            instance.clear();
          })
          .catch((error: unknown) => {
            setIsRegistering(false);
            setUploadError(error instanceof Error
              ? error.message
              : getUploadFailureMessage({ phase: "registration" }));
          });
      });

    return instance;
  });

  useEffect(() => () => uppy.destroy(), [uppy]);

  // Expose uppy instance to parent
  useImperativeHandle(ref, () => ({
    uppy,
  }));

  return (
    <div className="w-full">
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-upload">
        {children}
      </Button>

      {uploadError && (
        <p className="mt-3 text-sm text-destructive" role="alert" data-testid="text-upload-error">
          {uploadError}
        </p>
      )}
      {isRegistering && (
        <p className="mt-3 text-sm text-muted-foreground" role="status" data-testid="text-upload-finalizing">
          Upload complete. Saving the photo to your workspace…
        </p>
      )}

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
        note={uploadError
          ?? (isRegistering
            ? "Upload complete. Saving the photo to your workspace…"
            : "JPEG, PNG, or WebP up to 10MB")}
      />
    </div>
  );
});
