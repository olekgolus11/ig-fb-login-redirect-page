export interface ShortLivedAccessTokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface LongLivedAccessTokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export interface FacebookConnectedPageData {
    access_token: string;
    category: string;
    category_list: {
        id: string;
        name: string;
    }[];
    name: string;
    id: string;
    tasks: string[];
}

export interface InstagramBusinessAccountData {
    instagram_business_account: {
        id: string;
    };
    id: string;
}

export interface UserData {
    name: string;
    email: string;
    access_token: string;
    id: string;
}

export interface InstagramUserData {
    id: string;
    access_token: string;
}

export interface InstagramInsight {
    name: string;
    period: string;
    values: {
        value: number;
    }[];
    title: string;
    description: string;
    id: string;
}
