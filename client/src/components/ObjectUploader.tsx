// Integration: Object Storage (blueprint:javascript_object_storage)
import { useState, forwardRef, useImperativeHandle } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import DashboardModal from "@uppy/react/dashboard-modal";
import XHRUpload from "@uppy/xhr-upload";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import "@uppy/core/css/style.min.css";
import "@uppy/dashboard/css/style.min.css";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, ObjectUploadBody>
  ) => void;
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
  const [uppy] = useState(() =>
    new Uppy<Record<string, unknown>, ObjectUploadBody>({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
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
      .on("complete", (result) => {
        onComplete?.(result);
      })
  );

  // Expose uppy instance to parent
  useImperativeHandle(ref, () => ({
    uppy,
  }));

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-upload">
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
});
