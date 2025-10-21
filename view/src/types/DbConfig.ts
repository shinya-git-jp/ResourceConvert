export interface DbConfig {
  name: string;
  dbType: "MySQL" | "PostgreSQL" | "Oracle" | "SQLServer";
  host: string;
  port: number;
  dbName: string;
  username: string;
  password: string;
}