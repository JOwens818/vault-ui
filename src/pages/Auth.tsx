// src/pages/Auth.tsx
import * as React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Box, Button, Container, Heading, Input, Stack, Text, Tabs } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../lib/api';
import { setCookie } from '../lib/cookies';
import { toaster } from '../components/Toaster';

// ---------- validation ----------
const loginSchema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required')
});
type LoginData = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  username: z.string().min(3, 'Min 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters')
});
type SignupData = z.infer<typeof signupSchema>;

// API response shape (same as /login)
type LoginResponse = {
  token: string;
  username: string;
  id: string;
  email: string;
};

// ---------- helpers ----------
function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'Unexpected error';
  }
}

type NavState = { from?: { pathname: string } };

export default function Auth() {
  const { login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  // Deep-link: /auth?tab=signup
  const initialTab: 'login' | 'signup' = params.get('tab') === 'signup' ? 'signup' : 'login';

  // Safely read state.from if present
  const state = (location.state ?? null) as NavState | null;
  const from = state?.from?.pathname ?? '/dashboard';

  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupData>({ resolver: zodResolver(signupSchema) });

  // ----- handlers -----
  const onLoginSubmit = loginForm.handleSubmit(async (data) => {
    try {
      await login({ username: data.username, password: data.password });
      toaster.create({ type: 'success', title: 'Welcome back!' });
      navigate(from, { replace: true });
    } catch (e: unknown) {
      toaster.create({
        type: 'error',
        title: 'Login failed',
        description: getErrorMessage(e)
      });
    }
  });

  const onSignupSubmit = signupForm.handleSubmit(async (data) => {
    try {
      // Register → returns same payload as /login
      const res = await apiFetch<LoginResponse>('/api/users/register', {
        method: 'POST',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          email: data.email
        })
      });

      if (!res) {
        throw new Error('No response from server. Please try again.');
      }

      // Store JWT cookie; then bootstrap user via /user-info
      setCookie('token', res.token, {
        maxAge: 60 * 60 * 24,
        sameSite: 'Lax',
        secure: globalThis.location.protocol === 'https:',
        path: '/'
      });

      await refreshUser();
      toaster.create({
        type: 'success',
        title: 'Account created',
        description: "You're all set!"
      });
      navigate(from, { replace: true });
    } catch (e: unknown) {
      toaster.create({
        type: 'error',
        title: 'Sign up failed',
        description: getErrorMessage(e)
      });
    }
  });

  return (
    <Container py={10}>
      <Box p={6} borderWidth="1px" borderRadius="xl" bg="bg.muted" maxW="md" mx="auto">
        <Heading size="md" mb={4} textAlign="center">
          Welcome
        </Heading>

        <Tabs.Root defaultValue={initialTab}>
          <Tabs.List mb={4}>
            <Tabs.Trigger value="login">Log in</Tabs.Trigger>
            <Tabs.Trigger value="signup">Sign up</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="login">
            <form onSubmit={onLoginSubmit}>
              <Stack gap={3}>
                <Input placeholder="Username" autoComplete="username" variant="flushed" {...loginForm.register('username')} />
                {loginForm.formState.errors.username && (
                  <Text color="red.500" fontSize="sm">
                    {loginForm.formState.errors.username.message}
                  </Text>
                )}

                <Input placeholder="Password" type="password" autoComplete="current-password" variant="flushed" {...loginForm.register('password')} />
                {loginForm.formState.errors.password && (
                  <Text color="red.500" fontSize="sm">
                    {loginForm.formState.errors.password.message}
                  </Text>
                )}

                <Button type="submit" colorPalette="blue" loading={loginForm.formState.isSubmitting}>
                  Continue
                </Button>
              </Stack>
            </form>
          </Tabs.Content>

          <Tabs.Content value="signup">
            <form onSubmit={onSignupSubmit}>
              <Stack gap={3}>
                <Input placeholder="Username" autoComplete="username" variant="flushed" {...signupForm.register('username')} />
                {signupForm.formState.errors.username && (
                  <Text color="red.500" fontSize="sm">
                    {signupForm.formState.errors.username.message}
                  </Text>
                )}

                <Input placeholder="Email" type="email" autoComplete="email" variant="flushed" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && (
                  <Text color="red.500" fontSize="sm">
                    {signupForm.formState.errors.email.message}
                  </Text>
                )}

                <Input placeholder="Create a password" type="password" autoComplete="new-password" variant="flushed" {...signupForm.register('password')} />
                {signupForm.formState.errors.password && (
                  <Text color="red.500" fontSize="sm">
                    {signupForm.formState.errors.password.message}
                  </Text>
                )}

                <Button type="submit" colorPalette="blue" loading={signupForm.formState.isSubmitting}>
                  Create account
                </Button>
              </Stack>
            </form>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Container>
  );
}
