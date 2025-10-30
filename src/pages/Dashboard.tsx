// src/pages/Dashboard.tsx
import * as React from "react";
import { Container, Heading, Stack } from "@chakra-ui/react";
import { useAuth } from "../auth/AuthContext";
import { SecretsList } from "../components/SecretsList";

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <Container 
      w="full"
      maxW={{ base: "100%", md: "800px" }}   // ✅ stretch full width on mobile
      mx="auto"  
      py={6}>
      <Stack gap={6}>
        <Heading size="lg">Welcome{user?.username ? `, ${user.username}` : ""}</Heading>
        <SecretsList />
      </Stack>
    </Container>
  );
}
