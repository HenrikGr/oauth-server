# HGC Oauth 2
An oauth 2 server implementation that supports grants such as;
- password
- refresh_token
- client_credential
- authorization code

# Request password grant type
- getClient,
- getUser,
- validate scope
- saveToken

# Request refresh_token grant
- getClient
- getRefreshToken
- revokeToken
- saveToken

# Request client_credentials grant type
- getClient,
- getUserFromClient,
- validateScope,
- saveToken
