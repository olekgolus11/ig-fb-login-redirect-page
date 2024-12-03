import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const app = new Application();
const router = new Router();

// Facebook Login Endpoint
router.get("/facebook-login", async (ctx) => {
    // Handle Facebook OAuth redirect
    console.log(ctx.request.url.searchParams);
    const code = ctx.request.url.searchParams.get("code");
    if (!code) {
        ctx.response.body = "Error: No code provided";
        return;
    }
    console.log(`Code: ${code}`);

    // Exchange code for access token
    let shortLivedTokenData;
    try {
        const shortLivedTokenResponse = await fetch(
            "https://graph.facebook.com/v21.0/oauth/access_token",
            {
                method: "POST",
                body: new URLSearchParams({
                    client_id: Deno.env.get("APP_ID")!,
                    client_secret: Deno.env.get("APP_SECRET")!,
                    code: code,
                    redirect_uri: Deno.env.get("REDIRECT_URI")!,
                }),
            },
        );
        console.log(
            `Token Response: ${JSON.stringify(shortLivedTokenResponse)}`,
        );
        shortLivedTokenData = await shortLivedTokenResponse.json();
        console.log(`Token Data: ${JSON.stringify(shortLivedTokenData)}`);
    } catch (error) {
        console.log(error);
    }

    // Exchange short-lived token for long-lived token
    let longLivedTokenData;
    try {
        const longLivedTokenResponse = await fetch(
            "https://graph.facebook.com/v21.0/oauth/access_token",
            {
                method: "GET",
                client_id: Deno.env.get("APP_ID")!,
                client_secret: Deno.env.get("APP_SECRET")!,
                grant_type: "fb_exchange_token",
                fb_exchange_token: shortLivedTokenData.access_token,
            },
        );
        console.log(
            `Long Lived Token Response: ${
                JSON.stringify(longLivedTokenResponse)
            }`,
        );
        longLivedTokenData = await longLivedTokenResponse.json();
        console.log(
            `Long Lived Token Data: ${JSON.stringify(longLivedTokenData)}`,
        );
    } catch (error) {
        console.log(error);
    }

    // Fetch user info
    let userData;
    try {
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=name,email&access_token=${longLivedTokenData.access_token}`,
        );
        console.log(`User Response: ${JSON.stringify(userResponse)}`);
        userData = await userResponse.json();
        console.log(`User Data: ${JSON.stringify(userData)}`);
    } catch (error) {
        console.log(error);
    }

    ctx.response.body = userData;
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
