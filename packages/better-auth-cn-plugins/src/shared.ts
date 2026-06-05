import type { GenericOAuthConfig } from "better-auth/plugins/generic-oauth";

export type ProviderBaseOptions = Pick<
	GenericOAuthConfig,
	| "clientId"
	| "clientSecret"
	| "disableImplicitSignUp"
	| "disableSignUp"
	| "overrideUserInfo"
	| "pkce"
	| "redirectURI"
	| "scopes"
> & {
	clientId: string;
	clientSecret: string;
};

export type EmailFactory = (accountId: string, providerId: string) => string;

export interface EmailFallbackOptions {
	/**
	 * Domain used when the provider does not return a real email address.
	 *
	 * @default "tempemail.com"
	 */
	emailDomain?: string;
	/**
	 * Override generated fallback emails.
	 */
	getEmail?: EmailFactory;
}

export function fallbackEmail(
	accountId: string,
	providerId: string,
	options: EmailFallbackOptions,
) {
	return (
		options.getEmail?.(accountId, providerId) ??
		`${accountId}@${options.emailDomain ?? "tempemail.com"}`
	);
}

export function splitScopes(scope: string | undefined, fallback: string[]) {
	return (
		scope
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) ?? fallback
	);
}
