// src/pages/Dashboard.tsx
import * as React from "react";
import { Button, Container, Heading, Stack } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SecretsList } from "../components/SecretsList";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  return (
    <Container 
      w="full"
      maxW={{ base: "100%", md: "800px" }}   // ✅ stretch full width on mobile
      mx="auto"  
      py={6}>
      <Stack gap={6}>
        <Stack
          direction={{ base: "column", sm: "row" }}
          align={{ base: "flex-start", sm: "center" }}
          justify="space-between"
          gap={3}
        >
          <Heading size="lg">Welcome{user?.username ? `, ${user.username}` : ""}</Heading>
          <Button
            onClick={() => navigate("/secrets/new")}
            w={{ base: "full", sm: "auto" }}
            display="inline-flex"
            gap="2"
            colorPalette="blue"
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
