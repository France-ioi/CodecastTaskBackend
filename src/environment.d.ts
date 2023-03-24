declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TEST_MODE: boolean,
      TEST_MODE_PLATFORM_NAME: string,
      BASE_URL: string,
      GRADER_QUEUE_DEFAULT_TAGS: string,
      GRADER_QUEUE_PUBLIC_KEY: string,
      GRADER_QUEUE_OWN_PRIVATE_KEY: string,
      GRADER_QUEUE_OWN_NAME: string,
      GRADER_QUEUE_URL: string,
      GRADER_QUEUE_DEBUG: boolean,
    }
  }
}

export {};
