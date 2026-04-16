export function formatPrimaryGoal(value: string) {
  switch (String(value || '').toUpperCase()) {
    case 'FAT_LOSS':
      return 'Fat loss';
    case 'MUSCLE_GAIN':
      return 'Muscle gain';
    case 'STRENGTH':
      return 'Strength';
    case 'MAINTENANCE':
    default:
      return 'Maintenance';
  }
}
