/// <reference types="cypress" />

const testUser = {
  user_id: 1,
  email: "jane@example.com",
  first_name: "Jane",
  last_name: "Doe",
};

function visitSignedOut(path = "/") {
  cy.visit(path, {
    onBeforeLoad(win) {
      const appWindow = win as Window;
      appWindow.localStorage.removeItem("hires_meta_user");
    },
  });
}

function visitSignedIn(path = "/") {
  cy.visit(path, {
    onBeforeLoad(win) {
      const appWindow = win as Window;
      appWindow.localStorage.setItem("hires_meta_user", JSON.stringify(testUser));
    },
  });
}

describe("Home Page", () => {
  it("displays the header on load", () => {
    // Act
    visitSignedOut();

    // Assert
    cy.get("h1").should("be.visible").and("have.text", "Hi-Res Meta Cleaner");
  });

  it("shows the login prompt on home when signed out", () => {
    // Act
    visitSignedOut();

    // Assert
    cy.contains("Welcome to Hi-Res Meta Cleaner").should("be.visible");
    cy.contains("Please log in to upload and manage your audio files.").should(
      "be.visible"
    );
    cy.contains("button", "Go to Login").should("be.visible");
  });

  it("registers a user and redirects to login", () => {
    // Arrange
    cy.intercept("POST", "**/api/user", {
      statusCode: 201,
      body: {
        user_id: 2,
        email: "miku@example.com",
        first_name: "Miku",
        last_name: "Hatsune",
      },
    }).as("register");

    // Act
    visitSignedOut("/");
    cy.get("[data-testid='register-link']").click();

    cy.get("h2").should("have.text", "Register");
    cy.get('[data-testid="firstname-input"]').type("Miku");
    cy.get('[data-testid="lastname-input"]').type("Hatsune");
    cy.get('[data-testid="email-input"]').type("miku@example.com");
    cy.get('[data-testid="password-input1"]').type("leek86cecb");
    cy.get('[data-testid="password-input2"]').type("leek86cecb");
    cy.get("form.auth-form").contains("button", "Register").click();

    // Assert
    cy.wait("@register")
      .its("request.body")
      .should("deep.equal", {
        firstName: "Miku",
        lastName: "Hatsune",
        email: "miku@example.com",
        password: "leek86cecb",
      });
    cy.url().should("include", "/login");
    cy.get("h2").should("have.text", "Login");
  });

  it("logs in user and shows the greeting", () => {
    // Arrange
    cy.intercept("POST", "**/api/login", {
      statusCode: 200,
      body: testUser,
    }).as("login");

    // Act
    visitSignedOut("/login");
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type("secret123");
    cy.get("form.auth-form").contains("button", "Login").click();

    // Assert
    cy.wait("@login");
    cy.url().should("include", "/");
    cy.get(".user-greeting").should("be.visible").and("have.text", "Jane");
  });

  it("shows an error for a bad login", () => {
    // Arrange
    cy.intercept("POST", "**/api/login", {
      statusCode: 401,
      body: { error: "Invalid email or password" },
    }).as("login");

    // Act
    visitSignedOut("/login");
    cy.get('[data-testid="email-input"]').type("wrong@example.com");
    cy.get('[data-testid="password-input"]').type("wrongpass");
    cy.get("form.auth-form").contains("button", "Login").click();

    // Assert
    cy.wait("@login");
    cy.contains("Invalid email or password").should("be.visible");
    cy.url().should("include", "/login");
  });

  it("logs out user", () => {
    // Arrange
    cy.intercept("POST", "**/api/logout", {
      statusCode: 200,
      body: { message: "Logged out successfully" },
    }).as("logout");

    // Act
    visitSignedIn("/");
    cy.get(".user-greeting").should("be.visible").and("have.text", "Jane");
    cy.contains("button", "Logout").click();

    // Assert
    cy.wait("@logout");
    cy.url().should("include", "/login");
  });
});
