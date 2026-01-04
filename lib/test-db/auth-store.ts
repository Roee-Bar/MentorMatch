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
    // #region agent log
    const logData = {location:'lib/test-db/auth-store.ts:109',message:'createCustomToken called',data:{uid,hasUser:!!this.getUser(uid),processId:process.pid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'};
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    // #endregion
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
    // #region agent log
    const logData2 = {location:'lib/test-db/auth-store.ts:127',message:'createCustomToken completed',data:{uid,tokenLength:token.length,tokenCount:this.tokens.size},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'};
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
    // #endregion
    return token;
  }

  /**
   * Verify a custom token
   */
  verifyToken(token: string): AuthToken | null {
    // #region agent log
    const logData = {location:'lib/test-db/auth-store.ts:132',message:'verifyToken called',data:{tokenLength:token.length,tokenCount:this.tokens.size,hasToken:this.tokens.has(token),processId:process.pid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'};
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    // #endregion
    const authToken = this.tokens.get(token);
    if (!authToken) {
      // #region agent log
      const logData2 = {location:'lib/test-db/auth-store.ts:138',message:'verifyToken - token not found',data:{tokenLength:token.length,tokenCount:this.tokens.size,processId:process.pid},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'};
      fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
      // #endregion
      return null;
    }
    
    if (Date.now() > authToken.expiresAt) {
      this.tokens.delete(token);
      return null;
    }

    // #region agent log
    const logData3 = {location:'lib/test-db/auth-store.ts:147',message:'verifyToken - token found',data:{uid:authToken.uid,email:authToken.email},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'D'};
    fetch('http://127.0.0.1:7243/ingest/b58b9ea6-ea87-472c-b297-772b0ab30cc5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
    // #endregion
    return authToken;
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

