export interface LanguageMap {
  country1: string;
  country2: string;
  country3: string;
  country4: string;
  country5: string;
}
export interface DbConfig {
  name: string;
  dbType: "MySQL" | "PostgreSQL" | "Oracle" | "SQLServer";
  host: string;
  port: number | "";
  dbName: string;
  username: string;
  password: string;
  languageMap: LanguageMap;
}
