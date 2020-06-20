# Terminology
- Access token - A token used to access protected resources.
- Authorization code - An intermediary token generated when a user authorizes a client to access protected resources 
on their behalf. The client receives this token and exchanges it for an access token.
- Authorization server - A server which issues access tokens after successfully authenticating a client and resource owner, 
and authorizing the request.
- Client - An application which accesses protected resources on behalf of the resource owner (such as a user). 
The client could be hosted on a server, desktop, mobile or other device.
- Grant - A grant is a method of acquiring an access token.
- Resource server - A server which sits in front of protected resources (for example “tweets”, users’ photos, or personal data) 
and is capable of accepting and responsing to protected resource requests using access tokens.
- Resource owner - The user who authorizes an application to access their account. The application’s access to the user’s 
account is limited to the “scope” of the authorization granted (e.g. read or write access).
- Scope - A permission.
- JWT - A JSON Web Token is a method for representing claims securely between two parties as defined in RFC 7519.

# Which grant should be used?

- Who is the access_token owner, a machine or a user?
    - If it is a machine, choose **Client Credential Grant** type 
- If the access-token owner is a user, is the client type a user agent based app or a web app?
    - If the client type is a web app, choose **Authorization Grant*** type
- If the client type is a user-agent based app, is the client a first-party client or a third-party?
    - If the client is a first-party, choose **Password Grant** type    
    - if the client is a third-party, choose **Implicit Grant** type

# First party or third party client?
A first party client is a client that you trust enough to handle the end user’s authorization credentials. 
For example Spotify’s iPhone app is owned and developed by Spotify so therefore they implicitly trust it.

A third party client is a client that you don’t trust.

# Access Token Owner?
An access token represents a permission granted to a client to access some protected resources.

If you are authorizing a machine to access resources and you don’t require the permission of a user 
to access said resources you should implement the client credentials grant.

If you require the permission of a user to access resources you need to determine the client type.

# Client Type?
Depending on whether the client is capable of keeping a secret will depend on which grant the client should use.

If the client is a web application that has a server side component then you should implement the authorization code grant.

If the client is a web application that has runs entirely on the front end (e.g. a single page web application) 
you should implement the implicit grant.

If the client is a native application such as a mobile app you should implement the password grant.

Third party native applications should use the authorization code grant (via the native browser, not an 
embedded browser - e.g. for iOS push the user to Safari or use SFSafariViewController, don't use an embedded WKWebView).
