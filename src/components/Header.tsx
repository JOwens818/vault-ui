import * as React from "react";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  HStack,
  Heading,
  IconButton,
  DrawerPositioner,
  Stack,
  Text,
  Button,
} from "@chakra-ui/react";
import { useTheme as useNextTheme } from "next-themes";
import { Moon, Sun, UserCircle2, X } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export function Header() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <>
      <HStack
        as="header"
        justify="space-between"
        px={6}
        py={4}
        borderBottomWidth="1px"
        bg="bg.emphasized"
      >
        <Heading size="md">Vautly</Heading>

        <HStack gap={2}>
          <IconButton
            aria-label="Toggle theme"
            variant="ghost"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          >
            {isDark ? <Sun /> : <Moon />}
          </IconButton>

          {user ? (
            <IconButton
              aria-label="Open user menu"
              variant="ghost"
              onClick={() => setDrawerOpen(true)}
            >
              <UserCircle2 />
            </IconButton>
          ) : null}
        </HStack>
      </HStack>

      {user ? (
        <DrawerRoot
          placement="end"
          open={drawerOpen}
          onOpenChange={({ open }) => setDrawerOpen(open)}
        >
          <DrawerBackdrop />
          <DrawerPositioner>
            <DrawerContent>
              <DrawerHeader display="flex" alignItems="center" justifyContent="space-between">
                <DrawerTitle>Account</DrawerTitle>
                <DrawerCloseTrigger asChild>
                  <IconButton
                    aria-label="Close user menu"
                    variant="ghost"
                    size="sm"
                  >
                    <X size={16} />
                  </IconButton>
                </DrawerCloseTrigger>
              </DrawerHeader>
              <DrawerBody>
                <Stack gap={4}>
                  <Stack gap={1}>
                    <Text fontSize="sm" color="fg.muted">
                      Signed in as
                    </Text>
                    <Text fontWeight="medium">{user?.username ?? "Unknown user"}</Text>
                    {user?.email ? (
                      <Text fontSize="sm" color="fg.muted">
                        {user.email}
                      </Text>
                    ) : null}
                  </Stack>
                  <Button
                    variant="ghost"
                    color="red.500"
                    justifyContent="flex-start"
                    onClick={() => {
                      setDrawerOpen(false);
                      logout();
                    }}
                  >
                    Log out
                  </Button>
                </Stack>
              </DrawerBody>
            </DrawerContent>
          </DrawerPositioner>
        </DrawerRoot>
      ) : null}
    </>
  );
}
