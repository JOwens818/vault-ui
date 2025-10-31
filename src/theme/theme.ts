import { createSystem, defaultConfig } from '@chakra-ui/react';

export const system = createSystem(defaultConfig, {
  theme: {
    tokens: {
      // add tokens as needed, values are wrapped in { value: ... }
      colors: {
        brand: {
          50: { value: '#eef6ff' },
          500: { value: '#3b82f6' },
          900: { value: '#0b1220' }
        }
      },
      fonts: {
        heading: { value: 'Inter, system-ui, sans-serif' },
        body: { value: 'Inter, system-ui, sans-serif' }
      }
    },
    recipes: {
      input: {
        variants: {
          size: {
            sm: {
              textStyle: 'md'
            },
            md: {
              textStyle: 'md'
            }
          }
        }
      },
      textarea: {
        variants: {
          size: {
            sm: {
              textStyle: 'md'
            },
            md: {
              textStyle: 'md'
            }
          }
        }
      }
    }
  }
});
