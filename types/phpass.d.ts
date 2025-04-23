declare module "phpass" {
  class PasswordHash {
    constructor(iteration_count_log2?: number, portable_hashes?: boolean);
    checkPassword(password: string, hashedPassword: string): boolean;
    hashPassword(password: string): string;
  }

  export { PasswordHash };
}

