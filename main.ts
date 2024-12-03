import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import FacebookService from "./FacebookService.ts";

const app = new Application();
const router = new Router();

// Facebook Login Endpoint
router.get("/facebook-login", async (ctx) => {
    const fbService = new FacebookService(
        Deno.env.get("APP_ID"),
        Deno.env.get("APP_SECRET"),
        Deno.env.get("REDIRECT_URI"),
    );
    // Handle Facebook OAuth redirect
    const code = fbService.getCodeFromSearchParams(
        ctx.request.url.searchParams,
    );

    // Exchange code for access token
    const shortLivedTokenData = await fbService.getShortLivedTokenData(code);
    const longLivedTokenData = await fbService.getLongLivedTokenData(
        shortLivedTokenData.access_token,
    );

    // Fetch user info
    let userData;
    try {
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=name,email&access_token=${longLivedTokenData.access_token}`,
        );
        userData = await userResponse.json();
        console.log(`User Data: ${JSON.stringify(userData)}`);
    } catch (error) {
        console.log(error);
    }
    let instagramAccountInfo = await fbService.getInstagramAccountId(
        longLivedTokenData.access_token,
    );

    ctx.response.body = {
        ...userData,
        ...instagramAccountInfo,
    };
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
