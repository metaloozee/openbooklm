import { redirect } from "next/navigation";

export default function NewProjectPage() {
	redirect("/dashboard?create=true");
}
