/**
 * Avatar options for user profile selection.
 * Images are stored in /public/avatars/
 */

export interface AvatarOption {
  id: string;
  label: string;
}

/**
 * Available avatars - 15 unique characters + 15 professions
 */
export const AVATARS: AvatarOption[] = [
  // Unique Characters (1-15)
  { id: 'avatar-01', label: 'Einstein' },
  { id: 'avatar-02', label: 'Freddie Mercury' },
  { id: 'avatar-03', label: 'Charlie Chaplin' },
  { id: 'avatar-04', label: 'Salvador Dali' },
  { id: 'avatar-05', label: 'Steve Jobs' },
  { id: 'avatar-06', label: 'Sherlock Holmes' },
  { id: 'avatar-07', label: 'Elvis Presley' },
  { id: 'avatar-08', label: 'Isaac Newton' },
  { id: 'avatar-09', label: 'Nicola Tesla' },
  { id: 'avatar-10', label: 'Elon Musk' },
  { id: 'avatar-11', label: 'Oprah Winfrey' },
  { id: 'avatar-12', label: 'Mohammad Ali' },
  { id: 'avatar-13', label: 'Slash' },
  { id: 'avatar-14', label: 'Shigeru Miyamoto' },
  { id: 'avatar-15', label: 'Oppenheimer' },
  // Profession Characters (16-30)
  { id: 'avatar-16', label: 'Scientifique' },
  { id: 'avatar-17', label: 'Programmeur' },
  { id: 'avatar-18', label: 'Peintre' },
  { id: 'avatar-19', label: 'Astronaute' },
  { id: 'avatar-20', label: 'Footballeur' },
  { id: 'avatar-21', label: 'PDG' },
  { id: 'avatar-22', label: 'Pilote' },
  { id: 'avatar-23', label: 'Médecin' },
  { id: 'avatar-24', label: 'Infirmière' },
  { id: 'avatar-25', label: 'Professeur' },
  { id: 'avatar-26', label: 'Chef cuisinier' },
  { id: 'avatar-27', label: 'Pompier' },
  { id: 'avatar-28', label: 'Policier' },
  { id: 'avatar-29', label: 'Enseignant' },
  { id: 'avatar-30', label: 'Agriculteur' },
];

/**
 * Set of valid avatar IDs for validation
 */
export const AVATAR_IDS = new Set(AVATARS.map((a) => a.id));

/**
 * Check if an avatar ID is valid
 */
export function isValidAvatarId(id: string | null | undefined): boolean {
  return id != null && AVATAR_IDS.has(id);
}

/**
 * Get avatar label by ID
 */
export function getAvatarLabel(id: string): string {
  const avatar = AVATARS.find((a) => a.id === id);
  return avatar?.label ?? id;
}

/**
 * Get avatar image path
 */
export function getAvatarPath(id: string): string {
  return `/avatars/${id}.png`;
}
