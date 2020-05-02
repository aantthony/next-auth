import createAuth from '../../';

import Api from './example-api';

export default createAuth({
  https: false,
  getContext(accessToken) {
    return {
      // Make the API available to every page
      api: new Api(accessToken),
    };
  },
});
