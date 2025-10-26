import { HStack, Heading, IconButton } from '@chakra-ui/react';
import { useTheme as useNextTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function Header() {
  const { resolvedTheme, setTheme } = useNextTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <HStack as="header" justify="space-between" px={6} py={4} borderBottomWidth="1px" bg="bg.emphasized">
      <Heading size="md">My App</Heading>

      <IconButton aria-label="Toggle theme" variant="ghost" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
        {isDark ? <Sun /> : <Moon />}
      </IconButton>
    </HStack>
  );
}
