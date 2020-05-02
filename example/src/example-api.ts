export default class Api {
  private accessToken: string | null;
  constructor(accessToken: string | null) {
    this.accessToken = accessToken;
  }

  async getInfo() {
    if (this.accessToken) {
      return { message: `access token: ${this.accessToken}` }
    } else {
      return { message: 'Not logged in.' }
    }
  }
}
