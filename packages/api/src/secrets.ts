import { env } from "@openbooklm/env/server";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const ENCRYPTION_PREFIX = "enc:v1";

function getEncryptionKey() {
	return createHash("sha256").update(env.BETTER_AUTH_SECRET).digest();
}

export function encryptSecret(value: string) {
	const initializationVector = randomBytes(12);
	const cipher = createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), initializationVector);
	const encryptedValue = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return [
		ENCRYPTION_PREFIX,
		initializationVector.toString("base64url"),
		authTag.toString("base64url"),
		encryptedValue.toString("base64url"),
	].join(".");
}

export function decryptSecret(value: string) {
	if (!value.startsWith(`${ENCRYPTION_PREFIX}.`)) {
		return value;
	}

	const [, iv, authTag, encryptedValue] = value.split(".");

	if (!iv || !authTag || !encryptedValue) {
		throw new Error("Encrypted secret is malformed.");
	}

	const decipher = createDecipheriv(
		ENCRYPTION_ALGORITHM,
		getEncryptionKey(),
		Buffer.from(iv, "base64url"),
	);
	decipher.setAuthTag(Buffer.from(authTag, "base64url"));

	return Buffer.concat([
		decipher.update(Buffer.from(encryptedValue, "base64url")),
		decipher.final(),
	]).toString("utf8");
}
