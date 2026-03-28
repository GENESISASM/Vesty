export interface ApiResponse< T = any > {
    success: boolean;
    code: string;
    message: string;
    data?: T;
}

export const responseBuilder = < T = any > (
    success: boolean,
    code: string,
    data?: T,
    message?: string
): ApiResponse < T > => {
    return {
        success,
        code,
        message: message ?? (success ? 'Success' : 'Failed'),
        data: data ?? undefined,
    }
}