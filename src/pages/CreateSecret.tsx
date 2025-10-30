import * as React from "react";
import {
  Button,
  Container,
  Field,
  Heading,
  Input,
  Stack,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { toaster } from "../components/Toaster";

type FormState = {
  label: string;
  data: string;
  notes: string;
};

export default function CreateSecret() {
  const navigate = useNavigate();
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
  const [submitting, setSubmitting] = React.useState(false);

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
      const notesValue = form.notes.trim();
      if (notesValue) {
        payload.notes = notesValue;
      }

      await apiFetch("/api/secrets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toaster.create({
        type: "success",
        title: "Secret created",
        description: "You can view it from your dashboard.",
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create secret";
      toaster.create({
        type: "error",
        title: "Create secret failed",
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
            <Heading size="lg">Create a secret</Heading>
          </Stack>

          <Field.Root required invalid={isInvalid.label}>
            <Field.Label htmlFor="label">Label</Field.Label>
            <Input
              id="label"
              value={form.label}
              onChange={(event) => update("label", event.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, label: true }))}
              placeholder="e.g. Bank account"
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
              colorPalette="blue"
              disabled={submitting}
              loading={submitting}
              loadingText="Creating..."
            >
              Create secret
            </Button>
          </Stack>
        </Stack>
      </chakra.form>
    </Container>
  );
}
