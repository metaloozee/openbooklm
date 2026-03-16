import LoginCard from "@/components/login-card";
import { redirectIfAuthenticated } from "@/lib/auth-guard";

export default async function LoginPage() {
	await redirectIfAuthenticated();

	return <LoginCard />;
}
