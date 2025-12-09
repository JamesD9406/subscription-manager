/**
 * Prisma error codes
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
export const PrismaError = {
  /** Unique constraint violation - occurs when trying to create/update a record with a duplicate unique field */
  UniqueConstraintViolation: 'P2002',
  /** Record not found - occurs when trying to update/delete a record that doesn't exist */
  RecordNotFound: 'P2025',
  /** Foreign key constraint violation - occurs when trying to create/update with invalid foreign key */
  ForeignKeyViolation: 'P2003',
  /** Constraint failed on the database */
  ConstraintFailed: 'P2004',
} as const;

export function isPrismaError(error: unknown): error is { code: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  );
}