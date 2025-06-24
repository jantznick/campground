# Implementation Plan: Magic Link Authentication

This document tracks the implementation of the passwordless magic link login feature.

## 1. Database Schema (`packages/api/prisma/schema.prisma`)

- [x] Create `LoginToken` Model
    - [x] `id`: UUID, primary key
    - [x] `token`: String, unique. Stores the hashed token.
    - [x] `userId`: String, relation to User.
    - [x] `user`: Relation to User model.
    - [x] `expiresAt`: DateTime.
    - [x] `createdAt`: DateTime, default now.
    - [x] `usedAt`: DateTime, optional.

## 2. Backend API (`packages/api`)

- [x] **Create Endpoints in `packages/api/src/routes/auth.js`**
    - [x] `POST /api/v1/auth/magic-link`: Handles token generation and sending the email.
    - [x] `POST /api/v1/auth/magic-link/verify`: Handles token verification and user login.
- [x] **Create Email Template in `packages/emails/emails/`**
    - [x] Create `MagicLinkLogin.jsx` email component.
    - [x] Integrate with Resend to send the email from the `magic-link` endpoint.

## 3. Frontend Application (`packages/web`)

- [x] **Update Login Page (`src/pages/LoginPage.jsx`)**
    - [x] Add UI for requesting a magic link.
    - [x] Add state to show a confirmation message after the link is requested.
- [x] **Create Verification Page (`src/pages/MagicLinkVerifyPage.jsx`)**
    - [x] Create a new page component to handle the token from the URL.
    - [x] This page will call the verify endpoint and handle success/error states.
- [x] **Add New Route (`src/App.jsx`)**
    - [x] Add a route for `/login/verify` to the main router. 