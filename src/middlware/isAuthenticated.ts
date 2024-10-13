import { ERROR_MSG_NOT_AUTHORIZED } from '../constants';
import { comparePasswords, getErrorMessage } from '../helpers';

/**
 *Assumption is that if a user account has been created for the user, the user has paid
 **/
export async function checkIsAuthorized(
  currentPassword?: string,
  hashedPassword?: string
) {
  if (!currentPassword) {
    throw new Error('No current password given in checkIsAuthorized().');
  }
  if (!hashedPassword) {
    throw new Error('No hashed password given in checkIsAuthorized().');
  }
  return new Promise<boolean>((resolve, reject) => {
    comparePasswords(
      currentPassword,
      hashedPassword,
      (_, arePasswordsMatching) => {
        try {
          if (!arePasswordsMatching) {
            throw getErrorMessage(ERROR_MSG_NOT_AUTHORIZED);
          }
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
