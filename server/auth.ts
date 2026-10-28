import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Role } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'gtra-church-secret-key-edwaleni-2026-secure';

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(user: User, permissions: string[]): string {
  return jwt.sign(
    {
      userId: user.id,
      loginIdentifier: user.loginIdentifier,
      name: user.name,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
      status: user.status,
      permissions,
      assignments: user.departmentAssignments
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * GTRA Staff Login Email Convention:
 * Initial + Surname + @domain
 * Example: Fika Siximba in System Administrator category -> fSiximba@system-gtra.org
 * Handles duplicates safely by appending numeric suffix (e.g., fSiximba1@system-gtra.org).
 */
export function generateStaffIdentifier(
  firstName: string,
  lastName: string,
  categoryDomain: string,
  existingUsers: User[],
  currentUserId?: string
): string {
  const cleanFirst = firstName.trim().replace(/[^a-zA-Z]/g, '');
  const cleanLast = lastName.trim().replace(/[^a-zA-Z]/g, '');

  if (!cleanFirst || !cleanLast) {
    throw new Error('Valid first name and surname are required to generate staff identifier.');
  }

  const initial = cleanFirst.charAt(0).toLowerCase();
  // Capitalize first letter of surname, remainder as original or lowercase
  const formattedSurname = cleanLast.charAt(0).toUpperCase() + cleanLast.slice(1);
  const basePrefix = `${initial}${formattedSurname}`;

  const cleanDomain = categoryDomain.trim().toLowerCase().replace(/^@/, '');
  const baseIdentifier = `${basePrefix}@${cleanDomain}`;

  // Check if baseIdentifier already exists for another user
  const isTaken = (ident: string) => {
    return existingUsers.some(
      (u) =>
        u.id !== currentUserId &&
        u.loginIdentifier.toLowerCase() === ident.toLowerCase()
    );
  };

  if (!isTaken(baseIdentifier)) {
    return baseIdentifier;
  }

  // Generate unique variant
  let counter = 1;
  while (counter < 1000) {
    const candidate = `${basePrefix}${counter}@${cleanDomain}`;
    if (!isTaken(candidate)) {
      return candidate;
    }
    counter++;
  }

  return `${basePrefix}_${Date.now()}@${cleanDomain}`;
}

/**
 * Resolves all distinct permissions granted to a user across all their assigned roles.
 */
export function resolveUserPermissions(user: User, rolesList: Role[]): string[] {
  const permSet = new Set<string>();

  for (const assign of user.departmentAssignments || []) {
    const role = rolesList.find((r) => r.id === assign.roleId);
    if (role) {
      for (const p of role.permissions) {
        permSet.add(p);
      }
    }
  }

  return Array.from(permSet);
}
