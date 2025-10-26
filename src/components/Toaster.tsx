import React from 'react';
import {
  Toaster as ChakraToaster,
  createToaster,
  ToastRoot,
  ToastIndicator,
  ToastTitle,
  ToastDescription,
  ToastActionTrigger,
  ToastCloseTrigger,
  Stack,
  Box
} from '@chakra-ui/react';

// Create a single toaster store
export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
  max: 3,
  offsets: '16px'
});

// Infer the type of the render-prop argument without using `any`
type ToasterRender = NonNullable<Parameters<typeof ChakraToaster>[0]['children']>;
type ToastRenderArg = Parameters<ToasterRender>[0];

export function Toaster() {
  return (
    <ChakraToaster toaster={toaster}>
      {(toast: ToastRenderArg) => {
        // Extract only what we need; do NOT spread `toast` into ToastRoot
        const id = 'id' in toast ? (toast as { id: string }).id : undefined;
        const title = 'title' in toast ? (toast as { title?: React.ReactNode }).title : undefined;
        const description = 'description' in toast ? (toast as { description?: React.ReactNode }).description : undefined;
        const action = 'action' in toast ? (toast as { action?: { label: string; onClick: () => void } }).action : undefined;
        const type =
          "type" in toast
            ? (toast as { type?: "success" | "error" | "info" | "warning" }).type
            : "info";

        // Accent color by type
        const accentColor =
          type === "success"
            ? "green.400"
            : type === "error"
            ? "red.400"
            : type === "warning"
            ? "orange.400"
            : "blue.400";

        // If `id` is missing (shouldn't be), fall back to a stable key
        const key = id ?? 'toast';

        return (
          <ToastRoot
            key={key}
            p="4"
            borderRadius="xl"
            borderWidth="1px"
            boxShadow="lg"
            bg="bg.muted"
            color="fg"
            // width rules: up to 420px, but never overflow the viewport
            style={{ width: "min(420px, calc(100vw - 2rem))" }}
            // allow text to wrap (prevents squish)
            whiteSpace="normal"
            wordBreak="break-word"
            display="flex"
            alignItems="stretch"
            overflow="hidden"
          >
            <Box w="4px" bg={accentColor} borderRadius="sm" mr="3" />
            <ToastIndicator />
            <Stack gap="1">
              {title ? <ToastTitle>{title}</ToastTitle> : null}
              {description ? <ToastDescription color="fg.muted">{description}</ToastDescription> : null}
            </Stack>
            {action ? <ToastActionTrigger onClick={action.onClick}>{action.label}</ToastActionTrigger> : null}
            <ToastCloseTrigger />
          </ToastRoot>
        );
      }}
    </ChakraToaster>
  );
}
