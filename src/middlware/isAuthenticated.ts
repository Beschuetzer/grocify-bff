import { ERROR_MSG_NOT_AUTHORIZED } from "../constants";
import { comparePasswords, getErrorMessage } from "../helpers";

export async function checkIsAuthorized (currentPassword: string, hashedPassword: string) {
    return new Promise<boolean>((resolve, reject) => {
        comparePasswords(currentPassword, hashedPassword, (_, arePasswordsMatching) => {
            try {
                if (!arePasswordsMatching) {
                    throw getErrorMessage(ERROR_MSG_NOT_AUTHORIZED);
                }
                resolve(true);
            } catch (error) {
                reject(error);
            }
        })
    })
}