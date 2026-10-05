// Used by `ng serve` and `ng test`. Points to the API from the server repo's
// docker-compose.yml, so local work never touches the production database.
export const environment = {
  production: false,
  apiUri: 'http://localhost:8080/'
};
