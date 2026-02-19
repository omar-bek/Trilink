import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { NotificationProvider } from '@/components/Notification/NotificationProvider';

// Create a test theme
const theme = createTheme();

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
  withRouter?: boolean;
  withNotifications?: boolean;
}

/**
 * Enhanced render function with all providers
 */
const AllTheProviders = ({
  children,
  queryClient,
  initialEntries,
  withRouter = true,
  withNotifications = true,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
  initialEntries?: string[];
  withRouter?: boolean;
  withNotifications?: boolean;
}) => {
  const Router = withRouter
    ? initialEntries
      ? ({ children }: { children: React.ReactNode }) => (
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        )
      : BrowserRouter
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  let content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>{children}</Router>
      </ThemeProvider>
    </QueryClientProvider>
  );

  if (withNotifications) {
    content = <NotificationProvider>{content}</NotificationProvider>;
  }

  return content;
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const {
    initialEntries,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    withRouter = true,
    withNotifications = true,
    ...renderOptions
  } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        queryClient={queryClient}
        initialEntries={initialEntries}
        withRouter={withRouter}
        withNotifications={withNotifications}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

export * from '@testing-library/react';
export { customRender as render };
