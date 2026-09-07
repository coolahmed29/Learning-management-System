/**
 * Custom render that wraps RTL's render with all app providers — Router,
 * QueryClientProvider, ThemeProvider, Redux Provider — so every test has
 * working context.
 */
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "../providers/ThemeProvider";
import authReducer from "../store/slices/authSlice";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  });
}

function createTestStore(preloadedState) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });
}

export function renderWithProviders(ui, options = {}) {
  const {
    route = "/",
    queryClient,
    store,
    preloadedState,
    ...renderOptions
  } = options;
  const testQueryClient = queryClient ?? createTestQueryClient();
  const testStore = store ?? createTestStore(preloadedState);

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        <QueryClientProvider client={testQueryClient}>
          <Provider store={testStore}>
            <ThemeProvider>{children}</ThemeProvider>
          </Provider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
