# @tenshowinnovation/better-auth-cn-plugins

Better Auth OAuth provider helpers for WeChat and Douyin.

## Install

```sh
pnpm add @tenshowinnovation/better-auth-cn-plugins
```

This package expects `better-auth >=1.6.0` to be installed by your app.

## Usage

```ts
import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { douyin, wechat } from "@tenshowinnovation/better-auth-cn-plugins";

export const auth = betterAuth({
	plugins: [
		genericOAuth({
			config: [
				wechat({
					clientId: process.env.WECHAT_CLIENT_KEY!,
					clientSecret: process.env.WECHAT_CLIENT_SECRET!,
				}),
				douyin({
					clientId: process.env.DOUYIN_CLIENT_KEY!,
					clientSecret: process.env.DOUYIN_CLIENT_SECRET!,
				}),
			],
		}),
	],
});
```

Better Auth's generic OAuth callback path is:

```txt
/api/auth/oauth2/callback/{providerId}
```

For the default providers, configure these callback paths in the WeChat and Douyin developer consoles:

```txt
/api/auth/oauth2/callback/wechat
/api/auth/oauth2/callback/douyin
```

## Provider Notes

- WeChat `clientId` is the WeChat appid, and `clientSecret` is the app secret.
- Douyin `clientId` is the Douyin `client_key`, and `clientSecret` is `client_secret`.
- WeChat defaults to the `snsapi_login` scope.
- Douyin defaults to the `user_info` scope.
- Both providers generate a fallback email because neither provider reliably returns one.

## Fallback Emails

By default, fallback emails use `${accountId}@tempemail.com`.

```ts
wechat({
	clientId: process.env.WECHAT_CLIENT_KEY!,
	clientSecret: process.env.WECHAT_CLIENT_SECRET!,
	emailDomain: "example.local",
});
```

You can fully override the generated email:

```ts
douyin({
	clientId: process.env.DOUYIN_CLIENT_KEY!,
	clientSecret: process.env.DOUYIN_CLIENT_SECRET!,
	getEmail: (accountId, providerId) => `${providerId}-${accountId}@example.local`,
});
```

## Subpath Imports

```ts
import { wechat } from "@tenshowinnovation/better-auth-cn-plugins/wechat";
import { douyin } from "@tenshowinnovation/better-auth-cn-plugins/douyin";
```
