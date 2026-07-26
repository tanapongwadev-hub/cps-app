import { redirect } from "next/navigation";

export default function RootPage() {
  // Send users to login (which will bounce to dashboard if already authed)
  redirect("/login");
}
