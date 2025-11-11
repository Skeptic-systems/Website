declare module "drizzle-kit" {
  type Config = {
    schema: string;
    out: string;
    dialect: string;
    dbCredentials: {
      url: string;
      [key: string]: string;
    };
  };

  export function defineConfig(config: Config): Config;
}






