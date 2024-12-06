import {
    FacebookConnectedPageData,
    InstagramBusinessAccountData,
    InstagramUserData,
    LongLivedAccessTokenData,
    ShortLivedAccessTokenData,
    UserData,
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

    getUserIdFromSearchParams(searchParams: URLSearchParams): string {
        const userId = searchParams.get("user_id");
        if (!userId) {
            console.error(searchParams);
            throw new Error("Error: No user_id provided");
        }
        return userId;
    }

    getQueryFromSearchParams(searchParams: URLSearchParams): string {
        const query = searchParams.get("q");
        if (!query) {
            console.error(searchParams);
            throw new Error("Error: No query provided");
        }
        return query;
    }

    getHashTagSearchTypeFromSearchParams(
        searchParams: URLSearchParams,
    ): "recent" | "top" | null {
        const searchType = searchParams.get("type") as "recent" | "top" | null;
        if (!searchType) {
            console.error(searchParams);
            return null;
        }
        return searchType;
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
    async getInstagramAccountIds(
        longLivedAccessToken: string,
    ): Promise<InstagramUserData[]> {
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
                return {
                    id: instagramAccountData.instagram_business_account.id,
                    access_token: page.access_token,
                };
            }),
        );

        return instagramAccountIds;
    }

    async getInstagramMediaByHashTag(
        hashTag: string,
        userData: InstagramUserData,
        searchType: "recent" | "top" | null = "recent",
    ) {
        console.log(
            `https://graph.facebook.com/v21.0/ig_hashtag_search?q=${hashTag}&user_id=${userData.id}&access_token=${userData.access_token}`,
        );
        const igHashTagSearchResponse = await fetch(
            `https://graph.facebook.com/v21.0/ig_hashtag_search?q=${hashTag}&user_id=${userData.id}&access_token=${userData.access_token}`,
        );
        const igHashTagIdData = await igHashTagSearchResponse.json();
        console.log(`HashTag Data: ${JSON.stringify(igHashTagIdData)}`);
        const igHashTagId = igHashTagIdData.data[0].id;
        console.log(`HashTag "${hashTag}" ID: ${igHashTagId}`);

        switch (searchType) {
            case "recent": {
                const igRecentMediaResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${igHashTagId}/recent_media?user_id=${userData.id}&fields=caption,like_count,media_url&access_token=${userData.access_token}`,
                );
                const igRecentMediaData = await igRecentMediaResponse.json();
                console.log(
                    `Recent Media: ${JSON.stringify(igRecentMediaData)}`,
                );
                return igRecentMediaData;
            }
            case "top": {
                const igTopMediaResponse = await fetch(
                    `https://graph.facebook.com/v21.0/${igHashTagId}/top_media?user_id=${userData.id}&fields=caption,like_count,media_url&access_token=${userData.access_token}`,
                );
                const igTopMediaData = await igTopMediaResponse.json();
                console.log(`Top Media: ${JSON.stringify(igTopMediaData)}`);
                return igTopMediaData;
            }
            default:
                throw new Error("Invalid search type");
        }
    }

    async saveUserData(userData: UserData) {
        const kv = await Deno.openKv();
        await kv.set(["ig_users", userData.id], userData);
        console.log(`User saved: ${JSON.stringify(userData)}`);
    }

    async getUserDataFromToken(longLivedAccessToken: string) {
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=name,email&access_token=${longLivedAccessToken}`,
        );
        const userData = await userResponse.json();
        console.log(`User Data: ${JSON.stringify(userData)}`);
        return userData;
    }

    async getUserDataFromUserId(userId: string): Promise<UserData> {
        const kv = await Deno.openKv();
        const userData = await kv.get<UserData>(["ig_users", userId]);
        if (!userData.value) {
            throw new Error("Error: User not found");
        }
        return userData.value;
    }

    async getInstagramPosts(instagramAccountId: string, accessToken: string) {
        const postsResponse = await fetch(
            `https://graph.facebook.com/v21.0/${instagramAccountId}/media?fields=id,caption,media_url&access_token=${accessToken}`,
        );
        const postsData = await postsResponse.json();
        console.log(`Posts Data: ${JSON.stringify(postsData)}`);
        return postsData;
    }
}

export default FacebookService;
