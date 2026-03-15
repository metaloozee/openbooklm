import { Spinner as SpinnerPrimitive } from "@openbooklm/ui/components/spinner";

export default function Spinner() {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<SpinnerPrimitive size="lg" />
		</div>
	);
}
