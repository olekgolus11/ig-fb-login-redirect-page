import { Application, Router } from "https://deno.land/x/oak@v17.1.3/mod.ts";

const app = new Application();
const router = new Router();

// Facebook Login Endpoint
router.get("/facebook-login", async (ctx) => {
    // Handle Facebook OAuth redirect
    const { code } = ctx.request.url.searchParams;

    // Exchange code for access token
    const tokenResponse = await fetch(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        {
            method: "POST",
            body: new URLSearchParams({
                client_id: "YOUR_APP_ID",
                client_secret: "YOUR_APP_SECRET",
                code: code,
                redirect_uri: "YOUR_REDIRECT_URI",
            }),
        },
    );

    const tokenData = await tokenResponse.json();

    // Fetch user info
    const userResponse = await fetch(
        `https://graph.facebook.com/me?fields=name,email&access_token=${tokenData.access_token}`,
    );
    const userData = await userResponse.json();

    ctx.response.body = userData;
});

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
