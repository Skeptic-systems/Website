export type UserRole = "owner" | "admin" | "member";

export type AuthenticatedProfile = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};





