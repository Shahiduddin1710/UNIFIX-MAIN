import { auth } from "@/firebase/firebaseConfig";

export async function getAdminToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return await user.getIdToken();
}