import { useToast as useToastOriginal } from "@/components/ui/use-toast";

export const toast = {
  success: (message) => {
    console.log("Success toast:", message);
  },
  error: (message) => {
    console.error("Error toast:", message);
  },
  warning: (message) => {
    console.warn("Warning toast:", message);
  },
  info: (message) => {
    console.info("Info toast:", message);
  }
};

export const useToast = useToastOriginal;