// Extended profile type based on schema-from-be User type
// Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  public_id?: string | null;
  university?: string;
  major?: string;
  cvUrl?: string | null;
  cv_public_id?: string | null;
  createdAt?: string;
}
