// src/pages/Dashboard.tsx
import * as React from 'react';
import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <Container py={10}>
        <Text>Loading user info...</Text>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container py={10}>
        <Text>No user data found.</Text>
      </Container>
    );
  }

  return (
    <Container py={10}>
      <Box p={6} borderWidth="1px" borderRadius="xl" bg="bg.subtle" maxW="md" mx="auto">
        <Heading size="md" mb={4} textAlign="center">
          Dashboard
        </Heading>

        <Stack gap={3}>
          <Text>
            <strong>Username:</strong> {user.username}
          </Text>
          <Text>
            <strong>Email:</strong> {user.email}
          </Text>
          <Text>
            <strong>User ID:</strong> {user.id}
          </Text>
        </Stack>

        <Button mt={6} colorPalette="red" onClick={logout} width="full">
          Logout
        </Button>
      </Box>
    </Container>
  );
}
