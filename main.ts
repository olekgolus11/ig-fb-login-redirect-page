import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const app = new Application();
const router = new Router();

// Facebook Login Endpoint
router.get("/facebook-login", async (ctx) => {
    // Handle Facebook OAuth redirect
    console.log(ctx.request.url.searchParams);
    const { code } = ctx.request.url.searchParams;
    console.log(`Code: ${code}`);

    // Exchange code for access token
    let tokenData;
    try {
        const tokenResponse = await fetch(
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
        console.log(`Token Response: ${JSON.stringify(tokenResponse)}`);

        tokenData = await tokenResponse.json();
        console.log(`Token Data: ${JSON.stringify(tokenData)}`);
    } catch (error) {
        console.log(error);
    }

    // Fetch user info
    let userData;
    try {
        const userResponse = await fetch(
            `https://graph.facebook.com/me?fields=name,email&access_token=${tokenData.access_token}`,
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
