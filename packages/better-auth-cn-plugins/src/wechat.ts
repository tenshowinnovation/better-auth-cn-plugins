import type { GenericOAuthConfig } from "better-auth/plugins/generic-oauth";

import {
	fallbackEmail,
	type EmailFallbackOptions,
	type ProviderBaseOptions,
	splitScopes,
} from "./shared";

export const wechatAuthorizationUrl = "https://open.weixin.qq.com/connect/qrconnect";
export const wechatTokenUrl = "https://api.weixin.qq.com/sns/oauth2/access_token";
export const wechatUserInfoUrl = "https://api.weixin.qq.com/sns/userinfo";

export interface WechatOptions extends ProviderBaseOptions, EmailFallbackOptions {
	/**
	 * Unique provider identifier.
	 *
	 * @default "wechat"
	 */
	providerId?: string;
	/**
	 * Userinfo language.
	 *
	 * @default "zh_CN"
	 */
	lang?: string;
}

export interface WechatUserInfo {
	openid: string;
	nickname: string;
	sex: number;
	province: string;
	city: string;
	country: string;
	headimgurl: string;
	privilege: string[];
	unionid?: string;
}

export interface WechatErrorResponse {
	errcode?: number;
	errmsg?: string;
	errorcode?: number;
	errormsg?: string;
}

export type WechatUserInfoResponse = WechatUserInfo | WechatErrorResponse;

export interface WechatTokenResponse extends WechatErrorResponse {
	[key: string]: unknown;
	access_token: string;
	refresh_token: string;
	expires_in: number;
	openid: string;
	scope: string;
	unionid?: string;
}

const defaultWechatScopes = ["snsapi_login"];

export function wechat(options: WechatOptions): GenericOAuthConfig {
	const providerId = options.providerId ?? "wechat";

	return {
		providerId,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		authorizationUrl: wechatAuthorizationUrl,
		tokenUrl: wechatTokenUrl,
		userInfoUrl: wechatUserInfoUrl,
		scopes: options.scopes ?? defaultWechatScopes,
		redirectURI: options.redirectURI,
		pkce: options.pkce,
		disableImplicitSignUp: options.disableImplicitSignUp,
		disableSignUp: options.disableSignUp,
		overrideUserInfo: options.overrideUserInfo,
		authorizationUrlParams: {
			appid: options.clientId,
		},
		tokenUrlParams: {
			appid: options.clientId,
			secret: options.clientSecret,
		},
		async getToken({ code }) {
			const params = new URLSearchParams({
				appid: options.clientId,
				secret: options.clientSecret,
				code,
				grant_type: "authorization_code",
			});

			const response = await fetch(`${wechatTokenUrl}?${params.toString()}`);
			const data = (await response.json()) as WechatTokenResponse;

			if (!response.ok || hasWechatError(data)) {
				throw new Error(
					`WeChat OAuth error: ${wechatErrorMessage(data) ?? response.statusText}`,
				);
			}

			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				accessTokenExpiresAt: new Date(Date.now() + data.expires_in * 1000),
				scopes: splitScopes(data.scope, defaultWechatScopes),
				raw: data,
			};
		},
		async getUserInfo(tokens) {
			const openid = (tokens.raw as WechatTokenResponse | undefined)?.openid;

			if (!tokens.accessToken || !openid) {
				throw new Error("WeChat access token or openid is required");
			}

			const url = new URL(wechatUserInfoUrl);
			url.searchParams.set("access_token", tokens.accessToken);
			url.searchParams.set("openid", openid);
			url.searchParams.set("lang", options.lang ?? "zh_CN");

			let data: WechatUserInfoResponse | null = null;
			try {
				const response = await fetch(url);
				data = (await response.json()) as WechatUserInfoResponse;
			} catch {
				return null;
			}

			if (!data || hasWechatError(data) || !("openid" in data)) {
				return null;
			}

			const accountId = data.unionid || data.openid;

			return {
				id: accountId,
				name: data.nickname || "wechat-user",
				username: data.nickname,
				emailVerified: false,
				email: fallbackEmail(accountId, providerId, options),
				image: data.headimgurl,
			};
		},
	};
}

function hasWechatError(data: WechatUserInfoResponse | WechatTokenResponse) {
	const errcode = "errcode" in data ? data.errcode : undefined;
	const errorcode = "errorcode" in data ? data.errorcode : undefined;

	return (
		(typeof errcode === "number" && errcode !== 0) ||
		(typeof errorcode === "number" && errorcode !== 0)
	);
}

function wechatErrorMessage(data: WechatErrorResponse) {
	return data.errmsg ?? data.errormsg;
}
