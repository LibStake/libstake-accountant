import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/guard";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  if (await getSession()) redirect("/");
  return <SignupForm />;
}
