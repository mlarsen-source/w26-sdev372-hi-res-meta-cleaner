import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerPush = vi.fn();
const login = vi.fn();
const logout = vi.fn();
const setUser = vi.fn();

let authState = {
  user: null,
  login,
  logout,
  setUser,
  fetchWithAuth: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../app/components/AuthProvider", () => ({
  useAuth: () => authState,
}));

import LoginPage from "../app/login/page";
import RegisterPage from "../app/register/page";

function lastButton(name: string) {
  const buttons = screen.getAllByRole("button", { name });
  return buttons[buttons.length - 1];
}

describe("auth pages", () => {
  beforeEach(() => {
    authState = {
      user: null,
      login,
      logout,
      setUser,
      fetchWithAuth: vi.fn(),
    };
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("logs in and redirects home", async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user_id: 1,
        email: "jane@example.com",
        first_name: "Jane",
        last_name: "Doe",
      }),
    } as Response);

    // Act
    render(<LoginPage />);

    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "secret123" },
    });
    fireEvent.click(lastButton("Login"));

    // Assert
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        user_id: 1,
        email: "jane@example.com",
        first_name: "Jane",
        last_name: "Doe",
      });
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/login",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
    expect(routerPush).toHaveBeenCalledWith("/");
  });

  it("shows the login error from bad credentials", async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    // Act
    render(<LoginPage />);

    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(lastButton("Login"));

    // Assert
    expect(await screen.findByText("Invalid email or password")).toBeVisible();
    expect(login).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it("stops registration when passwords do not match", async () => {
    // Act
    render(<RegisterPage />);

    fireEvent.change(screen.getByTestId("firstname-input"), {
      target: { value: "Jane" },
    });
    fireEvent.change(screen.getByTestId("lastname-input"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(screen.getByTestId("password-input1"), {
      target: { value: "secret123" },
    });
    fireEvent.change(screen.getByTestId("password-input2"), {
      target: { value: "different123" },
    });
    fireEvent.click(lastButton("Register"));

    // Assert
    expect(await screen.findByText("Passwords do not match")).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });
});
