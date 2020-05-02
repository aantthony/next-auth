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

For a full example see /example.

