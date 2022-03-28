import dotenv from 'dotenv';
dotenv.config({ path: __dirname + `/./../../.env.${process.env.NODE_ENV}` });
const config = {
  port: process.env.APPLICATION_PORT,
};

export default config;
