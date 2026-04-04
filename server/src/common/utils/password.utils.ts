import * as bcrypt from 'bcrypt';

import { BCRYPT_SALT_ROUNDS } from '@/constants/auth.constants';

/**
 * Hashes a plain text password using bcrypt.
 * @param password - The plain text password to hash.
 * @returns A promise that resolves to the hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compares a plain text password with a stored hash.
 * @param password - The plain text password provided by the user.
 * @param hash - The hashed password stored in the database.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
