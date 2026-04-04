export interface User {
  readonly mbrId: number;
  readonly name: string;
}

export interface RawUser {
  readonly mbr_id: number;
  readonly name: string;
}

/**
 * Transforms a name from "Lastname, Firstname" format to "Firstname Lastname".
 * If the name doesn't contain a comma, returns it unchanged.
 */
export function formatDisplayName(name: string): string {
  if (!name.includes(',')) {
    return name;
  }

  const [lastName, firstName] = name.split(',').map((part) => part.trim());
  if (!firstName) {
    return lastName;
  }

  return `${firstName} ${lastName}`;
}

export function mapRawUser(raw: RawUser): User {
  return {
    mbrId: raw.mbr_id,
    name: formatDisplayName(raw.name),
  };
}
