import Cookies from 'js-cookie';
import { IncomingMessage, ServerResponse } from 'http';
import { NextPageContext } from 'next';
import React from 'react';

type RC<P> = React.ComponentClass<P> | React.FunctionComponent<P>;

interface Settings<ContextProps> {
  https: boolean;
  cookieName: string;
  cookieExpirySeconds: number;
  getContext(cookieValue: string | null): ContextProps;
  redirectOn401: string | null;
}

export interface AuthManager<ContextProps> {
  // Get the session object directly (e.g. this could be used in a .getInitialProps function)
  get(ctx: NextPageContext): ContextProps;

  // Set the .getInitalProps function
  bind<P>(Component: RC<P>, fn: (ctx: ContextProps & NextPageContext) => P | Promise<P>): void;

  setCookieValue(newValue: string | null): void;
  redirectToLogin<T>(ctx: NextPageContext): void;
  redirectWithCookie(ctx: NextPageContext, path: string, cookieValue: string): void;

  // Access the session from within a component (client-side only. On server-side, this will return an unauthenticated session object).
  useSession(): ContextProps;

  Provider: RC<{ children: React.ReactNode }>;
}

function getContextServerSide<T>(settings: Settings<T>, req: IncomingMessage, res: ServerResponse): T {
  const cookie = require('cookie');
  const accessToken = cookie.parse(req.headers.cookie || '')[settings.cookieName] || null;

  if (accessToken) {
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0');
  }
  return settings.getContext(accessToken);
}

function getContextClientSide<T>(settings: Settings<T>): T {
  if (typeof window === 'undefined') {
    throw new Error('getContextClientSide() was executed server-side.');
  }
  const accessToken = Cookies.get(settings.cookieName) || null;
  return settings.getContext(accessToken);
}

function getContext<T>(settings: Settings<T>, ctx: NextPageContext): T {
  return ctx.req
    ? getContextServerSide(settings, ctx.req, ctx.res!) // server
    : getContextClientSide(settings); // client
}

function createCookieString<T>(settings: Settings<T>, value: string | null): string {
  if (!value) {
    return `${settings.cookieName}=; Path=/; Max-Age=-1`;
  }

  const expires = new Date(Date.now() + (settings.cookieExpirySeconds) * 1000);

  const cookieString = settings.https
    ? `${settings.cookieName}=${value}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax; Secure`
    : `${settings.cookieName}=${value}; Path=/; Expires=${expires.toUTCString()}; SameSite=Lax`;

  return cookieString;
}


export interface Options<ContextProps> {
  https?: boolean;
  cookieName?: string;
  cookieExpirySeconds?: number;
  redirectOn401?: string;
  getContext(cookieValue: string | null): ContextProps;
}

export default function createAuthManager<T>(options: Options<T>): AuthManager<T> {
  const MyContext = React.createContext(null as (T | null));
  const Provider = MyContext.Provider;

  const settings: Settings<T> = {
   https: options.https === undefined ? true : options.https,
   cookieName: options.cookieName || 'access_token',
   cookieExpirySeconds: options.cookieExpirySeconds || 86400 * 365,
   redirectOn401: options.redirectOn401 || null,
   getContext: options.getContext,
  };

  return {
    bind(Component, fn) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Component as any).getInitialProps = async (ctx: NextPageContext) => {
        const session = getContext(settings, ctx);
        const mapped = { ...ctx, ...session };
        const props = await fn(mapped);
        return props;
      };
    },
    get(ctx: NextPageContext) {
      return getContext(settings, ctx);
    },
    redirectToLogin(ctx) {
      if (ctx.res && ctx.req) {
        const loginParams = ctx.req.url ? require('querystring').stringify({
          from: ctx.req.url.toString(),
        }).replace(/%2F/g, '/') : '';
        if (!settings.redirectOn401) throw new Error('settings.redirectOn401 not set!');
        const path = `${settings.redirectOn401}?${loginParams}`;
        ctx.res.writeHead(302, {
          Location: `${settings.https ? 'https' : 'http'}://${ctx.req.headers.host}/${path}`,
          'Set-Cookie': createCookieString(settings, null),
        });
        ctx.res.end();
      }
    },
    redirectWithCookie(ctx: NextPageContext, path: string, cookieValue: string) {
      const res = ctx.res;
      if (!res) throw new Error('SSR only.');
      if (path[0] === '/') path = path.substring(1);
      res.writeHead(302, {
        Location: `${settings.https ? 'https' : 'http'}://${ctx.req!.headers.host}/${path}`,
        'Set-Cookie': createCookieString(settings, cookieValue),
      });
      res.end();
    },
    Provider(props: { children: React.ReactNode }) {
      const value = typeof window !== 'undefined'
        ? getContextClientSide(settings)
        : settings.getContext(null);

      return React.createElement(Provider, { value }, props.children);
    },
    useSession() {
      const val = React.useContext(MyContext);
      if (!val) throw new Error('useSession was used outside <auth.Provider>...</auth.Provider>');
      return val;
    },
    setCookieValue(value) {
      if (typeof window === 'undefined') throw new Error('.setSession can only be used client-side only.');
      const cookieString = createCookieString(settings, value);
      document.cookie = cookieString;
    },
  };
}
