# Refresh Token Expiry Implementation

This document describes the implementation of refresh token expiry checking in the NestJS authentication system.

## Overview

The system now stores both the refresh token and its expiry time in the database, providing enhanced security by checking both token validity and expiration.

## Changes Made

### 1. Database Schema

- The `UserEntity` already had an `expiryIn` field (timestamp) to store the refresh token expiry time
- The `refreshToken` field stores the hashed refresh token

### 2. User Service Updates (`src/users/services/users.service.ts`)

#### Modified Methods:

- `updateUserRefreshToken(id, refreshToken, expiryTime?)`: Now accepts an optional expiry time parameter
- `isRefreshTokenValid(id, refreshToken)`: Now checks both token validity and expiry time

#### New Methods:

- `clearExpiredRefreshTokens()`: Cleans up all expired refresh tokens from the database
- `clearUserRefreshToken(id)`: Clears a specific user's refresh token
- `getExpiredRefreshTokensCount()`: Returns count of expired tokens for monitoring

### 3. Auth Service Updates (`src/auth/services/auth.service.ts`)

#### Modified Methods:

- `login()`: Now calculates and stores expiry time with refresh token
- `refreshTokens()`: Now calculates and stores expiry time with new refresh token

#### New Methods:

- `logout(userId)`: Clears user's refresh token from database
- `calculateRefreshTokenExpiry()`: Private method to calculate expiry based on JWT config

### 4. Auth Controller Updates (`src/auth/controllers/auth.controller.ts`)

#### New Endpoint:

- `POST /auth/logout`: Logs out user by clearing their refresh token

## How It Works

### 1. Login Process

1. User provides credentials
2. System validates credentials
3. System generates access token and refresh token
4. System calculates expiry time based on JWT configuration (default: 7 days)
5. System stores hashed refresh token and expiry time in database
6. System returns both tokens to client

### 2. Token Refresh Process

1. Client sends refresh token
2. System checks if token exists in database
3. System verifies token hash matches
4. System checks if token is expired (current time > stored expiry time)
5. If valid and not expired, system generates new tokens
6. System stores new refresh token with new expiry time
7. System returns new tokens to client

### 3. Logout Process

1. Client sends logout request with valid access token
2. System extracts user ID from token
3. System clears refresh token and expiry time from database
4. System returns success message

## Configuration

The refresh token expiry is configured in `src/auth/config/refresh-jwt.config.ts`:

```typescript
export const refreshJwtConfig: JwtModuleOptions = {
  secret: process.env.REFRESH_JWT_SECRET,
  signOptions: {
    expiresIn: '7d', // 7 days
  },
};
```

Supported time units:

- `s`: seconds
- `m`: minutes
- `h`: hours
- `d`: days

## API Endpoints

### Authentication Endpoints

1. **Login** - `POST /auth/login`

   ```json
   {
     "username": "user@example.com",
     "password": "password123"
   }
   ```

   Response:

   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

2. **Refresh Token** - `POST /auth/refresh`

   ```json
   {
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

   Response: Same as login

3. **Logout** - `POST /auth/logout`
   Headers: `Authorization: Bearer <access_token>`
   Response:

   ```json
   {
     "message": "Successfully logged out"
   }
   ```

4. **Get Current User** - `GET /auth/me`
   Headers: `Authorization: Bearer <access_token>`
   Response:
   ```json
   {
     "username": "user@example.com",
     "sub": 1,
     "iat": 1234567890,
     "exp": 1234567890
   }
   ```

## Security Features

1. **Token Hashing**: Refresh tokens are hashed using bcrypt before storage
2. **Expiry Checking**: System checks both token validity and expiry time
3. **Automatic Cleanup**: Expired tokens can be cleaned up using `clearExpiredRefreshTokens()`
4. **Logout Invalidation**: Logout immediately invalidates refresh tokens

## Database Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  user_name VARCHAR UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,
  email VARCHAR NOT NULL,
  refresh_token VARCHAR(500),
  expiry_in TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring and Maintenance

### Check Expired Tokens Count

```typescript
const expiredCount = await usersService.getExpiredRefreshTokensCount();
console.log(`Found ${expiredCount} expired refresh tokens`);
```

### Clean Up Expired Tokens

```typescript
const clearedCount = await usersService.clearExpiredRefreshTokens();
console.log(`Cleared ${clearedCount} expired refresh tokens`);
```

## Best Practices

1. **Regular Cleanup**: Schedule regular cleanup of expired tokens
2. **Monitoring**: Monitor expired token counts
3. **Short Expiry**: Use reasonable expiry times (7-30 days for refresh tokens)
4. **Secure Storage**: Always hash tokens before database storage
5. **Immediate Invalidation**: Clear tokens on logout

## Error Handling

The system provides comprehensive error handling:

- Invalid credentials
- Expired tokens
- Invalid tokens
- Database errors
- Network errors

All errors are logged with appropriate context for debugging and monitoring.
