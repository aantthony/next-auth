import React from 'react';
import Router from 'next/router';

import auth from '../auth';

export default function Homepage (props: {
  content: string;
}) {
  function setValue(val: string | null) {
    auth.setCookieValue(val);
    Router.replace('/');
  }

  return (
    <div>
      <div>
        content: {props.content}
      </div>
      <div>
        <button type="button" onClick={() => setValue('abc')}>Simulate login</button>
        <button type="button" onClick={() => setValue(null)}>Simulate log out</button>
       </div>
    </div>
  );
}

auth.bind(Homepage, async ({ api }) => {
  const data = await api.getInfo();
  return {
    content: data.message,
  };
});
