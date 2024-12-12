import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import FacebookService from "./FacebookService.ts";

const app = new Application();
const router = new Router();

// Facebook Login Endpoint
router.get("/facebook-login", async (ctx) => {
    try {
        const fbService = new FacebookService(
            Deno.env.get("APP_ID"),
            Deno.env.get("APP_SECRET"),
            Deno.env.get("REDIRECT_URI"),
        );
        const code = fbService.getCodeFromSearchParams(
            ctx.request.url.searchParams,
        );

        const shortLivedTokenData = await fbService.getShortLivedTokenData(
            code,
        );
        const longLivedTokenData = await fbService.getLongLivedTokenData(
            shortLivedTokenData.access_token,
        );

        const userData = await fbService.getUserDataFromToken(
            longLivedTokenData.access_token,
        );
        await fbService.saveUserData({
            ...userData,
            access_token: longLivedTokenData.access_token,
        });

        ctx.response.body = {
            ...userData,
        };
    } catch (error: any) {
        console.error(error.message);
        ctx.response.body = `Error logging in with Facebook: ${
            JSON.stringify(error)
        }`;
    }
});

// Get Instagram Posts Endpoint
router.get("/instagram-user-posts", async (ctx) => {
    try {
        const fbService = new FacebookService(
            Deno.env.get("APP_ID"),
            Deno.env.get("APP_SECRET"),
            Deno.env.get("REDIRECT_URI"),
        );
        const username = fbService.getUsernameFromSearchParams(
            ctx.request.url.searchParams,
        );
        const adminUserId = "122105006888598400";
        const userData = await fbService.getUserDataFromUserId(adminUserId);
        const instagramAccountInfo = await fbService.getInstagramAccountIds(
            userData.access_token,
        );
        const instagramPostsData = await Promise.all(
            instagramAccountInfo.map((account) => {
                return fbService.searchInstagramPostsByUsername(
                    account.id,
                    userData.access_token,
                    username,
                );
            }),
        );

        ctx.response.body = {
            ...instagramPostsData,
        };
    } catch (error: any) {
        console.error(error.message);
        ctx.response.body = `Error getting Instagram posts: ${
            JSON.stringify(error)
        }`;
    }
});

// Get Instagram Posts Endpoint
router.get("/instagram-posts", async (ctx) => {
    try {
        const fbService = new FacebookService(
            Deno.env.get("APP_ID"),
            Deno.env.get("APP_SECRET"),
            Deno.env.get("REDIRECT_URI"),
        );
        const userId = fbService.getUserIdFromSearchParams(
            ctx.request.url.searchParams,
        );
        const withInsights = fbService.getWithInsightsFromSearchParams(
            ctx.request.url.searchParams,
        );
        const userData = await fbService.getUserDataFromUserId(userId);
        const instagramAccountInfo = await fbService.getInstagramAccountIds(
            userData.access_token,
        );
        const instagramPostsData = await Promise.all(
            instagramAccountInfo.map((account) => {
                return fbService.getInstagramPosts(
                    account.id,
                    userData.access_token,
                    withInsights,
                );
            }),
        );

        ctx.response.body = {
            ...instagramPostsData,
        };
    } catch (error: any) {
        console.error(error.message);
        ctx.response.body = `Error getting Instagram posts: ${
            JSON.stringify(error)
        }`;
    }
});

// Search Instagram Posts By Hashtag Endpoint
router.get("/instagram-posts-by-hashtag", async (ctx) => {
    try {
        const fbService = new FacebookService(
            Deno.env.get("APP_ID"),
            Deno.env.get("APP_SECRET"),
            Deno.env.get("REDIRECT_URI"),
        );
        const userId = fbService.getUserIdFromSearchParams(
            ctx.request.url.searchParams,
        );
        const query = fbService.getQueryFromSearchParams(
            ctx.request.url.searchParams,
        );
        const searchType = fbService.getHashTagSearchTypeFromSearchParams(
            ctx.request.url.searchParams,
        );
        const userData = await fbService.getUserDataFromUserId(userId);
        const instagramAccountInfo = await fbService.getInstagramAccountIds(
            userData.access_token,
        );
        const instagramPostsData = await Promise.all(
            instagramAccountInfo.map((account) => {
                return fbService.getInstagramMediaByHashTag(
                    query,
                    account,
                    searchType,
                );
            }),
        );

        ctx.response.body = {
            ...instagramPostsData,
        };
    } catch (error: any) {
        console.error(error.message);
        ctx.response.body = `Error getting Instagram posts by hashtag: ${
            JSON.stringify(error)
        }`;
    }
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
