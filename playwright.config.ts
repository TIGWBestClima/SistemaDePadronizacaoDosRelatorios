import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,workers:1,globalSetup:'./tests/servidor.ts',use:{channel:'msedge',headless:true,viewport:{width:1440,height:1000},baseURL:'http://127.0.0.1:5174'}});
