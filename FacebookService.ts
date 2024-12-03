import {
    FacebookConnectedPageData,
    InstagramBusinessAccountData,
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

    /**
     * @param longLivedAccessToken
     * @returns Instagram Account IDs
     * @link https://superface.ai/blog/instagram-account-id
     */
    async getInstagramAccountIds(longLivedAccessToken: string) {
        const accountsResponse = await fetch(
            `https://graph.facebook.com/v21.0/me/accounts?
          access_token=${longLivedAccessToken}`,
        );

        const accountsData = await accountsResponse.json();
        console.log(`Accounts Data: ${JSON.stringify(accountsData)}`);

        // Find the page connected to Instagram
        const facebookConnectedPages = accountsData
            .data as FacebookConnectedPageData[];

        console.log(
            `Instagram Page: ${JSON.stringify(facebookConnectedPages)}`,
        );

        const instagramAccountIds = await Promise.all(
            facebookConnectedPages.map(async (page) => {
                const instagramAccountResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
                );
                const instagramAccountData = await instagramAccountResponse
                    .json() as InstagramBusinessAccountData;
                console.log(
                    `Instagram Account Data: ${
                        JSON.stringify(instagramAccountData)
                    }`,
                );
                return instagramAccountData.instagram_business_account.id;
            }),
        );

        return instagramAccountIds;
    }
}

export default FacebookService;