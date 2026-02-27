declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class PayPalHttpClient {
      constructor(environment: Environment);
      execute<T = any>(request: any): Promise<{ statusCode: number; result?: T }>;
    }

    export abstract class Environment {
      constructor(clientId: string, clientSecret: string);
    }

    export class SandboxEnvironment extends Environment {}
    export class LiveEnvironment extends Environment {}
  }

  export namespace orders {
    export class OrdersCreateRequest {
      prefer(preference: string): void;
      requestBody(body: any): void;
    }

    export class OrdersGetRequest {
      constructor(orderId: string);
    }

    export class OrdersCaptureRequest {
      constructor(orderId: string);
      requestBody(body: any): void;
    }
  }

  interface PayPalSDK {
    core: typeof core;
    orders: typeof orders;
  }

  const paypal: PayPalSDK;
  export = paypal;
}
