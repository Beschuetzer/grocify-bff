import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4200;

export const config = {
  server: {
    port: PORT,
  },
};
