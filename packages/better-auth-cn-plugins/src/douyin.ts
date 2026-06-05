import type { GenericOAuthConfig } from "better-auth/plugins/generic-oauth";

import {
	fallbackEmail,
	type EmailFallbackOptions,
	type ProviderBaseOptions,
	splitScopes,
} from "./shared";

export const douyinAuthorizationUrl = "https://open.douyin.com/platform/oauth/connect";
export const douyinTokenUrl = "https://open.douyin.com/oauth/access_token/";
export const douyinUserInfoUrl = "https://open.douyin.com/oauth/userinfo/";

export interface DouyinOptions extends ProviderBaseOptions, EmailFallbackOptions {
	/**
	 * Unique provider identifier.
	 *
	 * @default "douyin"
	 */
	providerId?: string;
}

export interface DouyinTokenResponseData {
	[key: string]: unknown;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	refresh_expires_in: number;
	open_id: string;
	scope: string;
	error_code?: number;
	description?: string;
}

export interface DouyinUserInfoData {
	open_id: string;
	union_id?: string;
	nickname: string;
	avatar: string;
	error_code?: number;
	description?: string;
}

export interface DouyinEnvelope<T> {
	data?: T;
	message?: string;
}

const defaultDouyinScopes = ["user_info"];

export function douyin(options: DouyinOptions): GenericOAuthConfig {
	const providerId = options.providerId ?? "douyin";

	return {
		providerId,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		authorizationUrl: douyinAuthorizationUrl,
		tokenUrl: douyinTokenUrl,
		userInfoUrl: douyinUserInfoUrl,
		scopes: options.scopes ?? defaultDouyinScopes,
		redirectURI: options.redirectURI,
		pkce: options.pkce,
		disableImplicitSignUp: options.disableImplicitSignUp,
		disableSignUp: options.disableSignUp,
		overrideUserInfo: options.overrideUserInfo,
		authorizationUrlParams: {
			client_key: options.clientId,
		},
		async getToken({ code }) {
			const params = new URLSearchParams({
				client_key: options.clientId,
				client_secret: options.clientSecret,
				code,
				grant_type: "authorization_code",
			});

			const response = await fetch(douyinTokenUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: params,
			});

			const json = (await response.json()) as DouyinEnvelope<DouyinTokenResponseData>;
			const data = json?.data;

			if (!response.ok || !data?.access_token || data.error_code) {
				throw new Error(
					`Douyin OAuth error: ${data?.description ?? json.message ?? response.statusText}`,
				);
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
				refreshTokenExpiresAt: new Date(Date.now() + data.refresh_expires_in * 1000),
				scopes: splitScopes(data.scope, defaultDouyinScopes),
				raw: data,
			};
		},
		async getUserInfo(tokens) {
			const openId = (tokens.raw as DouyinTokenResponseData | undefined)?.open_id;

			if (!tokens.accessToken || !openId) {
				throw new Error("Douyin access token or open_id is required");
			}

			const url = new URL(douyinUserInfoUrl);
			url.searchParams.set("access_token", tokens.accessToken);
			url.searchParams.set("open_id", openId);

			let json: DouyinEnvelope<DouyinUserInfoData> | null = null;
			try {
				const response = await fetch(url);
				json = (await response.json()) as DouyinEnvelope<DouyinUserInfoData>;
			} catch {
				return null;
			}

			const data = json.data;
			if (!data || data.error_code || !data.open_id) {
				return null;
			}

			const accountId = data.union_id || data.open_id;

			return {
				id: accountId,
				name: data.nickname || "douyin-user",
				username: data.nickname,
				emailVerified: false,
				email: fallbackEmail(accountId, providerId, options),
				image: data.avatar,
			};
		},
	};
}
