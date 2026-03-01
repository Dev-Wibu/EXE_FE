export interface MentorProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  public_id?: string | null;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
  rate?: number;
  identityImg?: string | null;
  public_id_identity?: string | null;
  degreeImg?: string | null;
  public_id_degree?: string | null;
  otherFile?: string | null;
  public_id_other?: string | null;
  totalSession?: number;
  active?: boolean;
  createdAt?: string;
}
