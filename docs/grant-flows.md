# The authorization service

This package supports the following grant flows.
- password
- refresh_token
- client_credential
- authorization code

Each grant flow invoke different functions in the model.

# Request password grant
- getClient,
- getUser,
- validate scope
- saveToken

# Request refresh_token grant
- getClient
- getRefreshToken
- revokeToken
- saveToken

# Request client_credentials grant
- getClient,
- getUserFromClient,
- validateScope,
- saveToken

# Request authorization_code grant
- getClient,
- getUserFromClient,
- validateScope,
- saveToken
