export interface UserIdentityDetail {
    code: number
    account: UserAccount
    profile: UserProfile
}

// 账号层（权限 / 状态 / 付费）
export interface UserAccount {
    id: string
    userName: string
    type: number
    status: number
    whitelistAuthority: number
    createTime: number
    tokenVersion: number
    ban: number
    baoyueVersion: number
    donateVersion: number
    vipType: number
    anonimousUser: boolean
    paidFee: boolean
}

// 用户资料层（展示 / 社交）
export interface UserProfile {
    userId: string
    userType: number
    nickname: string
    avatarImgId: number
    avatarUrl: string
    backgroundImgId: number
    backgroundUrl: string
    signature: string | null
    createTime: number
    userName: string
    accountType: number
    shortUserName: string
    birthday: number
    authority: number
    gender: number
    accountStatus: number
    province: number
    city: number
    authStatus: number
    description: string | null
    detailDescription: string | null
    defaultAvatar: boolean
    expertTags: unknown[] | null
    experts: unknown[] | null
    djStatus: number
    locationStatus: number
    vipType: number
    followed: boolean
    mutual: boolean
    authenticated: boolean
    lastLoginTime: number
    lastLoginIP: string
    remarkName: string | null
    viptypeVersion: number
    authenticationTypes: number
    avatarDetail: unknown | null
    anchor: boolean
}

// 登录接口返回值s
export interface UserLoginKey {
    code: number
    data: {
        unikey: string
    }
}

// 请求二维码
export interface UserLoginQRcode {
    code: number
    data: {
        qrurl: string
        qrimg: string
    }
}

// 轮询二维码状态
export interface UserLoginQRcodeStatus {
    code: number
    cookie?: string
    avatarUrl?: string
    message?: string
    nickname?: string

}