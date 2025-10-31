// src/pages/Dashboard.tsx
import * as React from "react";
import { Button, Container, Stack } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SecretsList } from "../components/SecretsList";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <Container 
      w="full"
      maxW={{ base: "100%", md: "800px" }}   // ✅ stretch full width on mobile
      mx="auto"  
      py={6}>
      <Stack gap={6}>
        <Stack direction="row" justify="flex-end" align="center" w="full">
          <Button
            onClick={() => navigate("/secrets/new")}
            display="inline-flex"
            gap="2"
            colorPalette="teal"
            variant="solid"
            w={{ base: "full", md: "auto" }}
          >
            <Plus size={16} />
            Create secret
          </Button>
        </Stack>
        <SecretsList />
      </Stack>
    </Container>
  );
}
