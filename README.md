# next-simple-auth

Simple cookie authentication system for Next.js

- Uses cookies 🍪
- Written in Typescript
- Supports server-side rendering ⚡️
- Can be used with OAuth bearer tokens / GraphQL / REST apis etc.

```bash
npm install next-simple-auth --save
```

## Usage

Configuration:

```typescript
import createAuth from 'next-simple-auth';

const auth = createAuth({
  cookieExpirySeconds: 86400 * 365, // 1 year
  cookieName: 'access_token',
  https: true,
  getContext(accessToken: string | null) {
    return {
      // Make the API available to every page
      api: new Api(accessToken),
    };
  },
});
export default auth;

```
Then in your pages:

```typescript
import auth from 'src/auth';
export default MyPage(props: { content: string }) {
  return <div>{props.content}</div>;
}

auth.bind(MyPage, async ({ api }) => {
  return {
    content: await api.doSomething(),
  };
});
```

### Hooks:

```typescript
// pages/_app.tsx
import App, { AppContext } from 'next/app';
import auth from 'src/auth';

export default class MyApp extends App<{}> {
  static async getInitialProps(appContext: AppContext) {
    const session = auth.get(appContext.ctx);

    try {
      return App.getInitialProps(appContext);
    } catch (err) {
      if (err.status === 401) {
        auth.redirectToLogin(appContext.ctx);
        return {};
      }
    }
  }
  render() {
    const { Component, pageProps, router } = this.props;

    return (
      <auth.Provider>
        <Component {...pageProps} />
      </auth.Provider>
    );
  }
}

// pages/example.tsx
import auth from 'src/auth';
export default function MyComponent() {
  const session = auth.useSession();
  function onClick() {
    session.api.post('/users/me/images', { x: 32 });
  }
  return <button onClick={onClick}>Do something</button>;
}
```


For a full example see /example.

