import * as React from "react";
import {
  Button,
  Container,
  Field,
  Heading,
  Input,
  Spinner,
  Stack,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { toaster } from "../components/Toaster";

type FormState = {
  label: string;
  data: string;
  notes: string;
};

type SecretDetail = {
  _id: string;
  label: string;
  data: string;
  notes: string | null;
};

export default function EditSecret() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [refreshIndex, setRefreshIndex] = React.useState(0);
  const [form, setForm] = React.useState<FormState>({
    label: "",
    data: "",
    notes: "",
  });
  const [touched, setTouched] = React.useState<Record<keyof FormState, boolean>>({
    label: false,
    data: false,
    notes: false,
  });
  const [loading, setLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!id) {
      toaster.create({
        type: "error",
        title: "Invalid secret",
        description: "Secret identifier is missing.",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    let active = true;
    setLoading(true);
    setFetchError(null);
    (async () => {
      try {
        const data = await apiFetch<SecretDetail>(`/api/secrets/${encodeURIComponent(id)}`);
        if (!active) return;
        if (!data) {
          throw new Error("Secret is unavailable. Please try again.");
        }
        setForm({
          label: data.label ?? "",
          data: data.data ?? "",
          notes: data.notes ?? "",
        });
        setTouched({
          label: false,
          data: false,
          notes: false,
        });
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to load secret";
        setFetchError(message);
        toaster.create({
          type: "error",
          title: "Unable to load secret",
          description: message,
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [id, navigate, refreshIndex]);

  const errors = {
    label: form.label.trim() ? "" : "Label is required",
    data: form.data.trim() ? "" : "Secret value is required",
  };

  const isInvalid = {
    label: touched.label && !!errors.label,
    data: touched.data && !!errors.data,
  };

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) {
      toaster.create({
        type: "error",
        title: "Unable to update secret",
        description: "Secret identifier is missing.",
      });
      return;
    }

    setTouched((prev) => ({ ...prev, label: true, data: true }));

    if (errors.label || errors.data) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: { label: string; data: string; notes?: string } = {
        label: form.label.trim(),
        data: form.data,
      };
      const trimmedNotes = form.notes.trim();
      payload.notes = form.notes === "" ? "" : trimmedNotes;

      await apiFetch(`/api/secrets/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toaster.create({
        type: "success",
        title: "Secret updated",
        description: "Your changes have been saved.",
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update secret";
      toaster.create({
        type: "error",
        title: "Edit secret failed",
        description: message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container
      w="full"
      maxW={{ base: "100%", md: "600px" }}
      mx="auto"
      py={6}
    >
      <chakra.form onSubmit={handleSubmit} noValidate>
        <Stack gap={6}>
          <Stack gap={3}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              alignSelf="flex-start"
              display="inline-flex"
              gap="2"
              px="0"
            >
              <ArrowLeft size={18} />
              Back
            </Button>
            <Heading size="lg">Edit secret</Heading>
          </Stack>

          {loading ? (
            <Stack gap={3} align="center" py={10}>
              <Spinner />
              <Text color="fg.muted">Loading secret…</Text>
            </Stack>
          ) : fetchError ? (
            <Stack gap={4} align="center" textAlign="center" py={10}>
              <Text color="red.500" fontWeight="medium">
                {fetchError}
              </Text>
              <Stack direction={{ base: "column", sm: "row" }} gap={3}>
                <Button onClick={() => navigate("/dashboard", { replace: true })}>
                  Go to dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTouched({ label: false, data: false, notes: false });
                    setFetchError(null);
                    setRefreshIndex((count) => count + 1);
                  }}
                >
                  Retry
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Field.Root required invalid={isInvalid.label}>
                <Field.Label htmlFor="label">Label</Field.Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(event) => update("label", event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, label: true }))}
                  placeholder="e.g. Bank account"
                  disabled={submitting}
                />
                {isInvalid.label ? <Field.ErrorText>{errors.label}</Field.ErrorText> : null}
              </Field.Root>

              <Field.Root required invalid={isInvalid.data}>
                <Field.Label htmlFor="data">Secret</Field.Label>
                <Textarea
                  id="data"
                  value={form.data}
                  onChange={(event) => update("data", event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, data: true }))}
                  rows={6}
                  placeholder="Paste or type the secret value"
                  disabled={submitting}
                />
                {isInvalid.data ? <Field.ErrorText>{errors.data}</Field.ErrorText> : null}
              </Field.Root>

              <Field.Root>
                <Field.Label htmlFor="notes">Notes (optional)</Field.Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(event) => update("notes", event.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, notes: true }))}
                  rows={4}
                  placeholder="Add any context or instructions"
                  disabled={submitting}
                />
              </Field.Root>

              <Stack direction={{ base: "column", sm: "row" }} gap={3} justify="flex-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorPalette="teal"
                  disabled={submitting}
                  loading={submitting}
                  loadingText="Updating..."
                >
                  Update secret
                </Button>
              </Stack>
            </>
          )}
        </Stack>
      </chakra.form>
    </Container>
  );
}
