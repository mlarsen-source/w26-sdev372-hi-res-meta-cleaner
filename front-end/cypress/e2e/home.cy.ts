import { register } from "module";

describe("Home Page", () => {
    beforeEach(() => { cy.visit("/") });

    it("displays the header on load", () => {
        cy.get("h1").should("be.visible");
        cy.get("h1").should("have.text", "Hi-Res Meta Cleaner");
    });

    //After running this test, restart backend since a user can only register once
    it("registering users", () => {
        cy.get("nav").should("be.visible");
        cy.get("[data-testid='login-link']").should("be.visible");
        cy.get("[data-testid='login-link']").should("have.text", "Login");
        cy.get("[data-testid='register-link']").should("be.visible");
        cy.get("[data-testid='register-link']").should("have.text", "Register");

        cy.get("a[href='/register']").click()
        cy.url().should("include", "/register");
        cy.get("h2").should("be.visible", "Register");

        cy.get('[data-testid="firstname-input"]').should("be.visible");
        cy.get('[data-testid="firstname-input"]').type("Miku");
        cy.get('[data-testid="lastname-input"]').should("be.visible");
        cy.get('[data-testid="lastname-input"]').type("Hatsune");
        cy.get('[data-testid="email-input"]').should("be.visible");
        cy.get('[data-testid="email-input"]').type("HatsuneMiku39@vmail.com");
        cy.get('[data-testid="password-input1"]').should("be.visible");
        cy.get('[data-testid="password-input1"]').type("leek86cecb");
        cy.get('[data-testid="password-input2"]').should("be.visible");
        cy.get('[data-testid="password-input2"]').type("leek86cecb");

        cy.get('[class="submit-button"]').should("be.visible");
        cy.get('[class="submit-button"]').should("have.text", "Register");
        cy.get("[class='submit-button']").click()

        cy.url().should("include", "/login");
        cy.get("h2").should("be.visible", "Login");

        cy.get('[data-testid="email-input"]').should("be.visible");
        cy.get('[data-testid="email-input"]').type("HatsuneMiku39@vmail.com");
        cy.get('[data-testid="password-input"]').should("be.visible");
        cy.get('[data-testid="password-input"]').type("leek86cecb");

        cy.get('[class="submit-button"]').should("be.visible");
        cy.get('[class="submit-button"]').should("have.text", "Login");
        cy.get("[class='submit-button']").click()

        cy.url().should("include", "/");
        cy.get("[class='user-greeting']").should("be.visible")
        cy.get("[class='user-greeting']").should("have.text", "Miku");
    });

    it("log in user", () => {
        cy.get("[data-testid='login-link']").should("be.visible");
        cy.get("[data-testid='login-link']").should("have.text", "Login");
        cy.get("a[href='/login']").click()

        cy.url().should("include", "/login");
        cy.get("h2").should("be.visible", "Login");

        cy.get('[data-testid="email-input"]').should("be.visible");
        cy.get('[data-testid="email-input"]').type("HatsuneMiku39@vmail.com");
        cy.get('[data-testid="password-input"]').should("be.visible");
        cy.get('[data-testid="password-input"]').type("leek86cecb");

        cy.get('[class="submit-button"]').should("be.visible");
        cy.get('[class="submit-button"]').should("have.text", "Login");
        cy.get("[class='submit-button']").click()

        cy.url().should("include", "/");
        cy.get("[class='user-greeting']").should("be.visible")
        cy.get("[class='user-greeting']").should("have.text", "Miku");
    })

});