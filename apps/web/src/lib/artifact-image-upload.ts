type ArtifactImageUploader = (options: {
	file: File;
	onProgress: (value: { loaded: number; total: number }) => void;
}) => Promise<string>;

type ArtifactImageUploaderOptions = {
	projectId: string;
	artifactId: string;
};

export function createArtifactImageUploader(
	options: ArtifactImageUploaderOptions,
): ArtifactImageUploader {
	return async ({ file, onProgress }) => {
		void file;
		void onProgress;
		void options;

		throw new Error("Artifact image upload is not implemented yet.");
	};
}
