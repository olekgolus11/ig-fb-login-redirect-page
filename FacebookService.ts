import {
    LongLivedAccessTokenData,
    ShortLivedAccessTokenData,
} from "./types.ts";

class FacebookService {
    private appId: string;
    private appSecret: string;
    private redirectUri: string;

    constructor(appId?: string, appSecret?: string, redirectUri?: string) {
        if (!appId || !appSecret || !redirectUri) {
            throw new Error("Error: Missing required parameters");
        }
        this.appId = appId;
        this.appSecret = appSecret;
        this.redirectUri = redirectUri;
    }

    getCodeFromSearchParams(searchParams: URLSearchParams): string {
        const code = searchParams.get("code");
        if (!code) {
            console.error(searchParams);
            throw new Error("Error: No code provided");
        }
        return code;
    }

    async getShortLivedTokenData(
        code: string,
    ): Promise<ShortLivedAccessTokenData> {
        try {
            const shortLivedTokenResponse = await fetch(
                "https://graph.facebook.com/v21.0/oauth/access_token",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        client_id: this.appId,
                        client_secret: this.appSecret,
                        code: code,
                        redirect_uri: this.redirectUri,
                    }),
                },
            );
            const shortLivedTokenData: ShortLivedAccessTokenData =
                await shortLivedTokenResponse.json();
            console.log(`Token Data: ${JSON.stringify(shortLivedTokenData)}`);
            return shortLivedTokenData;
        } catch (error) {
            console.error(error);
            throw new Error("Error getting short-lived token data");
        }
    }

    async getLongLivedTokenData(
        shortLivedToken: string,
    ): Promise<LongLivedAccessTokenData> {
        try {
            const longLivedTokenResponse = await fetch(
                "https://graph.facebook.com/v21.0/oauth/access_token",
                {
                    method: "POST",
                    body: new URLSearchParams({
                        client_id: this.appId,
                        client_secret: this.appSecret,
                        grant_type: "fb_exchange_token",
                        fb_exchange_token: shortLivedToken,
                    }),
                },
            );
            const longLivedTokenData: LongLivedAccessTokenData =
                await longLivedTokenResponse.json();
            console.log(
                `Long Lived Token Data: ${JSON.stringify(longLivedTokenData)}`,
            );
            return longLivedTokenData;
        } catch (error) {
            console.error(error);
            throw new Error("Error getting long-lived token data");
        }
    }

    async getInstagramAccountId(longLivedAccessToken: string) {
        const response = await fetch(`https://graph.facebook.com/me/accounts?
          access_token=${longLivedAccessToken}`);

        const accountsData = await response.json();

        // Find the page connected to Instagram
        const instagramPage = accountsData.data.find((page: any) =>
            page.connected_instagram_account
        );
        console.log(`Instagram Page: ${JSON.stringify(instagramPage)}`);

        return {
            pageId: instagramPage.id,
            pageAccessToken: instagramPage.access_token,
            instagramAccountId: instagramPage.connected_instagram_account,
        };
    }
}

export default FacebookService;
