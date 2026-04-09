"use client";

import { useEffect } from "react";

export const getFieldError = (errors: unknown[]): string | null => {
  for (const error of errors) {
    if (typeof error === "string" && error.length > 0) {
      return error;
    }
  }

  return null;
};

export const useWarnIfDirty = (isDirty: boolean) => {
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);
};
