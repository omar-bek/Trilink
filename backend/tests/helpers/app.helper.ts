import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';

let app: Express;

/**
 * Get the Express app instance for testing
 */
export const getApp = (): Express => {
  if (!app) {
    app = createApp();
  }
  return app;
};

/**
 * Create a supertest request instance
 */
export const requestApp = () => {
  return request(getApp());
};
