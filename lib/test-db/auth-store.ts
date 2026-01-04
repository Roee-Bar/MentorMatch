/**
 * In-Memory Auth Store
 * 
 * Simple authentication store for E2E tests.
 * Mimics Firebase Auth functionality.
 */

import { testDatabase } from './index';

export interface AuthUser {
  uid: string;
  email: string;
  password: string;
  displayName?: string;
  emailVerified: boolean;
  createdAt: Date;
  customClaims?: Record<string, any>;
}

export interface AuthToken {
  uid: string;
  email: string;
  claims: Record<string, any>;
  issuedAt: number;
  expiresAt: number;
}

export class InMemoryAuthStore {
  private users: Map<string, AuthUser> = new Map();
  private tokens: Map<string, AuthToken> = new Map();
  private emailToUid: Map<string, string> = new Map();

  /**
   * Create a new user
   */
  createUser(data: {
    email: string;
    password: string;
    displayName?: string;
    emailVerified?: boolean;
    uid?: string;
  }): AuthUser {
    const uid = data.uid || this.generateUid();
    
    if (this.emailToUid.has(data.email)) {
      throw new Error(`User with email ${data.email} already exists`);
    }

    const user: AuthUser = {
      uid,
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      emailVerified: data.emailVerified ?? true,
      createdAt: new Date(),
    };

    this.users.set(uid, user);
    this.emailToUid.set(data.email, uid);
    return user;
  }

  /**
   * Get user by UID
   */
  getUser(uid: string): AuthUser | null {
    return this.users.get(uid) || null;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): AuthUser | null {
    const uid = this.emailToUid.get(email);
    if (!uid) return null;
    return this.getUser(uid);
  }

  /**
   * Delete a user
   */
  deleteUser(uid: string): void {
    const user = this.users.get(uid);
    if (user) {
      this.users.delete(uid);
      this.emailToUid.delete(user.email);
      // Clean up tokens
      for (const [token, authToken] of Array.from(this.tokens.entries())) {
        if (authToken.uid === uid) {
          this.tokens.delete(token);
        }
      }
    }
  }

  /**
   * Verify password
   */
  verifyPassword(email: string, password: string): AuthUser | null {
    const user = this.getUserByEmail(email);
    if (!user) return null;
    if (user.password !== password) return null;
    return user;
  }

  /**
   * Create a custom token (for testing)
   */
  createCustomToken(uid: string, claims?: Record<string, any>): string {
    const user = this.getUser(uid);
    if (!user) {
      throw new Error(`User ${uid} not found`);
    }

    const token = this.generateToken();
    const now = Date.now();
    const authToken: AuthToken = {
      uid,
      email: user.email,
      claims: claims || {},
      issuedAt: now,
      expiresAt: now + 3600000, // 1 hour
    };

    this.tokens.set(token, authToken);
    return token;
  }

  /**
   * Verify a custom token
   */
  verifyToken(token: string): AuthToken | null {
    const authToken = this.tokens.get(token);
    if (!authToken) {
      return null;
    }
    
    if (Date.now() > authToken.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    return authToken;
  }

  /**
   * Update user properties
   */
  updateUser(uid: string, updates: Partial<AuthUser>): void {
    const user = this.getUser(uid);
    if (!user) {
      throw new Error(`User ${uid} not found`);
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(uid, updatedUser);
  }

  /**
   * Set custom claims for a user
   */
  setCustomClaims(uid: string, claims: Record<string, any>): void {
    const user = this.getUser(uid);
    if (!user) {
      throw new Error(`User ${uid} not found`);
    }
    user.customClaims = { ...user.customClaims, ...claims };
    this.users.set(uid, user);
  }

  /**
   * List all users
   */
  listUsers(): AuthUser[] {
    return Array.from(this.users.values());
  }

  /**
   * Clear all users and tokens
   */
  clear(): void {
    this.users.clear();
    this.tokens.clear();
    this.emailToUid.clear();
  }

  /**
   * Generate a UID
   */
  private generateUid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 28; i++) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uid;
  }

  /**
   * Generate a token
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 100; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

// Singleton instance - use global to ensure single instance across Next.js module boundaries
const globalForAuthStore = global as unknown as { testAuthStore: InMemoryAuthStore | undefined };

if (!globalForAuthStore.testAuthStore) {
  globalForAuthStore.testAuthStore = new InMemoryAuthStore();
}

export const testAuthStore = globalForAuthStore.testAuthStore;

