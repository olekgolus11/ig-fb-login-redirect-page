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

export interface InstagramSearchPost {
    business_discovery: Business_discovery;
}
interface Business_discovery {
    name: string;
    username: string;
    followers_count: number;
    media_count: number;
    media: Media;
}
interface Media {
    data: DataItem[];
}
interface DataItem {
    media_type: string;
    permalink: string;
    comments_count: number;
    caption: string;
    wieczór: string;
    media_url: string;
    id: string;
}
