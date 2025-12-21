/**
 * Avatar options for user profile selection.
 * Images are stored in /public/avatars/
 */

export interface AvatarOption {
  id: string;
  label: string;
}

/**
 * Available avatars - 54 unique characters and professions
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
  // Additional Characters (31-42)
  { id: 'avatar-31', label: 'Paul McCartney' },
  { id: 'avatar-32', label: 'Wes Anderson' },
  { id: 'avatar-33', label: 'Marilyn Monroe' },
  { id: 'avatar-34', label: 'LeBron James' },
  { id: 'avatar-35', label: 'Taylor Swift' },
  { id: 'avatar-36', label: 'Lionel Messi' },
  { id: 'avatar-37', label: 'Angela Merkel' },
  { id: 'avatar-38', label: 'Hideo Kojima' },
  { id: 'avatar-39', label: 'Malala Yousafzai' },
  { id: 'avatar-40', label: 'Pape François' },
  { id: 'avatar-41', label: 'Daft Punk 1' },
  { id: 'avatar-42', label: 'Daft Punk 2' },
  // Additional Professions (43-50)
  { id: 'avatar-43', label: 'Militaire' },
  { id: 'avatar-44', label: 'Astronaute 2' },
  { id: 'avatar-45', label: 'Archéologue' },
  { id: 'avatar-46', label: 'Marin' },
  { id: 'avatar-47', label: 'Scientifique F' },
  { id: 'avatar-48', label: 'Programmeuse' },
  { id: 'avatar-49', label: 'Médecin F' },
  { id: 'avatar-50', label: 'Policière' },
  // General Characters (51-54)
  { id: 'avatar-51', label: 'Personnage Bleu' },
  { id: 'avatar-52', label: 'Personnage Vert' },
  { id: 'avatar-53', label: 'Personnage Violet' },
  { id: 'avatar-54', label: 'Personnage Rouge' },
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

/**
 * Get a random avatar ID from the available avatars
 * Optionally exclude avatars that are already in use
 */
export function getRandomAvatarId(excludeIds?: string[]): string {
  const available = excludeIds
    ? AVATARS.filter((a) => !excludeIds.includes(a.id))
    : AVATARS;

  // If all avatars are in use, just pick any random one
  const pool = available.length > 0 ? available : AVATARS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex].id;
}

/**
 * Total number of available avatars
 */
export const AVATAR_COUNT = AVATARS.length;
