// src/components/SecretsList.tsx
import * as React from "react";
import {
  Badge,
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  IconButton,
  Input,
  Skeleton,
  Stack,
  Text,
  VisuallyHidden,
  Tooltip,
  RadioGroup,
} from "@chakra-ui/react";
import { Copy, Eye, EyeOff, RefreshCw, Pencil, Trash2, Search, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiFetchBlob } from "../lib/api";
import { toaster } from "./Toaster";

type SecretSummary = {
  _id: string;
  userId: string;
  label: string;
};
type SecretDetail = {
  _id: string;
  userId: string;
  label: string;
  data: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

async function writeToClipboard(text: string) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard access is not available in this environment.");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  const selection = window.getSelection();
  const originalRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.focus();
  textarea.select();

  try {
    if (typeof document.execCommand !== "function") {
      throw new Error("Clipboard access is not available in this browser.");
    }
    const succeeded = document.execCommand("copy");
    if (!succeeded) {
      throw new Error("Copy command was rejected.");
    }
  } finally {
    if (originalRange) {
      selection?.removeAllRanges();
      selection?.addRange(originalRange);
    } else {
      selection?.removeAllRanges();
    }
    document.body.removeChild(textarea);
  }
}

export function SecretsList() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState("");
  const debounced = useDebounce(query, 300);

  const [loading, setLoading] = React.useState(true);
  const [error,   setError]   = React.useState<string | null>(null);
  const [items,   setItems]   = React.useState<SecretSummary[]>([]);

  const [details, setDetails] = React.useState<Record<string, SecretDetail | undefined>>({});
  const [open,    setOpen]    = React.useState<Record<string, boolean>>({});
  const [fetchingId, setFetchingId] = React.useState<string | null>(null);
  const [copyingId, setCopyingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<"csv" | "xlsx">("csv");
  const [exporting, setExporting] = React.useState(false);
  const mountedRef = React.useRef(false);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadSecrets = React.useCallback(
    async (options?: { silent?: boolean }) => {
      if (!mountedRef.current) return;
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);
      try {
        const data = await apiFetch<SecretSummary[]>("/api/secrets");
        if (!mountedRef.current) return;
        if (Array.isArray(data)) {
          setItems(data);
        }
      } catch (e) {
        if (!mountedRef.current) return;
        const msg = e instanceof Error ? e.message : "Failed to load secrets";
        setError(msg);
      } finally {
        if (!mountedRef.current) return;
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  React.useEffect(() => {
    loadSecrets();
  }, [loadSecrets]);


  const filtered = React.useMemo<SecretSummary[]>(() => {
    const list = Array.isArray(items) ? items : [];
    const q = debounced.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) =>
      s.label.toLowerCase().includes(q) || s._id.toLowerCase().includes(q)
    );
  }, [debounced, items]);

  async function loadDetail(id: string) {
    const cached = details[id];
    if (cached) return cached;
    const fetched = await apiFetch<SecretDetail>(`/api/secrets/${encodeURIComponent(id)}`);
    if (!fetched) {
      throw new Error("Secret is unavailable. Please try again.");
    }
    setDetails((prev) => ({ ...prev, [id]: fetched }));
    return fetched;
  }

  async function reveal(id: string) {
    if (open[id]) {
      setOpen((m) => ({ ...m, [id]: false }));
      return;
    }
    try {
      setFetchingId(id);
      await loadDetail(id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch secret";
      toaster.create({ type: "error", title: "Reveal failed", description: msg });
      return;
    } finally {
      setFetchingId(null);
    }
    setOpen((m) => ({ ...m, [id]: true }));
  }

  async function copy(id: string) {
    try {
      setCopyingId(id);
      const detail = await loadDetail(id);
      const value = detail?.data;
      if (!value) {
        toaster.create({
          type: "warning",
          title: "Nothing to copy",
          description: "Secret has no value.",
        });
        return;
      }
      await writeToClipboard(value);
      toaster.create({ type: "success", title: "Copied to clipboard" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Copy failed";
      toaster.create({ type: "error", title: "Copy failed", description: msg });
    } finally {
      setCopyingId(null);
    }
  }

  function importSecrets() {
    if (importing) return;
    fileInputRef.current?.click();
  }

  async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["csv", "xlsx"].includes(extension)) {
      toaster.create({
        type: "error",
        title: "Unsupported file",
        description: "Please choose a CSV or XLSX file.",
      });
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImporting(true);
    try {
      await apiFetch("/api/secrets/import", {
        method: "POST",
        body: formData,
      });
      toaster.create({
        type: "success",
        title: "Import started",
        description: "Your secrets are being processed.",
      });
      await loadSecrets({ silent: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import secrets";
      toaster.create({
        type: "error",
        title: "Import failed",
        description: message,
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  function openExportDialog() {
    setExportDialogOpen(true);
  }

  function closeExportDialog() {
    if (exporting) return;
    setExportDialogOpen(false);
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await apiFetchBlob(`/api/secrets/export?format=${exportFormat}`, {
        method: "GET",
      });
      const extension = exportFormat === "csv" ? "csv" : "xlsx";
      const filename = `secrets-${new Date().toISOString().slice(0, 10)}.${extension}`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toaster.create({
        type: "success",
        title: "Export ready",
        description: `Downloaded ${extension.toUpperCase()} file.`,
      });
      setExportDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export secrets";
      toaster.create({
        type: "error",
        title: "Export failed",
        description: message,
      });
    } finally {
      setExporting(false);
    }
  }

  function edit(id: string) {
    navigate(`/secrets/${id}/edit`);
  }
  function remove(id: string) {
    const label = details[id]?.label ?? items.find((x) => x._id === id)?.label ?? "this secret";
    setDeleteTarget({ id, label });
  }

  function closeDeleteDialog() {
    if (deleting) return;
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleting(true);
    try {
      await apiFetch(`/api/secrets/${encodeURIComponent(id)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item._id !== id));
      setDetails((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setOpen((prev) => {
        if (!(id in prev)) return prev;
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (copyingId === id) setCopyingId(null);
      if (fetchingId === id) setFetchingId(null);
      toaster.create({
        type: "success",
        title: "Secret deleted",
        description: "The secret has been removed.",
      });
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete secret";
      toaster.create({
        type: "error",
        title: "Delete failed",
        description: message,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Box
        bg="bg.subtle"
        borderWidth="1px"
        borderRadius="xl"
        p={{ base: 3, md: 4 }}
        w="full"
        maxW={{ base: "100%", md: "800px" }}   // ✅ stretch full width on mobile
        mx="auto"                              // center on larger screens
      >
        <Stack gap={4}>
          <HStack justify="space-between" align="center">
            <Text as="h2" fontWeight="semibold">
              Your Secrets
            </Text>
          </HStack>

          {/* Search + bulk actions */}
          <HStack gap={2} align="center">
            <Box position="relative" flex="1">
              <Input
                placeholder='Search secrets (e.g., "my bank account")'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                pr="10"
                aria-label="Search secrets"
              />
              <Box position="absolute" right="2" top="50%" transform="translateY(-50%)">
                <Search size={18} />
              </Box>
            </Box>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton
                  aria-label="Import secrets"
                  variant="surface"
                  size={{ base: "xs", md: "sm" }}
                  onClick={importSecrets}
                  loading={importing}
                  disabled={importing}
                >
                  <Upload size={18} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>Import secrets</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <IconButton
                  aria-label="Export secrets"
                  variant="surface"
                  size={{ base: "xs", md: "sm" }}
                  onClick={openExportDialog}
                >
                  <Download size={18} />
                </IconButton>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>Export secrets</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          </HStack>

          {/* Divider replacement */}
          <Box borderTopWidth="1px" />

          {/* Loading */}
          {loading && (
            <Stack gap={3}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="64px" borderRadius="lg" />
              ))}
            </Stack>
          )}

          {/* Error */}
          {!loading && error && (
            <Stack gap={3} align="center" textAlign="center">
              <Text color="red.500" fontWeight="medium">
                {error}
              </Text>
              <Button variant="outline" onClick={() => location.reload()}>
                <HStack>
                  <RefreshCw size={16} />
                  <Text>Retry</Text>
                </HStack>
              </Button>
            </Stack>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <Stack gap={1} align="center" textAlign="center" py={10}>
              <Text fontWeight="medium">No secrets match your search.</Text>
              <Text color="fg.muted" fontSize="sm">
                Try a different keyword or create a new secret.
              </Text>
            </Stack>
          )}

          {/* List */}
          {filtered.length > 0 && (
            <Stack gap={3}>
            {filtered.map((s) => {
              const id = s._id;
              const isOpen = !!open[id];
              const detail = details[id];
              const busy = fetchingId === id;
              const revealLabel = isOpen ? "Hide secret" : "Reveal secret";

              return (
                <Stack
                  key={id}
                  borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                    bg="bg"
                    gap={4}
                    w="full"                               // ✅ make each card stretch fully
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "stretch", md: "start" }}
                    justify="space-between"
                  >
                    {/* Content */}
                    <Stack gap={2} flex="1" minW={0}>
                      {/* Title row */}
                      <HStack wrap="wrap" gap={2} minW={0}>
                        <Text
                          fontWeight="medium"
                          // 👉 allow 2 lines on small screens so label isn't overly truncated
                          lineClamp={{ base: 2, md: 1 }}
                          minW={0}
                        >
                          {s.label}
                        </Text>
                        <Badge title="Secret ID" variant="subtle">
                          {id.slice(-6)}
                        </Badge>
                      </HStack>

                      {/* Revealed sections */}
                      {isOpen ? (
                        <Stack gap={3}>
                          {/* Secret */}
                          <Stack gap={1}>
                            <Text fontSize="xs" color="fg.muted" fontWeight="normal">
                              Secret
                            </Text>
                            <Box
                              px={3}
                              py={2}
                              borderWidth="1px"
                              borderRadius="md"
                              bg="bg.subtle"
                              fontFamily="mono"
                              fontSize="sm"
                              whiteSpace="nowrap"
                              overflowX="auto"
                            >
                              <VisuallyHidden>
                                <label htmlFor={`secret-${id}`}>Secret value</label>
                              </VisuallyHidden>
                              <Text as="span" id={`secret-${id}`}>
                                {detail?.data ?? "••••••••••"}
                              </Text>
                            </Box>
                          </Stack>

                          {/* Notes */}
                          {detail?.notes && (
                            <Stack gap={1}>
                              <Text fontSize="xs" color="fg.muted" fontWeight="normal">
                                Notes
                              </Text>
                              <Box
                                px={3}
                                py={2}
                                borderWidth="1px"
                                borderRadius="md"
                                bg="bg.subtle"
                                fontFamily="mono"
                                fontSize="sm"
                                whiteSpace="pre-wrap"
                                wordBreak="break-word"
                              >
                                <VisuallyHidden>
                                  <label htmlFor={`notes-${id}`}>Notes</label>
                                </VisuallyHidden>
                                <Text as="span" id={`notes-${id}`}>
                                  {detail.notes}
                                </Text>
                              </Box>
                            </Stack>
                          )}
                        </Stack>
                      ) : null}
                    </Stack>

                    {/* Actions */}
                    <HStack
                      // 👉 on small screens, actions drop below content and right-align
                      justify={{ base: "flex-end", md: "flex-start" }}
                      align="center"
                      gap={{ base: 2, md: 2 }}
                      // keep actions from shrinking awkwardly in row layout
                      flexShrink={0}
                      // compact buttons on mobile
                      style={{}}
                    >
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label={revealLabel}
                          variant="surface"
                          size={{ base: "xs", md: "sm" }}
                          loading={busy}
                          onClick={() => reveal(id)}
                        >
                          {isOpen ? <EyeOff size={18} /> : <Eye size={18} />}
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>{revealLabel}</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>

                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Copy secret"
                          variant="surface"
                          size={{ base: "xs", md: "sm" }}
                          onClick={() => copy(id)}
                          loading={copyingId === id}
                        >
                          <Copy size={18} />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Copy secret</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>

                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Edit secret"
                          variant="surface"
                          size={{ base: "xs", md: "sm" }}
                          onClick={() => edit(id)}
                        >
                          <Pencil size={18} />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Edit secret</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>

                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <IconButton
                          aria-label="Delete secret"
                          variant="surface"
                          size={{ base: "xs", md: "sm" }}
                          colorPalette="red"
                          onClick={() => remove(id)}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </Tooltip.Trigger>
                      <Tooltip.Positioner>
                        <Tooltip.Content>Delete secret</Tooltip.Content>
                      </Tooltip.Positioner>
                    </Tooltip.Root>
                  </HStack>
                </Stack>
              );
            })}
            </Stack>
          )}
        </Stack>
      </Box>
      <DialogRoot
        open={deleteTarget !== null}
        onOpenChange={({ open }) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete secret</DialogTitle>
            </DialogHeader>
            <DialogBody>
              Are you sure you want to delete "{deleteTarget?.label ?? "this secret"}"?
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={closeDeleteDialog} disabled={deleting}>
                Cancel
              </Button>
              <Button
                colorPalette="red"
                ml={3}
                onClick={confirmDelete}
                loading={deleting}
                disabled={deleting}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
      <DialogRoot
        open={exportDialogOpen}
        onOpenChange={({ open }) => {
          if (!open) closeExportDialog();
        }}
      >
        <DialogBackdrop />
        <DialogPositioner>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export secrets</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap={4}>
                <Text color="fg.muted" fontSize="sm">
                  Choose the file format for your export.
                </Text>
                <RadioGroup.Root
                  value={exportFormat}
                  onValueChange={({ value }) => setExportFormat(value as "csv" | "xlsx")}
                >
                  <Stack gap={2}>
                    <RadioGroup.Item value="csv">
                      <HStack
                        gap={3}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: "bg.muted" }}
                      >
                        <RadioGroup.ItemControl>
                          <RadioGroup.ItemIndicator />
                        </RadioGroup.ItemControl>
                        <RadioGroup.ItemText>CSV (.csv)</RadioGroup.ItemText>
                      </HStack>
                      <RadioGroup.ItemHiddenInput />
                    </RadioGroup.Item>
                    <RadioGroup.Item value="xlsx">
                      <HStack
                        gap={3}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: "bg.muted" }}
                      >
                        <RadioGroup.ItemControl>
                          <RadioGroup.ItemIndicator />
                        </RadioGroup.ItemControl>
                        <RadioGroup.ItemText>Excel (.xlsx)</RadioGroup.ItemText>
                      </HStack>
                      <RadioGroup.ItemHiddenInput />
                    </RadioGroup.Item>
                  </Stack>
                </RadioGroup.Root>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={closeExportDialog} disabled={exporting}>
                Cancel
              </Button>
              <Button
                colorPalette="teal"
                ml={3}
                onClick={handleExport}
                loading={exporting}
                disabled={exporting}
              >
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </DialogRoot>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: "none" }}
        onChange={handleImportChange}
      />
    </>
  );
}
