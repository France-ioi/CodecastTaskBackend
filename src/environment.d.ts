declare global {
    namespace NodeJS {
        interface ProcessEnv {
            TEST_MODE: boolean,
            TEST_MODE_PLATFORM_NAME: string,
            BASE_URL: string,
        }
    }
}

export {}
